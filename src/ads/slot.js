/**
 * CashFriends SDK - Slot Module
 * @description 광고 슬롯 관리
 */
import config from '../core/config.js';
import apiClient from '../network/api-client.js';
import tracker from '../network/tracking.js';
import renderer from '../rendering/renderer.js';
import { createCreative } from './creative.js';
import { handleError, ErrorTypes } from '../core/utils.js';
import eventSystem from '../core/events.js';
import { EventTypes } from '../core/utils.js';

/**
 * 광고 슬롯 클래스
 * 광고가 표시될 컨테이너를 관리하고 광고 로딩 및 이벤트 처리를 담당
 */
export class Slot {
    /**
     * 슬롯 생성자
     * @param {Object} options - 슬롯 옵션
     * @param {string} options.slotId - 광고 슬롯 ID
     * @param {string} options.containerId - 광고 컨테이너 요소 ID
     * @param {Function} options.onLoading - 로딩 상태 콜백
     * @param {Function} options.onError - 에러 콜백
     * @param {Function} options.onRender - 렌더링 완료 콜백
     * @param {Object} options.styles - 컨테이너 스타일
     */
    constructor(options) {
        // 필수 옵션 확인
        if (!options.slotId) {
            throw new Error('Slot ID is required');
        }

        if (!options.containerId) {
            throw new Error('Container ID is required');
        }

        this.slotId = options.slotId;
        this.containerId = options.containerId;
        this.container = document.getElementById(options.containerId);

        if (!this.container) {
            throw new Error(`Container with ID "${options.containerId}" not found`);
        }

        // 콜백 함수
        this.onLoading = options.onLoading;
        this.onError = options.onError || config.get('onError');
        this.onRender = options.onRender;

        // 컨테이너 스타일
        if (options.styles) {
            renderer.styleContainer(this.container, options.styles);
        }

        // 커스텀 템플릿
        this.customTemplate = null;

        // 렌더링된 크리에이티브 추적
        this.renderedCreatives = [];

        // 트래킹 cleanups
        this.trackingCleanups = [];

        // 디버그 모드 로그
        if (config.get('debug')) {
            console.log(`Slot created: ${this.slotId} (container: ${this.containerId})`);
        }
    }

    /**
     * 커스텀 템플릿 추출
     * @returns {string|null} 추출된 템플릿 또는 null
     */
    extractCustomTemplate() {
        if (this.customTemplate !== null) {
            return this.customTemplate;
        }

        this.customTemplate = renderer.extractCustomTemplate(this.container);

        if (this.customTemplate) {
            // 템플릿 추출 후 컨테이너 비우기
            this.container.innerHTML = '';
        }

        return this.customTemplate;
    }

    /**
     * 광고 로드
     * @returns {Promise} 로드 프로미스
     */
    async load() {
        // 로딩 상태 콜백 호출
        if (this.onLoading) {
            this.onLoading(true);
        }

        try {
            // 커스텀 템플릿 추출
            this.extractCustomTemplate();

            // 광고 데이터 fetch
            const data = await apiClient.fetchAdsWithRetry(this.slotId);
            const serverCreatives = data.creatives || [];

            if (serverCreatives.length === 0) {
                this.container.innerHTML = '<div class="no-ads">광고를 불러올 수 없습니다</div>';

                // 에러 콜백 호출
                const error = new Error('No ads available');
                if (this.onError) {
                    this.onError(error);
                }

                return;
            }

            // 디버그 로그
            if (config.get('debug')) {
                console.log(`Loaded ${serverCreatives.length} creatives for slot ${this.slotId}`);
            }

            // 기존 트래킹 cleanup
            this._cleanupTracking();

            // 컨테이너 비우기 (렌더링 전)
            this.container.innerHTML = '';

            // 크리에이티브 렌더링
            serverCreatives.forEach(creativeData => {
                // 크리에이티브 객체 생성
                const creative = createCreative(creativeData);

                // 사전 처리
                const processedCreative = renderer.preProcessCreative(creative);

                // 렌더링
                const el = renderer.renderTemplate(processedCreative, this.container, this.customTemplate);

                if (el) {
                    // DOM에 추가
                    this.container.appendChild(el);

                    // 이벤트 바인딩
                    this._bindEvents(el, processedCreative);

                    // 렌더링된 크리에이티브 추적
                    this.renderedCreatives.push({
                        creative: processedCreative,
                        element: el
                    });

                    // 렌더 콜백 호출
                    if (this.onRender) {
                        this.onRender(processedCreative, el);
                    }
                }
            });

            // 이벤트 발생
            eventSystem.emit(EventTypes.AD_RENDERED, {
                slotId: this.slotId,
                container: this.container,
                creatives: this.renderedCreatives.map(item => item.creative)
            });

            return this.renderedCreatives;
        } catch (error) {
            console.error('Ad loading failed:', error);

            // 에러 처리
            handleError(error, ErrorTypes.GENERAL, {
                slotId: this.slotId,
                containerId: this.containerId
            });

            if (this.onError) {
                this.onError(error);
            }

            return [];
        } finally {
            // 로딩 완료 콜백 호출
            if (this.onLoading) {
                this.onLoading(false);
            }
        }
    }

    /**
     * 광고 엘리먼트에 이벤트 바인딩
     * @param {HTMLElement} el - 광고 엘리먼트
     * @param {Object} creative - 광고 크리에이티브
     * @private
     */
    _bindEvents(el, creative) {
        if (!el || !creative) return;

        // 플레이 버튼을 클릭한 경우를 추적하기 위한 변수
        let playButtonClicked = false;

        // 클릭 이벤트 핸들러
        const handleClick = async (event) => {
            // 플레이 버튼에 의한 클릭이면 랜딩 처리하지 않음
            if (playButtonClicked) {
                playButtonClicked = false; // 상태 초기화
                return;
            }

            try {
                // 클릭 이벤트 트래킹
                tracker.trackClick(creative);

                if (tracker.isRewardAd(creative.impType) && creative.apply?.ask) {
                    // apply 결과에 finalUrl이 있을 경우 랜딩 처리
                    const res = await apiClient.apply(creative);
                    if (res?.finalUrl) {
                        if (config.get('debug')) {
                            console.log('Redirecting to:', res.finalUrl);
                        }
                        location.href = res.finalUrl;
                    } else {
                        console.warn('No finalUrl in apply response:', res);
                    }
                } else if (creative.landingUrl) {
                    if (config.get('debug')) {
                        console.log('Redirecting to landing URL:', creative.landingUrl);
                    }
                    location.href = creative.landingUrl;
                } else {
                    console.warn('No landing URL available');
                }
            } catch (error) {
                console.error('Error in click handler:', error);
                handleError(error, ErrorTypes.GENERAL, {
                    operation: 'click',
                    creativeId: creative.id
                });
            }
        };

        // 클릭 이벤트 리스너 등록
        el.addEventListener('click', handleClick);

        // 비디오 광고인 경우 특별 처리
        if (creative.creativeFormat === "NATIVE_VIDEO") {
            const video = el.querySelector("video");
            if (video) {
                // 비디오 트래킹 설정
                const cleanupVideoTracking = tracker.setupVideoTracking(video, creative);
                if (cleanupVideoTracking) {
                    this.trackingCleanups.push(cleanupVideoTracking);
                }

                // 비디오 재생 버튼 클릭 처리
                const playButton = el.querySelector(".play-button");
                if (playButton) {
                    playButton.addEventListener("click", (event) => {
                        // 플레이 버튼 클릭 상태 설정
                        playButtonClicked = true;

                        // 이벤트 버블링 방지
                        event.stopPropagation();
                        event.preventDefault();

                        // 비디오 컨트롤 관련 로직은 renderer.js에서 처리됨
                    });
                }

                // 비디오 타임라인 업데이트
                const videoTimeline = el.querySelector(".video-timeline");
                if (videoTimeline) {
                    // 로직은 renderer.js에서 처리됨
                }
            }
        } else {
            // 일반 광고 노출 트래킹
            const cleanupImpressionTracking = tracker.setupImpressionTracking(el, creative);
            if (cleanupImpressionTracking) {
                this.trackingCleanups.push(cleanupImpressionTracking);
            }
        }
    }

    /**
     * 트래킹 정리
     * @private
     */
    _cleanupTracking() {
        // 모든 트래킹 cleanup 함수 실행
        this.trackingCleanups.forEach(cleanup => {
            if (typeof cleanup === 'function') {
                cleanup();
            }
        });

        // 배열 초기화
        this.trackingCleanups = [];
    }

    /**
     * 슬롯 파괴
     * 리소스 정리 및 이벤트 리스너 제거
     */
    destroy() {
        // 트래킹 정리
        this._cleanupTracking();

        // 컨테이너 비우기
        if (this.container) {
            this.container.innerHTML = '';
        }

        // 렌더링된 크리에이티브 정보 초기화
        this.renderedCreatives = [];

        // 디버그 로그
        if (config.get('debug')) {
            console.log(`Slot destroyed: ${this.slotId}`);
        }
    }

    /**
     * 슬롯 새로고침
     * 광고 다시 로드
     * @returns {Promise} 로드 프로미스
     */
    async refresh() {
        // 기존 리소스 정리
        this.destroy();

        // 새로 로드
        return this.load();
    }

    /**
     * 현재 렌더링된 크리에이티브 정보 가져오기
     * @returns {Array} 렌더링된 크리에이티브 배열
     */
    getRenderedCreatives() {
        return this.renderedCreatives.map(item => item.creative);
    }

    /**
     * 특정 인덱스의 렌더링된 크리에이티브 가져오기
     * @param {number} index - 크리에이티브 인덱스
     * @returns {Object|null} 크리에이티브 또는 null
     */
    getCreativeAt(index) {
        if (index >= 0 && index < this.renderedCreatives.length) {
            return this.renderedCreatives[index].creative;
        }
        return null;
    }

    /**
     * 슬롯 설정 업데이트
     * @param {Object} options - 업데이트할 옵션
     */
    updateOptions(options) {
        if (!options) return;

        // 콜백 함수 업데이트
        if (options.onLoading) {
            this.onLoading = options.onLoading;
        }

        if (options.onError) {
            this.onError = options.onError;
        }

        if (options.onRender) {
            this.onRender = options.onRender;
        }

        // 스타일 업데이트
        if (options.styles && this.container) {
            renderer.styleContainer(this.container, options.styles);
        }
    }
}

/**
 * 슬롯 생성 헬퍼 함수
 * @param {Object} options - 슬롯 옵션
 * @returns {Slot} 슬롯 객체
 */
export function createSlot(options) {
    return new Slot(options);
}

export default {
    Slot,
    createSlot
};