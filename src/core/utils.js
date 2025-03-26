import config from './config.js';
import eventSystem from './events.js';

/**
 * SDK 오류 타입 정의
 */
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  RENDERING: 'RENDERING_ERROR',
  CONFIGURATION: 'CONFIGURATION_ERROR',
  TRACKING: 'TRACKING_ERROR',
  GENERAL: 'GENERAL_ERROR'
};

/**
 * SDK 이벤트 타입 정의
 */
export const EventTypes = {
  ERROR: 'error',
  AD_LOADED: 'ad_loaded',
  AD_RENDERED: 'ad_rendered',
  AD_CLICKED: 'ad_clicked',
  AD_IMPRESSION: 'ad_impression',
  AD_VIDEO_STARTED: 'ad_video_started',
  AD_VIDEO_COMPLETED: 'ad_video_completed',
  SDK_READY: 'sdk_ready'
};

/**
 * 에러 처리 헬퍼 함수
 * @param {Error} error - 에러 객체
 * @param {string} type - 에러 타입
 * @param {Object} additionalInfo - 추가 정보
 * @returns {Object} 표준화된 에러 객체
 */
export function handleError(error, type = ErrorTypes.GENERAL, additionalInfo = {}) {
  const errorObj = {
    type: type,
    message: error.message || 'Unknown error occurred',
    timestamp: new Date().toISOString(),
    originalError: error,
    ...additionalInfo
  };
  
  if (config.get('debug')) {
    console.error(`[AdSDK Error] ${errorObj.type}:`, errorObj);
  }
  
  // 에러 이벤트 발생
  eventSystem.emit(EventTypes.ERROR, errorObj);
  
  // onError 콜백 실행
  const onError = config.get('onError');
  if (typeof onError === 'function') {
    try {
      onError(errorObj);
    } catch (callbackError) {
      console.error('Error in onError callback:', callbackError);
    }
  }
  
  return errorObj;
}

/**
 * Promise 타임아웃 함수
 * @param {Promise} promise - 원본 프로미스
 * @param {number} ms - 타임아웃 (밀리초)
 * @param {string} errorMessage - 타임아웃 에러 메시지
 * @returns {Promise} 타임아웃이 추가된 프로미스
 */
export function promiseWithTimeout(promise, ms, errorMessage = 'Operation timed out') {
  const timeout = new Promise((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(errorMessage));
    }, ms);
  });

  return Promise.race([promise, timeout]);
}

/**
 * 웹에서 지원하는지 검사하는 함수들
 */
export const isSupportedFeature = {
  /**
   * IntersectionObserver 지원 여부 확인
   * @returns {boolean} 지원 여부
   */
  intersectionObserver() {
    return 'IntersectionObserver' in window;
  },
  
  /**
   * Video 지원 여부 확인
   * @returns {boolean} 지원 여부
   */
  videoElement() {
    return !!document.createElement('video').canPlayType;
  },
  
  /**
   * 터치 이벤트 지원 여부 확인
   * @returns {boolean} 지원 여부
   */
  touchEvents() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
};

/**
 * 딥 병합 함수
 * @param {Object} target - 대상 객체
 * @param {Object} source - 소스 객체
 * @returns {Object} 병합된 객체
 */
export function deepMerge(target, source) {
  if (!source) return target;
  
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
}

/**
 * 객체 여부 검사
 * @param {*} item - 검사할 항목
 * @returns {boolean} 객체 여부
 */
function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * 요소가 뷰포트에 있는지 확인 (IntersectionObserver 폴리필)
 * @param {HTMLElement} element - 확인할 요소
 * @param {number} threshold - 임계값 (0-1)
 * @returns {boolean} 뷰포트에 있는지 여부
 */
export function isElementInViewport(element, threshold = 0.5) {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  // 요소의 가시 영역 계산
  const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
  const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
  
  // 가시 영역의 비율 계산
  const visibleArea = visibleHeight * visibleWidth;
  const elementArea = rect.height * rect.width;
  
  return visibleArea / elementArea >= threshold;
}

/**
 * 요소에 스타일 적용
 * @param {HTMLElement} element - 스타일을 적용할 요소
 * @param {Object} styles - 적용할 스타일 객체
 */
export function applyStyles(element, styles) {
  if (!element || !styles) return;
  
  Object.keys(styles).forEach(property => {
    element.style[property] = styles[property];
  });
}

/**
 * UUID 생성
 * @returns {string} 생성된 UUID
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 디바운스 함수
 * @param {Function} func - 디바운스할 함수
 * @param {number} wait - 대기 시간 (밀리초)
 * @returns {Function} 디바운스된 함수
 */
export function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 날짜 포맷팅
 * @param {Date|string|number} date - 날짜
 * @param {string} format - 포맷 (YYYY-MM-DD)
 * @returns {string} 포맷된 날짜
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 쿼리 파라미터 파싱
 * @param {string} url - URL
 * @returns {Object} 파싱된 쿼리 파라미터
 */
export function parseQueryParams(url) {
  const params = {};
  const queryString = url.split('?')[1];
  
  if (!queryString) return params;
  
  const searchParams = new URLSearchParams(queryString);
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  
  return params;
}