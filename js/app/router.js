WorkoutApp.Router = {
    currentScreen: "home",

    show(screenName) {
        document
            .querySelectorAll("[data-screen]")
            .forEach((screen) => {
                screen.hidden = screen.dataset.screen !== screenName;
            });

        this.currentScreen = screenName;

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        if (screenName === "home") {
            WorkoutApp.UI.renderHome();
        }

        if (screenName === "settings") {
            WorkoutApp.SettingsUI.populate();
        }
    },

    home() {
        this.show("home");
    },

    settings() {
        this.show("settings");
    }
};
