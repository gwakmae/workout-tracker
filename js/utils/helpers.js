WorkoutApp.Utils = {
    id(prefix) {
        const value = crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        return `${prefix}-${value}`;
    },

    now() {
        return new Date().toISOString();
    },

    today() {
        const date = new Date();
        const offset = date.getTimezoneOffset() * 60000;

        return new Date(date.getTime() - offset)
            .toISOString()
            .slice(0, 10);
    },

    hasValue(value) {
        return value !== null && value !== undefined && value !== "";
    },

    optionalNumber(value) {
        if (!this.hasValue(value)) {
            return null;
        }

        const number = Number(value);

        return Number.isFinite(number) ? number : null;
    },

    formatNumber(value) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "";
        }

        return Number.isInteger(number)
            ? String(number)
            : number.toFixed(1).replace(/\.0$/, "");
    },

    formatExerciseValues(exercise) {
        if (!exercise) {
            return "설정값 없음";
        }

        const values = [];

        if (this.hasValue(exercise.weightKg)) {
            values.push(`${this.formatNumber(exercise.weightKg)}kg`);
        }

        if (this.hasValue(exercise.reps)) {
            values.push(`${this.formatNumber(exercise.reps)}회`);
        }

        if (this.hasValue(exercise.sets)) {
            values.push(`${this.formatNumber(exercise.sets)}세트`);
        }

        return values.length > 0
            ? values.join(" · ")
            : "설정값 없음";
    },

    latestRecord(records, exerciseId) {
        return records
            .filter((record) => record.exerciseId === exerciseId)
            .sort((a, b) => {
                const firstUpdatedAt = String(a.updatedAt || a.createdAt || "");
                const secondUpdatedAt = String(
                    b.updatedAt || b.createdAt || ""
                );

                const updatedCompare = secondUpdatedAt.localeCompare(
                    firstUpdatedAt
                );

                if (updatedCompare !== 0) {
                    return updatedCompare;
                }

                return String(b.date || "").localeCompare(String(a.date || ""));
            })[0] || null;
    },

    clone(value) {
        return JSON.parse(JSON.stringify(value));
    },

    encodeBase64(value) {
        const bytes = new TextEncoder().encode(value);
        let binary = "";

        bytes.forEach((byte) => {
            binary += String.fromCharCode(byte);
        });

        return btoa(binary);
    },

    decodeBase64(value) {
        const cleanValue = value.replace(/\n/g, "");
        const binary = atob(cleanValue);

        const bytes = Uint8Array.from(
            binary,
            (character) => character.charCodeAt(0)
        );

        return new TextDecoder().decode(bytes);
    },

    inferGitHubLocation() {
        const hostname = window.location.hostname;
        const parts = window.location.pathname.split("/").filter(Boolean);

        if (!hostname.endsWith(".github.io")) {
            return {
                owner: "",
                repository: "workout-tracker"
            };
        }

        const owner = hostname.split(".")[0];

        return {
            owner,
            repository: parts[0] || `${owner}.github.io`
        };
    },

    sortByUpdatedAt(items) {
        return [...items].sort((a, b) =>
            String(b.updatedAt || "").localeCompare(
                String(a.updatedAt || "")
            )
        );
    }
};
