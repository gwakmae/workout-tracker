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

    formatDate(value) {
        if (!value) {
            return "";
        }

        return new Intl.DateTimeFormat("ko-KR", {
            year: "numeric",
            month: "short",
            day: "numeric"
        }).format(new Date(`${value}T00:00:00`));
    },

    formatWeight(weight) {
        const number = Number(weight);

        if (!Number.isFinite(number)) {
            return "-";
        }

        return Number.isInteger(number)
            ? String(number)
            : number.toFixed(1).replace(/\.0$/, "");
    },

    formatRecord(record, exercise) {
        if (!record) {
            return "기록 없음";
        }

        const prefix = exercise?.weightType === "assisted" ? "보조 " : "";
        let result = `${prefix}${this.formatWeight(record.weightKg)}kg`;

        if (record.reps) {
            result += ` × ${record.reps}회`;
        }

        if (record.sets) {
            result += ` × ${record.sets}세트`;
        }

        return result;
    },

    latestRecord(records, exerciseId) {
        return records
            .filter((record) => record.exerciseId === exerciseId)
            .sort((a, b) => {
                const dateCompare = b.date.localeCompare(a.date);

                if (dateCompare !== 0) {
                    return dateCompare;
                }

                return b.updatedAt.localeCompare(a.updatedAt);
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
        const bytes = Uint8Array.from(binary, (character) =>
            character.charCodeAt(0)
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

        return {
            owner: hostname.split(".")[0],
            repository: parts[0] || `${hostname.split(".")[0]}.github.io`
        };
    },

    sortByUpdatedAt(items) {
        return [...items].sort((a, b) =>
            b.updatedAt.localeCompare(a.updatedAt)
        );
    }
};
