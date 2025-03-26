/**
 * CashFriends SDK - Configuration Module
 * @description 환경 설정 및 SDK 구성 관리
 */
export class Config {
    constructor() {
      // 환경별 서비스 키 (service_key)
      this.SERVICE_KEYS = {
        dev: {
          kakaoPage: 'd00c7cf89284c7c30cddfab97e11411',
          kakaoWebtoon: '15bcfc6ab4eafe3f685d5d2bc5ee770f',
          melonNext: 'c7fc18d82322b464822bfb3889d17536'
        },
        qa: {
          kakaoPage: '84956703335924e9d3d41fc53b2de815',
          kakaoWebtoon: '8f03522256e4c2e6cb142975fa19eeb6',
          melonNext: 'c7fc18d82322b464822bfb3889d17536'
        },
        prod: {
          kakaoPage: '221601c10f7879836aa7f73758ad1b01',
          kakaoWebtoon: 'f5cba57d9b2fe86bd0284b35078ef0ca',
          melonNext: '3387d68c21438afc42d433019cdae347'
        }
      };
  
      // 환경별 클라이언트 ID (client_id)
      this.CLIENT_IDS = {
        dev: {
          kakaoPageNextAndroid: 'd8350bcd4571864092617596840d7ea17',
          kakaoPageNextIOS: '8f94cc70c782fe2c877182a2e7dbad26',
          kakaoWebtoonAndroid: '4708533b576df8eaeae224ded930000e',
          kakaoWebtoonIOS: 'e525d7ba50402c32a91ea115c84cea03',
          melonAndroid: 'b57354297244aded3822eb664190ade79',
          melonIOS: '3a7638a75efbdc5c7a9be9712bed6c57'
        },
        qa: {
          kakaoPageNextAndroid: 'ebbbb0f68df5c31f08ba0b893db4ccb1',
          kakaoPageNextIOS: '32971d47c37f4200f8329cb59f4b801b',
          kakaoWebtoonAndroid: '02e639f597c4b0e2d011fdfb4302af1a',
          kakaoWebtoonIOS: 'd34909fae7821fa3022f77614f2ae6e8',
          melonAndroid: 'b57354297244aded3822eb664190ade79',
          melonIOS: '3a7638a75efbdc5c7a9be9712bed6c57'
        },
        prod: {
          kakaoPageNextAndroid: 'ceaac02444bfb602fe6953e56e2d9c87',
          kakaoPageNextIOS: 'ea83d01fd4cee2f8489e7555ccb84418',
          kakaoWebtoonAndroid: 'e2dad9a1d0002a5d38f80f9ac6365f40',
          kakaoWebtoonIOS: '33276e8c21048cadf86a0fa46f33ab5e',
          melonAndroid: 'f568fef813e9d710aab629887e3f6032',
          melonIOS: 'd8f71bd16ea9f895f90f6c57d73ba876'
        }
      };
  
      // 환경별 엔드포인트 설정
      this.ENVIRONMENTS = {
        dev: 'https://imp-dev.cashfriends.io',
        qa: 'https://imp-qa.cashfriends.io',
        prod: 'https://imp.cashfriends.io'
      };
  
      // 트래킹 엔드포인트 설정
      this.TRACKING = {
        dev: 'https://track-dev.cashfriends.io/track',
        qa: 'https://track-qa.cashfriends.io/track',
        prod: 'https://track.cashfriends.io/track'
      };
  
      // 광고 지원 엔드포인트 설정
      this.APPLY = {
        dev: 'https://apply-dev.cashfriends.io/apply',
        qa: 'https://apply-qa.cashfriends.io/apply',
        prod: 'https://apply.cashfriends.io/apply'
      };
  
      // 보상형 광고 제외 유형
      this.NON_REWARD_IMPTYPES = [36, 37];
  
      // 기본 SDK 구성
      this.settings = { 
        env: 'qa', 
        userParams: {},
        retryCount: 2,
        retryDelay: 1000,
        timeout: 5000,
        onError: null,
        debug: false,
        serviceType: '',  // 서비스 타입 (clientId와 serviceKey 자동 설정에 사용)
        iconTextMap: {},  // ICON_TEXT 값에 대응하는 이미지 URL 매핑
        useCustomTemplate: true // 컨테이너 내부 HTML 요소를 템플릿으로 사용 여부
      };
    }
  
    /**
     * SDK 설정 초기화
     * @param {Object} options - 설정 옵션
     */
    init(options) {
      this.settings.env = options.env || 'qa';
      this.settings.userParams = options.params || {};
      this.settings.retryCount = options.retryCount || 2;
      this.settings.retryDelay = options.retryDelay || 1000;
      this.settings.timeout = options.timeout || 5000;
      this.settings.onError = options.onError || null;
      this.settings.debug = options.debug || false;
      this.settings.serviceType = options.serviceType || '';
      this.settings.iconTextMap = options.iconTextMap || {};
      this.settings.useCustomTemplate = options.useCustomTemplate !== undefined ? options.useCustomTemplate : true;
      
      // clientId 값 설정
      this._setupClientId(options);
      
      // service_key 설정
      this._setupServiceKey();
      
      // 디버그 모드에서 초기 설정 정보 로깅
      this._logInitConfig();
    }
  
    /**
     * Client ID 설정
     * @private
     */
    _setupClientId(options) {
      if (!this.settings.userParams.clientId) {
        // 직접 전달된 clientId 사용
        if (options.clientId) {
          this.settings.userParams.clientId = options.clientId;
        } 
        // 서비스 타입으로부터 자동 설정
        else if (this.settings.serviceType && this.CLIENT_IDS[this.settings.env] && this.CLIENT_IDS[this.settings.env][this.settings.serviceType]) {
          this.settings.userParams.clientId = this.CLIENT_IDS[this.settings.env][this.settings.serviceType];
          if (this.settings.debug) {
            console.log(`ClientId automatically set from serviceType: ${this.settings.serviceType}`);
          }
        }
      }
    }
  
    /**
     * 서비스 키 설정
     * @private
     */
    _setupServiceKey() {
      if (!this.settings.userParams.serviceKey && this.settings.serviceType) {
        const serviceCategory = this.settings.serviceType.replace(/Next.*$|Android$|iOS$/, '');
        if (this.SERVICE_KEYS[this.settings.env] && this.SERVICE_KEYS[this.settings.env][serviceCategory]) {
          this.settings.userParams.serviceKey = this.SERVICE_KEYS[this.settings.env][serviceCategory];
          if (this.settings.debug) {
            console.log(`ServiceKey automatically set from serviceType: ${serviceCategory}`);
          }
        }
      }
    }
  
    /**
     * 초기 설정 로깅
     * @private
     */
    _logInitConfig() {
      if (this.settings.debug) {
        console.log('SDK initialized with config:', JSON.stringify({
          env: this.settings.env,
          serviceType: this.settings.serviceType,
          clientId: this.settings.userParams.clientId,
          serviceKey: this.settings.userParams.serviceKey,
          iconTextMap: Object.keys(this.settings.iconTextMap).length > 0 ? '설정됨' : '설정되지 않음',
          useCustomTemplate: this.settings.useCustomTemplate,
          params: Object.keys(this.settings.userParams),
          retryCount: this.settings.retryCount,
          retryDelay: this.settings.retryDelay,
          timeout: this.settings.timeout,
          debug: this.settings.debug
        }));
      }
    }
  
    /**
     * 설정 값 가져오기
     * @param {string} key - 설정 키
     * @returns {*} 설정 값
     */
    get(key) {
      return this.settings[key];
    }
  
    /**
     * 설정 값 설정하기
     * @param {string} key - 설정 키
     * @param {*} value - 설정 값
     */
    set(key, value) {
      this.settings[key] = value;
      if (this.settings.debug) {
        console.log(`Config updated: ${key} = ${JSON.stringify(value)}`);
      }
    }
  
    /**
     * 현재 환경의 API 엔드포인트 가져오기
     * @returns {string} API 엔드포인트
     */
    getApiEndpoint() {
      return this.ENVIRONMENTS[this.settings.env];
    }
  
    /**
     * 현재 환경의 트래킹 엔드포인트 가져오기
     * @returns {string} 트래킹 엔드포인트
     */
    getTrackingEndpoint() {
      return this.TRACKING[this.settings.env];
    }
  
    /**
     * 현재 환경의 광고 지원 엔드포인트 가져오기
     * @returns {string} 광고 지원 엔드포인트
     */
    getApplyEndpoint() {
      return this.APPLY[this.settings.env];
    }
  
    /**
     * 서비스 키 맵 가져오기
     * @returns {Object} 서비스 키 맵
     */
    getServiceKeys() {
      return this.SERVICE_KEYS;
    }
  
    /**
     * 클라이언트 ID 맵 가져오기
     * @returns {Object} 클라이언트 ID 맵
     */
    getClientIds() {
      return this.CLIENT_IDS;
    }
  
    /**
     * 보상형 광고 타입 체크
     * @param {number} impType - 광고 임프레션 타입
     * @returns {boolean} 보상형 광고 여부
     */
    isRewardAdType(impType) {
      return !this.NON_REWARD_IMPTYPES.includes(impType);
    }
  }
  
  // 싱글톤 인스턴스 생성 및 내보내기
  export default new Config();