WorkoutApp.GitHubApi = {
    async request(config, path, options = {}) {
        const response = await fetch(
            `${WorkoutApp.Constants.github.apiBaseUrl}${path}`,
            {
                ...options,
                headers: {
                    Accept: "application/vnd.github+json",
                    Authorization: `Bearer ${config.token}`,
                    "X-GitHub-Api-Version":
                        WorkoutApp.Constants.github.apiVersion,
                    "Content-Type": "application/json",
                    ...options.headers
                }
            }
        );

        let body = null;

        try {
            body = await response.json();
        } catch {
            body = null;
        }

        if (!response.ok) {
            const error = new Error(
                body?.message || `GitHub API 오류 (${response.status})`
            );

            error.status = response.status;
            error.body = body;
            throw error;
        }

        return body;
    },

    repositoryPath(config) {
        return `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(
            config.repository
        )}`;
    },

    async getRepository(config) {
        return this.request(config, this.repositoryPath(config));
    },

    async getBranchReference(config, branch) {
        return this.request(
            config,
            `${this.repositoryPath(config)}/git/ref/heads/${encodeURIComponent(
                branch
            )}`
        );
    },

    async createBranch(config, branch, sourceSha) {
        return this.request(
            config,
            `${this.repositoryPath(config)}/git/refs`,
            {
                method: "POST",
                body: JSON.stringify({
                    ref: `refs/heads/${branch}`,
                    sha: sourceSha
                })
            }
        );
    },

    async ensureDataBranch(config) {
        const repository = await this.getRepository(config);
        const branch = config.branch;

        try {
            return await this.getBranchReference(config, branch);
        } catch (error) {
            if (error.status !== 404) {
                throw error;
            }
        }

        const sourceReference = await this.getBranchReference(
            config,
            repository.default_branch
        );

        return this.createBranch(
            config,
            branch,
            sourceReference.object.sha
        );
    },

    async getDataFile(config) {
        const path = WorkoutApp.Constants.github.dataFilePath;
        const query = new URLSearchParams({
            ref: config.branch
        });

        try {
            const file = await this.request(
                config,
                `${this.repositoryPath(config)}/contents/${path}?${query}`
            );

            const jsonText = WorkoutApp.Utils.decodeBase64(file.content);

            return {
                exists: true,
                sha: file.sha,
                data: WorkoutApp.Schema.normalizeDocument(JSON.parse(jsonText))
            };
        } catch (error) {
            if (error.status === 404) {
                return {
                    exists: false,
                    sha: null,
                    data: WorkoutApp.Schema.emptyDocument()
                };
            }

            throw error;
        }
    },

    async saveDataFile(config, data, sha = null) {
        const path = WorkoutApp.Constants.github.dataFilePath;
        const body = {
            message: "Update workout data",
            content: WorkoutApp.Utils.encodeBase64(
                JSON.stringify(data, null, 2)
            ),
            branch: config.branch
        };

        if (sha) {
            body.sha = sha;
        }

        return this.request(
            config,
            `${this.repositoryPath(config)}/contents/${path}`,
            {
                method: "PUT",
                body: JSON.stringify(body)
            }
        );
    },

    async ensureDataFile(config) {
        const remote = await this.getDataFile(config);

        if (remote.exists) {
            return remote;
        }

        const initialData = WorkoutApp.Schema.emptyDocument();

        await this.saveDataFile(config, initialData);

        return this.getDataFile(config);
    }
};
