WorkoutApp.Forms = {
    openExercise(exerciseId = null) {
        const dialog = document.querySelector("#exercise-dialog");
        const form = document.querySelector("#exercise-form");
        const exercise = exerciseId
            ? WorkoutApp.Store.getExercise(exerciseId)
            : null;

        form.reset();

        document.querySelector("#exercise-dialog-title").textContent =
            exercise ? "운동 수정" : "운동 추가";

        document.querySelector("#exercise-id").value = exercise?.id || "";
        document.querySelector("#exercise-name").value =
            exercise?.name || "";
        document.querySelector("#exercise-settings").value =
            exercise?.machineSettings || "";

        const weightType = exercise?.weightType || "normal";
        const radio = form.querySelector(
            `[name="weightType"][value="${weightType}"]`
        );

        if (radio) {
            radio.checked = true;
        }

        dialog.showModal();
        document.querySelector("#exercise-name").focus();
    },

    openRecord(exerciseId, recordId = null) {
        const dialog = document.querySelector("#record-dialog");
        const form = document.querySelector("#record-form");
        const exercise = WorkoutApp.Store.getExercise(exerciseId);
        const record = recordId
            ? WorkoutApp.Store.getRecord(recordId)
            : null;

        if (!exercise) {
            return;
        }

        form.reset();

        const latest = WorkoutApp.Utils.latestRecord(
            WorkoutApp.Store.getData().records.filter(
                (item) => item.id !== recordId
            ),
            exerciseId
        );

        document.querySelector("#record-dialog-title").textContent =
            record ? "기록 수정" : "오늘 기록";

        document.querySelector("#record-exercise-name").textContent =
            exercise.name;

        document.querySelector("#record-id").value = record?.id || "";
        document.querySelector("#record-exercise-id").value = exercise.id;

        document.querySelector("#previous-record-text").textContent =
            WorkoutApp.Utils.formatRecord(latest, exercise);

        document.querySelector("#record-weight-label").textContent =
            exercise.weightType === "assisted" ? "보조 무게" : "무게";

        document.querySelector("#record-weight").value =
            record?.weightKg ?? latest?.weightKg ?? "";

        document.querySelector("#record-date").value =
            record?.date || WorkoutApp.Utils.today();

        const hasDetails = Boolean(record?.reps || record?.sets);

        document.querySelector("#record-detail-toggle").checked =
            hasDetails;

        document.querySelector("#record-reps").value =
            record?.reps || "";

        document.querySelector("#record-sets").value =
            record?.sets || "";

        this.toggleRecordDetails(hasDetails);
        dialog.showModal();
        document.querySelector("#record-weight").focus();
    },

    toggleRecordDetails(visible) {
        const fields = document.querySelector("#record-detail-fields");

        fields.hidden = !visible;

        if (!visible) {
            document.querySelector("#record-reps").value = "";
            document.querySelector("#record-sets").value = "";
        }
    },

    changeWeight(amount) {
        const input = document.querySelector("#record-weight");
        const current = Number(input.value || 0);
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
