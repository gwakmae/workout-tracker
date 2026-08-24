WorkoutApp.LocalStorage = {
    loadData() {
        const key = WorkoutApp.Constants.storageKeys.data;
        const raw = localStorage.getItem(key);

        if (!raw) {
            return WorkoutApp.Schema.emptyDocument();
        }

        try {
            return WorkoutApp.Schema.normalizeDocument(JSON.parse(raw));
        } catch (error) {
            console.error("로컬 데이터 파싱 실패:", error);
            return WorkoutApp.Schema.emptyDocument();
        }
    },

    saveData(data) {
        const key = WorkoutApp.Constants.storageKeys.data;
        localStorage.setItem(key, JSON.stringify(data));
    },

    loadGitHubConfig() {
        const key = WorkoutApp.Constants.storageKeys.githubConfig;
        const raw = localStorage.getItem(key);

        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw);
        } catch (error) {
            console.error("GitHub 설정 파싱 실패:", error);
            return null;
        }
    },

    saveGitHubConfig(config) {
        const key = WorkoutApp.Constants.storageKeys.githubConfig;

        localStorage.setItem(
            key,
            JSON.stringify({
                owner: config.owner.trim(),
                repository: config.repository.trim(),
                branch: WorkoutApp.Constants.github.dataBranch,
                token: config.token.trim()
            })
        );
    },

    removeGitHubConfig() {
        localStorage.removeItem(
            WorkoutApp.Constants.storageKeys.githubConfig
        );
    }
};
