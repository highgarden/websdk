/**
 * CashFriends Web SDK
 * Version: v1.0.0
 * 
 * @description 보장형 및 성과형 광고 플랫폼을 위한 웹 SDK
 * @author CashFriends SDK Team
 */

// 코어 모듈 가져오기
import config from './core/config.js';
import eventSystem from './core/events.js';
import { EventTypes, ErrorTypes } from './core/utils.js';

// 네트워크 모듈 가져오기
import apiClient from './network/api-client.js';
import tracker from './network/tracking.js';

// 렌더링 모듈 가져오기
import templateManager from './rendering/templates.js';
import renderer from './rendering/renderer.js';

// 광고 모듈 가져오기
import { createCreative } from './ads/creative.js';
import { createSlot, Slot } from './ads/slot.js';

/**
 * AdSDK 메인 클래스
 * SDK의 공개 API를 정의하고 모듈 간 상호작용을 관리
 */
class AdSDK {
    constructor() {
        this.version = '1.0.0';
        this.isInitialized = false;

        // SDK 준비 이벤트 발생 지연을 위한 타임아웃 ID
        this.readyTimeoutId = null;
    }

    /**
     * SDK 초기화
     * @param {Object} options - 초기화 옵션
     */
    init(options = {}) {
        if (this.isInitialized) {
            console.warn('SDK is already initialized');
            return;
        }

        // 설정 초기화
        config.init(options);

        // 이벤트 시스템 디버그 모드 설정
        eventSystem.setDebug(config.get('debug'));

        // 초기화 플래그 설정
        this.isInitialized = true;

        // 디버그 로그
        if (config.get('debug')) {
            console.log(`AdSDK v${this.version} initialized`);
        }

        // SDK 준비 완료 이벤트 지연 발생 (다음 틱에 발생)
        this.readyTimeoutId = setTimeout(() => {
            eventSystem.emit(EventTypes.SDK_READY, {
                version: this.version,
                config: {
                    env: config.get('env'),
                    debug: config.get('debug'),
                    serviceType: config.get('serviceType')
                }
            });
        }, 0);
    }

    /**
     * 슬롯 생성
     * @param {Object} options - 슬롯 옵션
     * @returns {Slot} 슬롯 객체
     */
    createSlot(options) {
        this._checkInitialized();
        return createSlot(options);
    }

    /**
     * 이벤트 리스너 등록
     * @param {string} eventName - 이벤트 이름
     * @param {Function} callback - 콜백 함수
     * @returns {Function} 구독 취소 함수
     */
    on(eventName, callback) {
        return eventSystem.on(eventName, callback);
    }

    /**
     * 이벤트 리스너 한 번만 실행
     * @param {string} eventName - 이벤트 이름
     * @param {Function} callback - 콜백 함수
     * @returns {Function} 구독 취소 함수
     */
    once(eventName, callback) {
        return eventSystem.once(eventName, callback);
    }

    /**
     * 이벤트 리스너 제거
     * @param {string} eventName - 이벤트 이름
     * @param {Function} callback - 콜백 함수
     */
    off(eventName, callback) {
        eventSystem.off(eventName, callback);
    }

    /**
     * 테마 설정
     * @param {Object} theme - 테마 설정
     */
    setTheme(theme) {
        this._checkInitialized();
        config.set('theme', theme);
    }

    /**
     * 새로운 광고 형식의 템플릿 추가
     * @param {string} formatName - 형식 이름
     * @param {string} template - HTML 템플릿
     */
    addTemplate(formatName, template) {
        this._checkInitialized();
        templateManager.addTemplate(formatName, template);
    }

    /**
     * SDK가 초기화되었는지 확인
     * @private
     */
    _checkInitialized() {
        if (!this.isInitialized) {
            throw new Error('SDK is not initialized. Please call init() first.');
        }
    }

    /**
     * 이벤트 타입 상수
     */
    get Events() {
        return EventTypes;
    }

    /**
     * 에러 타입 상수
     */
    get ErrorTypes() {
        return ErrorTypes;
    }

    /**
     * 공개 API: 광고 렌더링
     * (테스트용 또는 고급 사용자용)
     */
    renderAd(creative, container, customTemplate) {
        this._checkInitialized();

        const creativeObj = creative instanceof Object ?
            creative : createCreative(creative);

        return renderer.renderTemplate(creativeObj, container, customTemplate);
    }

    /**
     * 공개 API: 보상형 광고 여부 확인
     */
    isRewardAd(impType) {
        return tracker.isRewardAd(impType);
    }

    /**
     * 공개 API: 추적 이벤트 전송
     */
    trackEvent(params) {
        this._checkInitialized();
        return tracker.trackEvent(params);
    }

    /**
     * 공개 API: 광고 지원 요청
     */
    applyAd(creative) {
        this._checkInitialized();
        return apiClient.apply(creative);
    }
}

// 싱글톤 인스턴스 생성
const sdk = new AdSDK();

// 전역 접근 가능하도록 window에 할당 (브라우저 환경에서)
if (typeof window !== 'undefined') {
    window.AdSDK = sdk;
}

// SDK 인스턴스 내보내기
export default sdk;

// 필요한 클래스 및 상수 내보내기
export {
    Slot,
    createSlot,
    createCreative,
    EventTypes,
    ErrorTypes
};