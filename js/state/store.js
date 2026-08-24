WorkoutApp.Store = {
    state: {
        data: WorkoutApp.Schema.emptyDocument(),
        searchQuery: ""
    },

    initialize() {
        this.state.data = WorkoutApp.LocalStorage.loadData();

        /*
         * 기존 version 1 데이터를 version 2 구조로 변환한 뒤
         * 바로 로컬에 다시 저장한다.
         */
        this.state.data = WorkoutApp.Schema.normalizeDocument(
            this.state.data
        );

        WorkoutApp.LocalStorage.saveData(this.state.data);
    },

    getData() {
        return this.state.data;
    },

    replaceData(data) {
        this.state.data = WorkoutApp.Schema.normalizeDocument(data);
        WorkoutApp.LocalStorage.saveData(this.state.data);
    },

    touchAndSave() {
        this.state.data.version =
            WorkoutApp.Constants.schemaVersion;

        this.state.data.updatedAt = WorkoutApp.Utils.now();

        WorkoutApp.LocalStorage.saveData(this.state.data);
    },

    getExercise(exerciseId) {
        return this.state.data.exercises.find(
            (exercise) => exercise.id === exerciseId
        ) || null;
    },

    saveExercise(values) {
        const now = WorkoutApp.Utils.now();

        const existing = values.id
            ? this.getExercise(values.id)
            : null;

        const normalizedValues = {
            name: String(values.name || "").trim(),
            weightKg: WorkoutApp.Utils.optionalNumber(
                values.weightKg
            ),
            reps: WorkoutApp.Utils.optionalNumber(values.reps),
            sets: WorkoutApp.Utils.optionalNumber(values.sets),
            notes: String(values.notes || "").trim(),
            updatedAt: now
        };

        if (existing) {
            Object.assign(existing, normalizedValues);
        } else {
            this.state.data.exercises.push({
                id: WorkoutApp.Utils.id("exercise"),
                ...normalizedValues,
                createdAt: now
            });
        }

        this.touchAndSave();
    },

    deleteExercise(exerciseId) {
        const now = WorkoutApp.Utils.now();

        this.state.data.exercises =
            this.state.data.exercises.filter(
                (exercise) => exercise.id !== exerciseId
            );

        const existingTombstone =
            this.state.data.deletedExercises.find(
                (item) => item.id === exerciseId
            );

        if (existingTombstone) {
            existingTombstone.deletedAt = now;
        } else {
            this.state.data.deletedExercises.push({
                id: exerciseId,
                deletedAt: now
            });
        }

        this.touchAndSave();
    },

    deleteAll() {
        const now = WorkoutApp.Utils.now();

        this.state.data.exercises.forEach((exercise) => {
            const existingTombstone =
                this.state.data.deletedExercises.find(
                    (item) => item.id === exercise.id
                );

            if (existingTombstone) {
                existingTombstone.deletedAt = now;
            } else {
                this.state.data.deletedExercises.push({
                    id: exercise.id,
                    deletedAt: now
                });
            }
        });

        this.state.data.exercises = [];
        this.touchAndSave();
    }
};
