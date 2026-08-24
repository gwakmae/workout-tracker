WorkoutApp.Store = {
    state: {
        data: WorkoutApp.Schema.emptyDocument(),
        currentExerciseId: null,
        searchQuery: ""
    },

    initialize() {
        this.state.data = WorkoutApp.LocalStorage.loadData();
    },

    getData() {
        return this.state.data;
    },

    replaceData(data) {
        this.state.data = WorkoutApp.Schema.normalizeDocument(data);
        WorkoutApp.LocalStorage.saveData(this.state.data);
    },

    touchAndSave() {
        this.state.data.updatedAt = WorkoutApp.Utils.now();
        WorkoutApp.LocalStorage.saveData(this.state.data);
    },

    getExercise(exerciseId) {
        return this.state.data.exercises.find(
            (exercise) => exercise.id === exerciseId
        ) || null;
    },

    getRecord(recordId) {
        return this.state.data.records.find(
            (record) => record.id === recordId
        ) || null;
    },

    getRecordsForExercise(exerciseId) {
        return this.state.data.records
            .filter((record) => record.exerciseId === exerciseId)
            .sort((a, b) => {
                const dateCompare = b.date.localeCompare(a.date);

                return dateCompare !== 0
                    ? dateCompare
                    : b.updatedAt.localeCompare(a.updatedAt);
            });
    },

    saveExercise(values) {
        const now = WorkoutApp.Utils.now();
        const existing = values.id ? this.getExercise(values.id) : null;

        if (existing) {
            Object.assign(existing, {
                name: values.name.trim(),
                weightType: values.weightType,
                machineSettings: values.machineSettings.trim(),
                updatedAt: now
            });
        } else {
            this.state.data.exercises.push({
                id: WorkoutApp.Utils.id("exercise"),
                name: values.name.trim(),
                weightType: values.weightType,
                machineSettings: values.machineSettings.trim(),
                createdAt: now,
                updatedAt: now
            });
        }

        this.touchAndSave();
    },

    deleteExercise(exerciseId) {
        const now = WorkoutApp.Utils.now();
        const relatedRecordIds = this.state.data.records
            .filter((record) => record.exerciseId === exerciseId)
            .map((record) => record.id);

        this.state.data.exercises = this.state.data.exercises.filter(
            (exercise) => exercise.id !== exerciseId
        );

        this.state.data.records = this.state.data.records.filter(
            (record) => record.exerciseId !== exerciseId
        );

        this.state.data.deletedExercises.push({
            id: exerciseId,
            deletedAt: now
        });

        relatedRecordIds.forEach((recordId) => {
            this.state.data.deletedRecords.push({
                id: recordId,
                deletedAt: now
            });
        });

        this.touchAndSave();
    },

    saveRecord(values) {
        const now = WorkoutApp.Utils.now();
        const existing = values.id ? this.getRecord(values.id) : null;

        const recordValues = {
            exerciseId: values.exerciseId,
            date: values.date,
            weightKg: Number(values.weightKg),
            reps: values.reps ? Number(values.reps) : null,
            sets: values.sets ? Number(values.sets) : null,
            updatedAt: now
        };

        if (existing) {
            Object.assign(existing, recordValues);
        } else {
            this.state.data.records.push({
                id: WorkoutApp.Utils.id("record"),
                ...recordValues,
                createdAt: now
            });
        }

        this.touchAndSave();
    },

    deleteRecord(recordId) {
        const now = WorkoutApp.Utils.now();

        this.state.data.records = this.state.data.records.filter(
            (record) => record.id !== recordId
        );

        this.state.data.deletedRecords.push({
            id: recordId,
            deletedAt: now
        });

        this.touchAndSave();
    },

    deleteAll() {
        const now = WorkoutApp.Utils.now();

        this.state.data.exercises.forEach((exercise) => {
            this.state.data.deletedExercises.push({
                id: exercise.id,
                deletedAt: now
            });
        });

        this.state.data.records.forEach((record) => {
            this.state.data.deletedRecords.push({
                id: record.id,
                deletedAt: now
            });
        });

        this.state.data.exercises = [];
        this.state.data.records = [];
        this.touchAndSave();
    }
};
