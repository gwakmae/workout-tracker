WorkoutApp.Schema = {
    emptyDocument() {
        const now = WorkoutApp.Utils.now();

        return {
            version: WorkoutApp.Constants.schemaVersion,
            updatedAt: now,
            exercises: [],
            records: [],
            deletedExercises: [],
            deletedRecords: []
        };
    },

    normalizeDocument(value) {
        const empty = this.emptyDocument();

        if (!value || typeof value !== "object") {
            return empty;
        }

        return {
            version: WorkoutApp.Constants.schemaVersion,
            updatedAt: value.updatedAt || empty.updatedAt,
            exercises: Array.isArray(value.exercises) ? value.exercises : [],
            records: Array.isArray(value.records) ? value.records : [],
            deletedExercises: Array.isArray(value.deletedExercises)
                ? value.deletedExercises
                : [],
            deletedRecords: Array.isArray(value.deletedRecords)
                ? value.deletedRecords
                : []
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
                String(item.updatedAt || "") >= String(existing.updatedAt || "")
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
                String(item.deletedAt || "") >= String(existing.deletedAt || "")
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

        const deletedRecords = this.mergeTombstones(
            local.deletedRecords,
            remote.deletedRecords
        );

        const exercises = this.removeDeleted(
            this.mergeItemCollections(local.exercises, remote.exercises),
            deletedExercises
        );

        const exerciseIds = new Set(exercises.map((exercise) => exercise.id));

        const records = this.removeDeleted(
            this.mergeItemCollections(local.records, remote.records),
            deletedRecords
        ).filter((record) => exerciseIds.has(record.exerciseId));

        return {
            version: WorkoutApp.Constants.schemaVersion,
            updatedAt: [local.updatedAt, remote.updatedAt]
                .filter(Boolean)
                .sort()
                .at(-1) || WorkoutApp.Utils.now(),
            exercises,
            records,
            deletedExercises,
            deletedRecords
        };
    }
};
