WorkoutApp.UI = {
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

        if (WorkoutApp.Router.currentScreen === "detail") {
            this.renderDetail();
        }
    },

    renderHome() {
        const list = document.querySelector("#exercise-list");
        const emptyState = document.querySelector("#empty-exercise-state");
        const query = WorkoutApp.Store.state.searchQuery.trim().toLowerCase();

        const exercises = [...WorkoutApp.Store.getData().exercises]
            .filter((exercise) =>
                exercise.name.toLowerCase().includes(query)
            )
            .sort((a, b) => a.name.localeCompare(b.name, "ko"));

        list.replaceChildren();

        emptyState.hidden =
            WorkoutApp.Store.getData().exercises.length !== 0 || Boolean(query);

        if (exercises.length === 0 && query) {
            const result = this.createElement(
                "div",
                "empty-state",
                "검색 결과가 없습니다."
            );

            list.append(result);
            return;
        }

        exercises.forEach((exercise) => {
            const latest = WorkoutApp.Utils.latestRecord(
                WorkoutApp.Store.getData().records,
                exercise.id
            );

            const button = this.createElement("button", "exercise-card");
            button.type = "button";

            const info = this.createElement("span");
            const name = this.createElement(
                "span",
                "exercise-card__name",
                exercise.name
            );

            const metaText = exercise.weightType === "assisted"
                ? "보조 중량"
                : "일반 중량";

            const meta = this.createElement(
                "span",
                "exercise-card__meta",
                metaText
            );

            info.append(name, meta);

            const latestWrap = this.createElement(
                "span",
                "exercise-card__latest"
            );

            latestWrap.append(
                this.createElement(
                    "span",
                    "exercise-card__latest-label",
                    "최근 기록"
                ),
                this.createElement(
                    "span",
                    "exercise-card__latest-value",
                    WorkoutApp.Utils.formatRecord(latest, exercise)
                )
            );

            button.append(info, latestWrap);
            button.addEventListener("click", () => {
                WorkoutApp.Router.detail(exercise.id);
            });

            list.append(button);
        });
    },

    renderDetail() {
        const container = document.querySelector("#exercise-detail");
        const exercise = WorkoutApp.Store.getExercise(
            WorkoutApp.Store.state.currentExerciseId
        );

        container.replaceChildren();

        if (!exercise) {
            WorkoutApp.Router.home();
            return;
        }

        const records = WorkoutApp.Store.getRecordsForExercise(exercise.id);
        const latest = records[0] || null;

        const header = this.createElement("section", "detail-header");
        const headerTop = this.createElement("div", "detail-header__top");
        const titleWrap = this.createElement("div");

        titleWrap.append(
            this.createElement("h2", "", exercise.name),
            this.createElement(
                "span",
                "type-badge",
                exercise.weightType === "assisted"
                    ? "보조 중량"
                    : "일반 중량"
            )
        );

        const editButton = this.createElement(
            "button",
            "small-button",
            "수정"
        );

        editButton.type = "button";
        editButton.addEventListener("click", () => {
            WorkoutApp.Forms.openExercise(exercise.id);
        });

        headerTop.append(titleWrap, editButton);
        header.append(headerTop);

        if (exercise.machineSettings) {
            header.append(
                this.createElement(
                    "p",
                    "machine-settings",
                    `기기 설정 · ${exercise.machineSettings}`
                )
            );
        }

        const summary = this.createElement("section", "detail-summary");
        const summaryInfo = this.createElement("div");

        summaryInfo.append(
            this.createElement(
                "span",
                "detail-summary__label",
                "최근 기록"
            ),
            this.createElement(
                "strong",
                "detail-summary__value",
                WorkoutApp.Utils.formatRecord(latest, exercise)
            )
        );

        const recordButton = this.createElement(
            "button",
            "primary-button",
            "오늘 기록하기"
        );

        recordButton.type = "button";
        recordButton.addEventListener("click", () => {
            WorkoutApp.Forms.openRecord(exercise.id);
        });

        summary.append(summaryInfo, recordButton);

        const history = this.createElement("section", "history-section");
        const heading = this.createElement("div", "history-heading");

        heading.append(
            this.createElement("h3", "", "기록 내역"),
            this.createElement(
                "span",
                "exercise-card__meta",
                `${records.length}개`
            )
        );

        const historyList = this.createElement("div", "history-list");

        if (records.length === 0) {
            historyList.append(
                this.createElement(
                    "div",
                    "empty-state",
                    "아직 기록이 없습니다."
                )
            );
        }

        records.forEach((record) => {
            const item = this.createElement("article", "history-item");
            const info = this.createElement("div");

            info.append(
                this.createElement(
                    "div",
                    "history-item__date",
                    WorkoutApp.Utils.formatDate(record.date)
                ),
                this.createElement(
                    "div",
                    "history-item__value",
                    WorkoutApp.Utils.formatRecord(record, exercise)
                )
            );

            const actions = this.createElement(
                "div",
                "history-item__actions"
            );

            const edit = this.createElement(
                "button",
                "small-button",
                "수정"
            );

            edit.type = "button";
            edit.addEventListener("click", () => {
                WorkoutApp.Forms.openRecord(exercise.id, record.id);
            });

            const remove = this.createElement(
                "button",
                "small-button small-button--danger",
                "삭제"
            );

            remove.type = "button";
            remove.addEventListener("click", () => {
                WorkoutApp.Actions.deleteRecord(record.id);
            });

            actions.append(edit, remove);
            item.append(info, actions);
            historyList.append(item);
        });

        const deleteExerciseButton = this.createElement(
            "button",
            "danger-text-button",
            "이 운동 삭제"
        );

        deleteExerciseButton.type = "button";
        deleteExerciseButton.addEventListener("click", () => {
            WorkoutApp.Actions.deleteExercise(exercise.id);
        });

        history.append(heading, historyList, deleteExerciseButton);
        container.append(header, summary, history);
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
