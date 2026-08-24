WorkoutApp.SettingsUI = {
    populate() {
        const stored = WorkoutApp.LocalStorage.loadGitHubConfig();
        const inferred = WorkoutApp.Utils.inferGitHubLocation();

        document.querySelector("#github-owner").value =
            stored?.owner || inferred.owner;

        document.querySelector("#github-repository").value =
            stored?.repository || inferred.repository;

        document.querySelector("#github-branch").value =
            WorkoutApp.Constants.github.dataBranch;

        document.querySelector("#github-token").value =
            stored?.token || "";

        this.setMessage(
            stored
                ? "이 브라우저에 GitHub 연결 정보가 저장되어 있습니다."
                : "아직 GitHub에 연결되지 않았습니다."
        );
    },

    readForm() {
        return {
            owner: document.querySelector("#github-owner").value.trim(),
            repository: document
                .querySelector("#github-repository")
                .value.trim(),
            branch: WorkoutApp.Constants.github.dataBranch,
            token: document.querySelector("#github-token").value.trim()
        };
    },

    setMessage(message, isError = false) {
        const element = document.querySelector(
            "#github-connection-message"
        );

        element.textContent = message;
        element.style.color = isError
            ? "var(--color-danger)"
            : "var(--color-text-muted)";
    }
};
