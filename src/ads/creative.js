/**
 * CashFriends SDK - Creative Module
 * @description 광고 크리에이티브 모델
 */
import { generateUUID } from '../core/utils.js';

/**
 * 광고 크리에이티브 클래스
 * 서버로부터 받은 광고 데이터를 표준화된 형식으로 관리
 */
export class Creative {
    /**
     * 크리에이티브 생성자
     * @param {Object} data - 서버로부터 받은 원본 광고 데이터
     */
    constructor(data = {}) {
        // 고유 식별자
        this.id = data.id || generateUUID();

        // 광고 형식
        this.creativeFormat = data.creativeFormat || 'DEFAULT';

        // 임프레션 타입
        this.impType = data.impType || 0;

        // 광고 랜딩 URL
        this.landingUrl = data.landingUrl || '';

        // 광고 에셋
        this.assets = Array.isArray(data.assets) ? data.assets : [];

        // 광고 보상 정보
        this.adReward = data.adReward || null;

        // 광고 추가 정보
        this.adInfo = data.adInfo || {};

        // 지원 정보
        this.apply = data.apply || {};

        // 광고주 ID
        this.advId = data.advId || '';

        // 사용자 정보
        this.userInfo = data.userInfo || {};

        // 클라이언트 ID
        this.clientId = data.clientId || '';

        // 환경
        this.env = data.env || '';

        // 사용자 ID
        this.userId = data.userId || '';

        // DSP 콘텐츠 ID
        this.dspContentId = data.dspContentId || data.adInfo?.dspContentId || '';

        // 원본 데이터
        this._rawData = data;
    }

    /**
     * 특정 타입의 에셋 가져오기
     * @param {string} type - 에셋 타입
     * @returns {Object|null} 에셋 객체 또는 null
     */
    getAsset(type) {
        return this.assets.find(asset => asset.type === type) || null;
    }

    /**
     * 특정 타입의 모든 에셋 가져오기
     * @param {string} type - 에셋 타입
     * @returns {Array} 에셋 배열
     */
    getAssets(type) {
        return this.assets.filter(asset => asset.type === type);
    }

    /**
     * 에셋 값 가져오기
     * @param {string} type - 에셋 타입
     * @returns {string|null} 에셋 값 또는 null
     */
    getAssetValue(type) {
        const asset = this.getAsset(type);
        return asset ? asset.value : null;
    }

    /**
     * 보상형 광고 여부 확인
     * @returns {boolean} 보상형 광고 여부
     */
    isRewardAd() {
        // NON_REWARD_IMPTYPES = [36, 37]
        return ![36, 37].includes(this.impType);
    }

    /**
     * 비디오 광고 여부 확인
     * @returns {boolean} 비디오 광고 여부
     */
    isVideoAd() {
        return this.creativeFormat === 'NATIVE_VIDEO' || this.getAsset('MAIN_VIDEO') !== null;
    }

    /**
     * 트래킹에 필요한 정보 추출
     * @returns {Object} 트래킹 정보
     */
    getTrackingInfo() {
        return {
            id: this.id,
            creativeFormat: this.creativeFormat,
            ask: this.apply?.ask,
            dspContentId: this.dspContentId
        };
    }

    /**
     * 크리에이티브 정보 업데이트
     * @param {Object} data - 업데이트할 데이터
     */
    update(data) {
        if (!data) return;

        Object.keys(data).forEach(key => {
            // 원본 데이터 보존을 위해 _rawData는 업데이트하지 않음
            if (key !== '_rawData' && key in this) {
                this[key] = data[key];
            }
        });
    }

    /**
     * 조건부 속성 업데이트
     * @param {string} key - 속성 키
     * @param {*} value - 새 값
     * @param {Function} condition - 조건 함수 (현재 값을 받아 boolean 반환)
     * @returns {boolean} 업데이트 성공 여부
     */
    updateIf(key, value, condition) {
        if (key in this && condition(this[key])) {
            this[key] = value;
            return true;
        }
        return false;
    }

    /**
     * 특정 타입의 에셋 추가
     * @param {string} type - 에셋 타입
     * @param {string} assetType - 에셋 유형 (TEXT, IMAGE, VIDEO)
     * @param {string} value - 에셋 값
     */
    addAsset(type, assetType, value) {
        this.assets.push({
            type,
            assetType,
            value
        });
    }

    /**
     * 원본 데이터 가져오기
     * @returns {Object} 원본 광고 데이터
     */
    getRawData() {
        return this._rawData;
    }

    /**
     * 객체를 JSON으로 직렬화
     * @returns {Object} JSON 직렬화 가능한 객체
     */
    toJSON() {
        // _rawData를 제외한 나머지 속성을 반환
        const { _rawData, ...rest } = this;
        return rest;
    }

    /**
     * 객체를 문자열로 표현
     * @returns {string} 문자열 표현
     */
    toString() {
        return `Creative(${this.id}, ${this.creativeFormat})`;
    }
}

/**
 * 서버 데이터로부터 크리에이티브 객체 생성 헬퍼 함수
 * @param {Object} data - 서버로부터 받은 광고 데이터
 * @returns {Creative} 크리에이티브 객체
 */
export function createCreative(data) {
    return new Creative(data);
}

export default {
    Creative,
    createCreative
};