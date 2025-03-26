/**
 * CashFriends SDK - API Client Module
 * @description API 서버와의 통신을 담당하는 모듈
 */
import config from '../core/config.js';
import { handleError, ErrorTypes, promiseWithTimeout } from '../core/utils.js';
import eventSystem from '../core/events.js';
import { EventTypes } from '../core/utils.js';

export class ApiClient {
  /**
   * 재시도 메커니즘을 포함한 광고 fetching
   * @param {string} slotId - 광고 슬롯 ID
   * @param {number} currentAttempt - 현재 시도 횟수
   * @returns {Promise} 광고 데이터
   */
  async fetchAdsWithRetry(slotId, currentAttempt = 0) {
    try {
      const base = config.getApiEndpoint();
      const searchParams = new URLSearchParams({ 
        slotId, 
        ...config.get('userParams') 
      });
      const url = `${base}/ads?${searchParams.toString()}`;
      
      // 타임아웃 설정
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.get('timeout'));

      // 요청 실행
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (config.get('debug')) {
        console.log('Ad fetch successful:', data);
      }
      
      // 광고 로드 이벤트 발생
      if (data.creatives && data.creatives.length > 0) {
        eventSystem.emit(EventTypes.AD_LOADED, {
          slotId,
          creatives: data.creatives
        });
      }
      
      return data;
    } catch (error) {
      if (config.get('debug')) {
        console.warn(`Ad fetch attempt ${currentAttempt + 1} failed:`, error);
      }
      
      // 재시도 로직
      if (currentAttempt < config.get('retryCount')) {
        await new Promise(resolve => setTimeout(resolve, config.get('retryDelay')));
        return this.fetchAdsWithRetry(slotId, currentAttempt + 1);
      }
      
      // 최종 실패 처리
      console.error('Ad fetching ultimately failed:', error);
      
      // 에러 핸들링
      handleError(error, ErrorTypes.NETWORK, { slotId });
      
      // 빈 결과 반환
      return { creatives: [] };
    }
  }

  /**
   * 광고 지원 요청 (보상형 광고 클릭 시)
   * @param {Object} creative - 광고 크리에이티브 정보
   * @returns {Promise} 광고 지원 결과
   */
  async apply(creative) {
    try {
      // 필수 필드 체크
      if (!creative.apply?.ask) {
        throw new Error('Apply ask is missing');
      }

      // 환경 확인 및 매핑 - sandbox가 들어오면 qa로 매핑
      const envMapping = {
        'sandbox': 'qa'
      };
      const resolvedEnv = envMapping[config.get('env')] || config.get('env');
      
      // 클라이언트 ID 확인 - 크리에이티브에서 받은 clientId가 있으면 우선 사용
      const clientId = creative.clientId || config.get('userParams').clientId;
      
      // clientId를 기반으로 서비스 타입 추론
      let serviceType = config.get('serviceType');
      if (!serviceType && clientId) {
        // CLIENT_IDS에서 현재 clientId에 해당하는 서비스 타입 찾기
        const clientIds = config.getClientIds();
        for (const env in clientIds) {
          for (const type in clientIds[env]) {
            if (clientIds[env][type] === clientId) {
              serviceType = type;
              break;
            }
          }
          if (serviceType) break;
        }
      }
      
      // 서비스 키 결정 - 서비스 타입이 있으면 그에 맞는 서비스 키 사용
      let serviceKey = config.get('userParams').serviceKey;
      if (!serviceKey && serviceType) {
        const serviceCategory = serviceType.replace(/Next.*$|Android$|iOS$/, '');
        const serviceKeys = config.getServiceKeys();
        if (serviceKeys[resolvedEnv] && serviceKeys[resolvedEnv][serviceCategory]) {
          serviceKey = serviceKeys[resolvedEnv][serviceCategory];
        }
      }

      // 요청 페이로드 구성
      const body = {
        dspContentId: creative.adInfo?.dspContentId || creative.dspContentId,
        advId: config.get('userParams').plainIfa || creative.advId, // plainIfa를 우선적으로 사용
        ask: creative.apply?.ask,
        userId: creative.userInfo?.userId || config.get('userParams').userInfo_userId || creative.userId,
        clientId: clientId,
        serviceKey: serviceKey,
        env: creative.env || resolvedEnv // 크리에이티브에서 전달된 env가 있으면 우선 사용
      };

      // 필수 값 검증
      if (!body.advId) {
        console.warn('advId/plainIfa is missing in both creative and config');
      }

      if (!body.serviceKey) {
        console.warn('serviceKey is missing - this may cause apply request to fail');
      }

      // debug 모드에서 요청 페이로드 로깅
      if (config.get('debug')) {
        console.log('Apply request payload:', JSON.stringify(body));
      }

      // 요청 엔드포인트 결정
      const applyEndpoint = config.getApplyEndpoint();
      if (!applyEndpoint) {
        throw new Error(`Invalid environment: ${resolvedEnv}`);
      }

      // 요청 전송 (타임아웃 적용)
      const fetchPromise = fetch(applyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const response = await promiseWithTimeout(
        fetchPromise,
        config.get('timeout'),
        'Apply request timed out'
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apply request failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      if (config.get('debug')) {
        console.log('Apply request successful:', result);
      }
      
      return result;
    } catch (error) {
      console.error('Apply request failed:', error);
      handleError(error, ErrorTypes.NETWORK, {
        operation: 'apply',
        creativeId: creative.id || 'unknown'
      });
      return null;
    }
  }

  /**
   * 일반 API 요청 함수
   * @param {string} endpoint - 엔드포인트 경로
   * @param {Object} options - 요청 옵션
   * @returns {Promise} 응답 데이터
   */
  async request(endpoint, options = {}) {
    try {
      const { method = 'GET', params = {}, body = null, headers = {} } = options;
      
      // 기본 URL 생성
      let url = `${config.getApiEndpoint()}/${endpoint}`;
      
      // GET 요청에 쿼리 파라미터 추가
      if (method === 'GET' && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams(params);
        url = `${url}?${searchParams.toString()}`;
      }
      
      // 요청 옵션 구성
      const fetchOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };
      
      // GET이 아닌 경우 body 추가
      if (method !== 'GET' && body) {
        fetchOptions.body = JSON.stringify(body);
      }
      
      // 요청 실행 (타임아웃 적용)
      const response = await promiseWithTimeout(
        fetch(url, fetchOptions),
        config.get('timeout'),
        `Request to ${endpoint} timed out`
      );
      
      // 응답 처리
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      
      // 응답 데이터 파싱
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      handleError(error, ErrorTypes.NETWORK, {
        endpoint,
        options
      });
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export default new ApiClient();