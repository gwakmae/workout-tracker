window.WorkoutApp = window.WorkoutApp || {};

WorkoutApp.Constants = Object.freeze({
    schemaVersion: 1,

    storageKeys: {
        data: "workout-tracker:data",
        githubConfig: "workout-tracker:github-config"
    },

    github: {
        apiBaseUrl: "https://api.github.com",
        apiVersion: "2022-11-28",
        dataBranch: "data",
        dataFilePath: "workouts.json"
    },

    weightStepKg: 2.5,
    autoSyncDelayMs: 1200
});
