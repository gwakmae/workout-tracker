WorkoutApp.SyncService = {
  timer: null,
  activeSyncPromise: null,

  getConfig() {
    return WorkoutApp.LocalStorage.loadGitHubConfig();
  },

  isConfigured() {
    const config = this.getConfig();

    return Boolean(
      config?.owner &&
      config?.repository &&
      config?.branch &&
      config?.token
    );
  },

  setStatus(state, message) {
    const status = document.querySelector(
      "#sync-status"
    );

    const text = document.querySelector(
      "#sync-status-text"
    );

    status.dataset.state = state;
    text.textContent = message;
  },

  async setup() {
    const config = this.getConfig();

    if (!config) {
      throw new Error(
        "GitHub 설정을 먼저 저장해주세요."
      );
    }

    /*
     * 브랜치 준비와 파일 동기화를 별도 요청으로 실행하지 않고
     * 하나의 동기화 작업 안에서 순서대로 실행한다.
     */
    return this.startSync(config);
  },

  schedule() {
    clearTimeout(this.timer);

    if (!this.isConfigured()) {
      this.setStatus(
        "local",
        "로컬에 저장됨"
      );

      return;
    }

    this.setStatus(
      "syncing",
      "동기화 대기 중"
    );

    this.timer = setTimeout(() => {
      this.syncNow().catch((error) => {
        console.error(
          "자동 동기화 실패:",
          error
        );
      });
    }, WorkoutApp.Constants.autoSyncDelayMs);
  },

  async syncNow() {
    const config = this.getConfig();

    if (!config) {
      this.setStatus(
        "local",
        "GitHub 연결 안 됨 · 로컬 저장"
      );

      throw new Error(
        "GitHub 연결 설정이 없습니다."
      );
    }

    return this.startSync(config);
  },

  startSync(config) {
    /*
     * 이미 동기화가 실행되고 있으면 새로운 API 요청을 만들지 않고
     * 현재 실행 중인 동기화 결과를 함께 기다린다.
     */
    if (this.activeSyncPromise) {
      return this.activeSyncPromise;
    }

    this.activeSyncPromise = this.performSync(config)
      .finally(() => {
        this.activeSyncPromise = null;
      });

    return this.activeSyncPromise;
  },

  async performSync(config) {
    this.setStatus(
      "syncing",
      "GitHub 동기화 중"
    );

    try {
      /*
       * data 브랜치가 없으면 생성하고,
       * 이미 존재하면 최신 브랜치 정보를 사용한다.
       */
      await WorkoutApp.GitHubApi.ensureDataBranch(
        config
      );

      const maxAttempts = 4;

      for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt += 1
      ) {
        /*
         * 매 시도마다 원격 파일과 SHA를 다시 가져온다.
         * 이전 시도에서 받은 SHA를 재사용하지 않는다.
         */
        const remote =
          await WorkoutApp.GitHubApi.ensureDataFile(
            config
          );

        /*
         * API 요청을 기다리는 동안 사용자가 값을 수정했을 수 있으므로
         * 매 시도마다 현재 로컬 데이터를 다시 읽는다.
         */
        const local =
          WorkoutApp.Store.getData();

        const merged =
          WorkoutApp.Schema.mergeDocuments(
            local,
            remote.data
          );

        WorkoutApp.Store.replaceData(merged);

        const remoteText = JSON.stringify(
          remote.data
        );

        const mergedText = JSON.stringify(
          merged
        );

        /*
         * 원격 데이터와 병합 결과가 동일하면
         * 새로운 커밋을 만들 필요가 없다.
         */
        if (remoteText === mergedText) {
          this.setStatus(
            "synced",
            "GitHub 동기화 완료"
          );

          WorkoutApp.UI.renderCurrentScreen();

          return merged;
        }

        try {
          await WorkoutApp.GitHubApi.saveDataFile(
            config,
            merged,
            remote.sha
          );

          this.setStatus(
            "synced",
            "GitHub 동기화 완료"
          );

          WorkoutApp.UI.renderCurrentScreen();

          return merged;
        } catch (error) {
          const isShaConflict =
            error.status === 409 ||
            error.status === 422;

          /*
           * SHA 충돌이 아니라면 재시도하지 않는다.
           */
          if (!isShaConflict) {
            throw error;
          }

          /*
           * 마지막 시도까지 실패했으면 원래 오류를 전달한다.
           */
          if (attempt === maxAttempts) {
            throw new Error(
              "GitHub 파일이 계속 변경되어 동기화하지 못했습니다. " +
                "열려 있는 다른 앱 탭을 닫고 다시 시도해주세요."
            );
          }

          this.setStatus(
            "syncing",
            `GitHub 충돌 재시도 중 (${attempt}/${maxAttempts - 1})`
          );

          /*
           * GitHub에 새 커밋이 반영될 시간을 조금 준 다음
           * 최신 파일과 SHA를 다시 가져온다.
           */
          await this.wait(350 * attempt);
        }
      }

      throw new Error(
        "GitHub 동기화를 완료하지 못했습니다."
      );
    } catch (error) {
      this.setStatus(
        "error",
        "동기화 실패 · 로컬 설정 유지됨"
      );

      throw error;
    }
  },

  wait(milliseconds) {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }
};
