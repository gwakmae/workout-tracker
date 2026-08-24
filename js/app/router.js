WorkoutApp.Router = {
    currentScreen: "home",

    show(screenName) {
        document.querySelectorAll("[data-screen]").forEach((screen) => {
            screen.hidden = screen.dataset.screen !== screenName;
        });

        this.currentScreen = screenName;
        window.scrollTo({ top: 0, behavior: "smooth" });

        if (screenName === "home") {
            WorkoutApp.UI.renderHome();
        }

        if (screenName === "detail") {
            WorkoutApp.UI.renderDetail();
        }

        if (screenName === "settings") {
            WorkoutApp.SettingsUI.populate();
        }
    },

    home() {
        WorkoutApp.Store.state.currentExerciseId = null;
        this.show("home");
    },

    detail(exerciseId) {
        WorkoutApp.Store.state.currentExerciseId = exerciseId;
        this.show("detail");
    },

    settings() {
        this.show("settings");
    }
};
