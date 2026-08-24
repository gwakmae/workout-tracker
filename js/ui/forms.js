WorkoutApp.Forms = {
    openExercise(exerciseId = null) {
        const dialog = document.querySelector("#exercise-dialog");
        const form = document.querySelector("#exercise-form");

        const exercise = exerciseId
            ? WorkoutApp.Store.getExercise(exerciseId)
            : null;

        form.reset();

        document.querySelector(
            "#exercise-dialog-title"
        ).textContent = exercise
                ? "기기 설정 수정"
                : "기기 추가";

        document.querySelector("#exercise-id").value =
            exercise?.id || "";

        document.querySelector("#exercise-name").value =
            exercise?.name || "";

        document.querySelector("#exercise-weight").value =
            WorkoutApp.Utils.hasValue(exercise?.weightKg)
                ? exercise.weightKg
                : "";

        document.querySelector("#exercise-reps").value =
            WorkoutApp.Utils.hasValue(exercise?.reps)
                ? exercise.reps
                : "";

        document.querySelector("#exercise-sets").value =
            WorkoutApp.Utils.hasValue(exercise?.sets)
                ? exercise.sets
                : "";

        document.querySelector("#exercise-notes").value =
            exercise?.notes || "";

        const deleteButton = document.querySelector(
            "#delete-exercise-button"
        );

        deleteButton.hidden = !exercise;
        deleteButton.dataset.exerciseId = exercise?.id || "";

        dialog.showModal();

        document.querySelector("#exercise-name").focus();
    },

    changeWeight(amount) {
        const input = document.querySelector("#exercise-weight");

        const current = WorkoutApp.Utils.hasValue(input.value)
            ? Number(input.value)
            : 0;

        const next = Math.max(0, current + amount);

        input.value = Number.isInteger(next)
            ? String(next)
            : next.toFixed(1);
    },

    close(dialogId) {
        const dialog = document.querySelector(`#${dialogId}`);

        if (dialog?.open) {
            dialog.close();
        }
    }
};
