WorkoutApp.SyncService = {
    timer: null,
    running: false,

    getConfig() {
        return WorkoutApp.LocalStorage.loadGitHubConfig();
    },

    isConfigured() {
        const config = this.getConfig();

        return Boolean(
            config?.owner &&
            config?.repository &&
            config?.branch &&
            config?.token
        );
    },

    setStatus(state, message) {
        const status = document.querySelector("#sync-status");
        const text = document.querySelector("#sync-status-text");

        status.dataset.state = state;
        text.textContent = message;
    },

    async setup() {
        const config = this.getConfig();

        if (!config) {
            throw new Error("GitHub 설정을 먼저 저장해주세요.");
        }

        this.setStatus("syncing", "GitHub 데이터 브랜치 준비 중");

        await WorkoutApp.GitHubApi.ensureDataBranch(config);
        await WorkoutApp.GitHubApi.ensureDataFile(config);
        await this.syncNow();

        return config;
    },

    schedule() {
        clearTimeout(this.timer);

        if (!this.isConfigured()) {
            this.setStatus("local", "로컬에 저장됨");
            return;
        }

        this.setStatus("syncing", "동기화 대기 중");

        this.timer = setTimeout(() => {
            this.syncNow().catch((error) => {
                console.error(error);
            });
        }, WorkoutApp.Constants.autoSyncDelayMs);
    },

    async syncNow() {
        if (this.running) {
            return;
        }

        const config = this.getConfig();

        if (!config) {
            this.setStatus("local", "GitHub 연결 안 됨 · 로컬 저장");
            throw new Error("GitHub 연결 설정이 없습니다.");
        }

        this.running = true;
        this.setStatus("syncing", "GitHub 동기화 중");

        try {
            await WorkoutApp.GitHubApi.ensureDataBranch(config);

            for (let attempt = 0; attempt < 2; attempt += 1) {
                const remote = await WorkoutApp.GitHubApi.ensureDataFile(config);
                const local = WorkoutApp.Store.getData();

                const merged = WorkoutApp.Schema.mergeDocuments(
                    local,
                    remote.data
                );

                WorkoutApp.Store.replaceData(merged);

                const remoteText = JSON.stringify(remote.data);
                const mergedText = JSON.stringify(merged);

                if (remoteText === mergedText) {
                    break;
                }

                try {
                    await WorkoutApp.GitHubApi.saveDataFile(
                        config,
                        merged,
                        remote.sha
                    );

                    break;
                } catch (error) {
                    if (error.status === 409 && attempt === 0) {
                        continue;
                    }

                    throw error;
                }
            }

            this.setStatus("synced", "GitHub 동기화 완료");
            WorkoutApp.UI.renderCurrentScreen();
        } catch (error) {
            this.setStatus("error", "동기화 실패 · 로컬 기록 유지됨");
            throw error;
        } finally {
            this.running = false;
        }
    }
};
