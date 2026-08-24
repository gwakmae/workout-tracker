WorkoutApp.App = {
    bindEvents() {
        document
            .querySelector("#open-settings-button")
            .addEventListener("click", () => {
                WorkoutApp.Router.settings();
            });

        document
            .querySelector("#settings-back-button")
            .addEventListener("click", () => {
                WorkoutApp.Router.home();
            });

        document
            .querySelector("#add-exercise-button")
            .addEventListener("click", () => {
                WorkoutApp.Forms.openExercise();
            });

        document
            .querySelector("#empty-add-exercise-button")
            .addEventListener("click", () => {
                WorkoutApp.Forms.openExercise();
            });

        document
            .querySelector("#exercise-search")
            .addEventListener("input", (event) => {
                WorkoutApp.Store.state.searchQuery =
                    event.target.value;

                WorkoutApp.UI.renderHome();
            });

        document
            .querySelector("#exercise-form")
            .addEventListener("submit", (event) => {
                WorkoutApp.Actions.saveExercise(event);
            });

        document
            .querySelector("#decrease-weight-button")
            .addEventListener("click", () => {
                WorkoutApp.Forms.changeWeight(
                    -WorkoutApp.Constants.weightStepKg
                );
            });

        document
            .querySelector("#increase-weight-button")
            .addEventListener("click", () => {
                WorkoutApp.Forms.changeWeight(
                    WorkoutApp.Constants.weightStepKg
                );
            });

        document
            .querySelector("#delete-exercise-button")
            .addEventListener("click", (event) => {
                const exerciseId =
                    event.currentTarget.dataset.exerciseId;

                if (exerciseId) {
                    WorkoutApp.Actions.deleteExercise(exerciseId);
                }
            });

        document
            .querySelectorAll("[data-close-dialog]")
            .forEach((button) => {
                button.addEventListener("click", () => {
                    WorkoutApp.Forms.close(
                        button.dataset.closeDialog
                    );
                });
            });

        document
            .querySelector("#github-settings-form")
            .addEventListener("submit", (event) => {
                WorkoutApp.Actions.connectGitHub(event);
            });

        document
            .querySelector("#sync-now-button")
            .addEventListener("click", () => {
                WorkoutApp.Actions.syncNow();
            });

        document
            .querySelector("#remove-token-button")
            .addEventListener("click", () => {
                WorkoutApp.Actions.removeToken();
            });

        document
            .querySelector("#export-json-button")
            .addEventListener("click", () => {
                WorkoutApp.Actions.exportJson();
            });

        document
            .querySelector("#import-json-input")
            .addEventListener("change", (event) => {
                WorkoutApp.Actions.importJson(event);
            });

        document
            .querySelector("#delete-all-data-button")
            .addEventListener("click", () => {
                WorkoutApp.Actions.deleteAllData();
            });
    },

    async initialize() {
        WorkoutApp.Store.initialize();
        this.bindEvents();
        WorkoutApp.Router.home();

        if (!WorkoutApp.SyncService.isConfigured()) {
            WorkoutApp.SyncService.setStatus(
                "local",
                "GitHub 연결 안 됨 · 로컬 저장"
            );

            return;
        }

        try {
            await WorkoutApp.SyncService.syncNow();
        } catch (error) {
            console.error(
                "초기 GitHub 동기화 실패:",
                error
            );
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    WorkoutApp.App.initialize();
});
