WorkoutApp.Schema = {
    emptyDocument() {
        return {
            version: WorkoutApp.Constants.schemaVersion,
            updatedAt: WorkoutApp.Utils.now(),
            exercises: [],
            deletedExercises: []
        };
    },

    normalizeExercise(exercise, legacyRecords = []) {
        const latestRecord = WorkoutApp.Utils.latestRecord(
            legacyRecords,
            exercise.id
        );

        const createdAt =
            exercise.createdAt ||
            latestRecord?.createdAt ||
            WorkoutApp.Utils.now();

        const updatedAtValues = [
            exercise.updatedAt,
            latestRecord?.updatedAt,
            createdAt
        ].filter(Boolean);

        const updatedAt = updatedAtValues.sort().at(-1);

        const existingWeight = WorkoutApp.Utils.hasValue(
            exercise.weightKg
        );

        const existingReps = WorkoutApp.Utils.hasValue(exercise.reps);
        const existingSets = WorkoutApp.Utils.hasValue(exercise.sets);

        return {
            id: exercise.id || WorkoutApp.Utils.id("exercise"),
            name: String(exercise.name || "").trim(),
            weightKg: WorkoutApp.Utils.optionalNumber(
                existingWeight
                    ? exercise.weightKg
                    : latestRecord?.weightKg
            ),
            reps: WorkoutApp.Utils.optionalNumber(
                existingReps
                    ? exercise.reps
                    : latestRecord?.reps
            ),
            sets: WorkoutApp.Utils.optionalNumber(
                existingSets
                    ? exercise.sets
                    : latestRecord?.sets
            ),
            notes: String(
                exercise.notes ?? exercise.machineSettings ?? ""
            ).trim(),
            createdAt,
            updatedAt
        };
    },

    normalizeDeletedExercises(items) {
        if (!Array.isArray(items)) {
            return [];
        }

        return items
            .filter((item) => item?.id)
            .map((item) => ({
                id: item.id,
                deletedAt: item.deletedAt || WorkoutApp.Utils.now()
            }));
    },

    normalizeDocument(value) {
        const empty = this.emptyDocument();

        if (!value || typeof value !== "object") {
            return empty;
        }

        const exercises = Array.isArray(value.exercises)
            ? value.exercises
            : [];

        const legacyRecords = Array.isArray(value.records)
            ? value.records
            : [];

        return {
            version: WorkoutApp.Constants.schemaVersion,
            updatedAt: value.updatedAt || empty.updatedAt,
            exercises: exercises
                .map((exercise) =>
                    this.normalizeExercise(exercise, legacyRecords)
                )
                .filter((exercise) => exercise.name),
            deletedExercises: this.normalizeDeletedExercises(
                value.deletedExercises
            )
        };
    },

    mergeItemCollections(localItems, remoteItems) {
        const map = new Map();

        [...remoteItems, ...localItems].forEach((item) => {
            if (!item?.id) {
                return;
            }

            const existing = map.get(item.id);

            if (
                !existing ||
                String(item.updatedAt || "") >=
                String(existing.updatedAt || "")
            ) {
                map.set(item.id, item);
            }
        });

        return [...map.values()];
    },

    mergeTombstones(localItems, remoteItems) {
        const map = new Map();

        [...remoteItems, ...localItems].forEach((item) => {
            if (!item?.id) {
                return;
            }

            const existing = map.get(item.id);

            if (
                !existing ||
                String(item.deletedAt || "") >=
                String(existing.deletedAt || "")
            ) {
                map.set(item.id, item);
            }
        });

        return [...map.values()];
    },

    removeDeleted(items, tombstones) {
        const deletedMap = new Map(
            tombstones.map((item) => [item.id, item.deletedAt])
        );

        return items.filter((item) => {
            const deletedAt = deletedMap.get(item.id);

            if (!deletedAt) {
                return true;
            }

            return String(item.updatedAt || "") > String(deletedAt);
        });
    },

    mergeDocuments(localValue, remoteValue) {
        const local = this.normalizeDocument(localValue);
        const remote = this.normalizeDocument(remoteValue);

        const deletedExercises = this.mergeTombstones(
            local.deletedExercises,
            remote.deletedExercises
        );

        const exercises = this.removeDeleted(
            this.mergeItemCollections(
                local.exercises,
                remote.exercises
            ),
            deletedExercises
        );

        const updatedAt = [
            local.updatedAt,
            remote.updatedAt,
            ...exercises.map((exercise) => exercise.updatedAt),
            ...deletedExercises.map((item) => item.deletedAt)
        ]
            .filter(Boolean)
            .sort()
            .at(-1) || WorkoutApp.Utils.now();

        return {
            version: WorkoutApp.Constants.schemaVersion,
            updatedAt,
            exercises,
            deletedExercises
        };
    }
};
