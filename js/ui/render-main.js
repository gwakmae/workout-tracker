WorkoutApp.UI = {
    toastTimer: null,

    createElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text !== undefined) {
            element.textContent = text;
        }

        return element;
    },

    renderCurrentScreen() {
        if (WorkoutApp.Router.currentScreen === "home") {
            this.renderHome();
        }
    },

    getFilteredExercises() {
        const query = WorkoutApp.Store.state.searchQuery
            .trim()
            .toLowerCase();

        return [...WorkoutApp.Store.getData().exercises]
            .filter((exercise) => {
                const searchableText = [
                    exercise.name,
                    exercise.notes,
                    WorkoutApp.Utils.formatExerciseValues(exercise)
                ]
                    .join(" ")
                    .toLowerCase();

                return searchableText.includes(query);
            })
            .sort((first, second) =>
                first.name.localeCompare(second.name, "ko")
            );
    },

    renderHome() {
        const list = document.querySelector("#exercise-list");
        const emptyState = document.querySelector(
            "#empty-exercise-state"
        );

        const query = WorkoutApp.Store.state.searchQuery
            .trim()
            .toLowerCase();

        const allExercises = WorkoutApp.Store.getData().exercises;
        const exercises = this.getFilteredExercises();

        list.replaceChildren();

        emptyState.hidden =
            allExercises.length !== 0 || Boolean(query);

        if (exercises.length === 0 && query) {
            const result = this.createElement(
                "div",
                "empty-state"
            );

            result.append(
                this.createElement(
                    "strong",
                    "",
                    "검색 결과가 없습니다."
                ),
                this.createElement(
                    "p",
                    "",
                    "다른 이름이나 설정값으로 검색해보세요."
                )
            );

            list.append(result);
            return;
        }

        exercises.forEach((exercise) => {
            const hasValues =
                WorkoutApp.Utils.hasValue(exercise.weightKg) ||
                WorkoutApp.Utils.hasValue(exercise.reps) ||
                WorkoutApp.Utils.hasValue(exercise.sets);

            const button = this.createElement(
                "button",
                "exercise-card"
            );

            button.type = "button";
            button.setAttribute(
                "aria-label",
                `${exercise.name} 설정 수정`
            );

            const content = this.createElement(
                "span",
                "exercise-card__content"
            );

            const name = this.createElement(
                "span",
                "exercise-card__name",
                exercise.name
            );

            const values = this.createElement(
                "span",
                hasValues
                    ? "exercise-card__values"
                    : "exercise-card__values exercise-card__values--empty",
                WorkoutApp.Utils.formatExerciseValues(exercise)
            );

            content.append(name, values);

            if (exercise.notes) {
                content.append(
                    this.createElement(
                        "span",
                        "exercise-card__notes",
                        exercise.notes
                    )
                );
            }

            const arrow = this.createElement(
                "span",
                "exercise-card__arrow",
                "›"
            );

            button.append(content, arrow);

            button.addEventListener("click", () => {
                WorkoutApp.Forms.openExercise(exercise.id);
            });

            list.append(button);
        });
    },

    showToast(message) {
        const toast = document.querySelector("#toast");

        toast.textContent = message;
        toast.hidden = false;

        clearTimeout(this.toastTimer);

        this.toastTimer = setTimeout(() => {
            toast.hidden = true;
        }, 2600);
    }
};
