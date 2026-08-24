WorkoutApp.Actions = {
    afterDataChange(message) {
        WorkoutApp.UI.renderCurrentScreen();
        WorkoutApp.SyncService.schedule();
        WorkoutApp.UI.showToast(message);
    },

    saveExercise(event) {
        event.preventDefault();

        const name = document
            .querySelector("#exercise-name")
            .value
            .trim();

        if (!name) {
            WorkoutApp.UI.showToast(
                "운동 또는 기기 이름을 입력해주세요."
            );

            return;
        }

        WorkoutApp.Store.saveExercise({
            id: document.querySelector("#exercise-id").value,
            name,
            weightKg:
                document.querySelector("#exercise-weight").value,
            reps: document.querySelector("#exercise-reps").value,
            sets: document.querySelector("#exercise-sets").value,
            notes: document.querySelector("#exercise-notes").value
        });

        WorkoutApp.Forms.close("exercise-dialog");

        this.afterDataChange(
            "기기 설정을 저장했습니다."
        );
    },

    deleteExercise(exerciseId) {
        const exercise =
            WorkoutApp.Store.getExercise(exerciseId);

        if (!exercise) {
            return;
        }

        const confirmed = confirm(
            `"${exercise.name}"을 삭제할까요?`
        );

        if (!confirmed) {
            return;
        }

        WorkoutApp.Store.deleteExercise(exerciseId);
        WorkoutApp.Forms.close("exercise-dialog");

        this.afterDataChange(
            "기기 설정을 삭제했습니다."
        );
    },

    async connectGitHub(event) {
        event.preventDefault();

        const button = document.querySelector(
            "#connect-github-button"
        );

        const config = WorkoutApp.SettingsUI.readForm();

        if (
            !config.owner ||
            !config.repository ||
            !config.token
        ) {
            WorkoutApp.SettingsUI.setMessage(
                "모든 GitHub 연결 정보를 입력해주세요.",
                true
            );

            return;
        }

        button.disabled = true;
        button.textContent = "브랜치 준비 중...";

        WorkoutApp.LocalStorage.saveGitHubConfig(config);

        WorkoutApp.SettingsUI.setMessage(
            "저장소를 확인하고 data 브랜치를 준비하고 있습니다."
        );

        try {
            await WorkoutApp.SyncService.setup();

            WorkoutApp.SettingsUI.setMessage(
                "연결되었습니다.\ndata 브랜치와 workouts.json 준비가 완료되었습니다."
            );

            WorkoutApp.UI.showToast("GitHub 연결 완료");
        } catch (error) {
            console.error(error);

            WorkoutApp.SettingsUI.setMessage(
                `연결 실패: ${error.message}`,
                true
            );
        } finally {
            button.disabled = false;
            button.textContent =
                "GitHub 연결 및 데이터 브랜치 준비";
        }
    },

    async syncNow() {
        const button = document.querySelector(
            "#sync-now-button"
        );

        button.disabled = true;

        try {
            await WorkoutApp.SyncService.syncNow();

            WorkoutApp.SettingsUI.setMessage(
                "GitHub 동기화를 완료했습니다."
            );

            WorkoutApp.UI.showToast("동기화 완료");
        } catch (error) {
            WorkoutApp.SettingsUI.setMessage(
                `동기화 실패: ${error.message}`,
                true
            );
        } finally {
            button.disabled = false;
        }
    },

    removeToken() {
        const confirmed = confirm(
            "이 브라우저에 저장된 GitHub 토큰을 삭제할까요?"
        );

        if (!confirmed) {
            return;
        }

        WorkoutApp.LocalStorage.removeGitHubConfig();

        document.querySelector("#github-token").value = "";

        WorkoutApp.SyncService.setStatus(
            "local",
            "GitHub 연결 안 됨 · 로컬 저장"
        );

        WorkoutApp.SettingsUI.setMessage(
            "저장된 GitHub 연결 정보를 삭제했습니다."
        );
    },

    exportJson() {
        const documentData = {
            ...WorkoutApp.Store.getData(),
            exportedAt: WorkoutApp.Utils.now()
        };

        const blob = new Blob(
            [JSON.stringify(documentData, null, 2)],
            {
                type: "application/json"
            }
        );

        const link = document.createElement("a");

        link.href = URL.createObjectURL(blob);
        link.download =
            `workout-settings-${WorkoutApp.Utils.today()}.json`;

        link.click();
        URL.revokeObjectURL(link.href);

        WorkoutApp.UI.showToast(
            "JSON 백업을 다운로드했습니다."
        );
    },

    async importJson(event) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            const text = await file.text();
            const parsed = JSON.parse(text);

            const imported =
                WorkoutApp.Schema.normalizeDocument(parsed);

            const merged =
                WorkoutApp.Schema.mergeDocuments(
                    WorkoutApp.Store.getData(),
                    imported
                );

            WorkoutApp.Store.replaceData(merged);
            WorkoutApp.SyncService.schedule();
            WorkoutApp.UI.renderCurrentScreen();

            WorkoutApp.UI.showToast(
                "백업 데이터를 불러왔습니다."
            );
        } catch (error) {
            console.error(error);

            WorkoutApp.UI.showToast(
                "올바른 JSON 백업 파일이 아닙니다."
            );
        } finally {
            event.target.value = "";
        }
    },

    deleteAllData() {
        const confirmed = confirm(
            "모든 기기 설정을 삭제할까요?\nGitHub에도 삭제 상태가 동기화됩니다."
        );

        if (!confirmed) {
            return;
        }

        WorkoutApp.Store.deleteAll();
        WorkoutApp.SyncService.schedule();
        WorkoutApp.Router.home();

        WorkoutApp.UI.showToast(
            "모든 기기 설정을 삭제했습니다."
        );
    }
};
