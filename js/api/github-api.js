WorkoutApp.GitHubApi = {
  async request(config, path, options = {}) {
    const response = await fetch(
      `${WorkoutApp.Constants.github.apiBaseUrl}${path}`,
      {
        ...options,

        /*
         * 파일을 수정하기 직전의 최신 SHA가 필요하므로
         * 브라우저 HTTP 캐시를 사용하지 않는다.
         */
        cache: "no-store",

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
        body?.message ||
          `GitHub API 오류 (${response.status})`
      );

      error.status = response.status;
      error.body = body;

      throw error;
    }

    return body;
  },

  repositoryPath(config) {
    return (
      `/repos/${encodeURIComponent(config.owner)}` +
      `/${encodeURIComponent(config.repository)}`
    );
  },

  async getRepository(config) {
    return this.request(
      config,
      this.repositoryPath(config)
    );
  },

  async getBranchReference(config, branch) {
    return this.request(
      config,
      `${this.repositoryPath(config)}` +
        `/git/ref/heads/${encodeURIComponent(branch)}`
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
      return await this.getBranchReference(
        config,
        branch
      );
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
    }

    const sourceReference =
      await this.getBranchReference(
        config,
        repository.default_branch
      );

    try {
      return await this.createBranch(
        config,
        branch,
        sourceReference.object.sha
      );
    } catch (error) {
      /*
       * 다른 요청이 조금 먼저 동일한 브랜치를 생성한 경우에는
       * 실패로 처리하지 않고 생성된 브랜치를 다시 조회한다.
       */
      if (error.status === 409 || error.status === 422) {
        return this.getBranchReference(
          config,
          branch
        );
      }

      throw error;
    }
  },

  async getDataFile(config) {
    const path =
      WorkoutApp.Constants.github.dataFilePath;

    const query = new URLSearchParams({
      ref: config.branch,

      /*
       * 요청 URL도 매번 다르게 만들어 중간 캐시가
       * 오래된 파일 정보를 반환하지 않게 한다.
       */
      timestamp: String(Date.now())
    });

    try {
      const file = await this.request(
        config,
        `${this.repositoryPath(config)}` +
          `/contents/${path}?${query.toString()}`
      );

      const jsonText =
        WorkoutApp.Utils.decodeBase64(file.content);

      return {
        exists: true,
        sha: file.sha,
        data: WorkoutApp.Schema.normalizeDocument(
          JSON.parse(jsonText)
        )
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
    const path =
      WorkoutApp.Constants.github.dataFilePath;

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

    const initialData =
      WorkoutApp.Schema.emptyDocument();

    try {
      await this.saveDataFile(
        config,
        initialData
      );
    } catch (error) {
      /*
       * JSON 파일 생성 요청이 겹친 경우 한 요청은
       * 409 또는 422를 받을 수 있다.
       *
       * 이미 다른 요청이 파일을 생성했을 가능성이 있으므로
       * 오류를 바로 발생시키지 않고 파일을 다시 조회한다.
       */
      if (error.status !== 409 && error.status !== 422) {
        throw error;
      }
    }

    await this.wait(350);

    const createdFile =
      await this.getDataFile(config);

    if (!createdFile.exists) {
      throw new Error(
        "workouts.json을 생성하지 못했습니다."
      );
    }

    return createdFile;
  },

  wait(milliseconds) {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }
};
