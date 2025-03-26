/**
 * CashFriends SDK - Tracking Module
 * @description 광고 이벤트 추적을 담당하는 모듈
 */
import config from '../core/config.js';
import { handleError, ErrorTypes, isSupportedFeature } from '../core/utils.js';
import eventSystem from '../core/events.js';
import { EventTypes } from '../core/utils.js';

export class Tracker {
  constructor() {
    // 비디오 트래킹 상태를 저장하는 맵
    this.videoTrackingState = new Map();
  }

  /**
   * 이벤트 추적
   * @param {Object} params - 추적 파라미터
   * @returns {Promise} 추적 결과
   */
  async trackEvent({ ask, actType }) {
    try {
      const url = `${config.getTrackingEndpoint()}?ask=${encodeURIComponent(ask)}&actType=${actType}&env=${config.get('env')}`;
      
      const response = await fetch(url);
      
      if (config.get('debug')) {
        console.log(`Event tracked: ${actType} for ask: ${ask}`);
      }
      
      return response.ok;
    } catch (error) {
      if (config.get('debug')) {
        console.warn('Event tracking failed:', error);
      }
      
      handleError(error, ErrorTypes.TRACKING, {
        ask, 
        actType
      });
      
      return false;
    }
  }

  /**
   * 비디오 이벤트 트래킹 설정
   * @param {HTMLVideoElement} videoElement - 비디오 요소
   * @param {Object} creative - 광고 크리에이티브
   */
  setupVideoTracking(videoElement, creative) {
    if (!videoElement || !creative || !creative.apply?.ask) return;
    
    // 트래킹 상태 초기화
    const trackingKey = `${creative.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.videoTrackingState.set(trackingKey, {
      tracked: {
        VIMP: false,
        V_PROGRESS_3S: false,
        V_1Q: false,
        V_MID: false,
        V_3Q: false,
        V_COMPLETE: false
      },
      videoElement,
      creative
    });
    
    // 비디오 이벤트 핸들러 등록
    this._registerVideoEventHandlers(trackingKey);
    
    // 비디오 가시성 트래킹 설정
    this._setupVideoVisibilityTracking(trackingKey);
    
    // 정리 함수 반환
    return () => {
      this._cleanupVideoTracking(trackingKey);
    };
  }

  /**
   * 비디오 이벤트 핸들러 등록
   * @param {string} trackingKey - 트래킹 키
   * @private
   */
  _registerVideoEventHandlers(trackingKey) {
    const state = this.videoTrackingState.get(trackingKey);
    if (!state) return;
    
    const { videoElement, creative, tracked } = state;
    const ask = creative.apply?.ask;
    
    // 트래킹 헬퍼 함수
    const trackIfNotTracked = (actType) => {
      if (!tracked[actType]) {
        this.trackEvent({ ask, actType });
        tracked[actType] = true;
        
        // 이벤트 발생
        if (actType === 'V_COMPLETE') {
          eventSystem.emit(EventTypes.AD_VIDEO_COMPLETED, {
            creative
          });
        }
      }
    };
    
    // 비디오 종료 시 트래킹
    videoElement.addEventListener('ended', () => {
      trackIfNotTracked('V_COMPLETE');
    });
    
    // 비디오 시간 업데이트 시 진행률 트래킹
    videoElement.addEventListener('timeupdate', () => {
      const duration = videoElement.duration;
      if (isNaN(duration) || duration <= 0) return;
      
      const currentTime = videoElement.currentTime;
      const progress = currentTime / duration;
      
      if (currentTime >= 3 && !tracked.V_PROGRESS_3S) {
        trackIfNotTracked('V_PROGRESS_3S');
      }
      
      if (progress >= 0.25 && !tracked.V_1Q) {
        trackIfNotTracked('V_1Q');
      }
      
      if (progress >= 0.5 && !tracked.V_MID) {
        trackIfNotTracked('V_MID');
      }
      
      if (progress >= 0.75 && !tracked.V_3Q) {
        trackIfNotTracked('V_3Q');
      }
    });
    
    // 비디오 시작 시 이벤트 발생
    videoElement.addEventListener('play', () => {
      if (!videoElement.dataset.played) {
        videoElement.dataset.played = 'true';
        eventSystem.emit(EventTypes.AD_VIDEO_STARTED, {
          creative
        });
      }
    });
  }

  /**
   * 비디오 가시성 트래킹 설정
   * @param {string} trackingKey - 트래킹 키
   * @private
   */
  _setupVideoVisibilityTracking(trackingKey) {
    const state = this.videoTrackingState.get(trackingKey);
    if (!state) return;
    
    const { videoElement, creative, tracked } = state;
    const ask = creative.apply?.ask;
    
    // IntersectionObserver API 지원 확인
    if (isSupportedFeature.intersectionObserver()) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          // 화면에 50% 이상 노출 시
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // VIMP 이벤트 추적을 위한 타이머 설정 (1초 이상 노출)
            const vimpTimer = setTimeout(() => {
              if (!tracked.VIMP) {
                this.trackEvent({ ask, actType: 'VIMP' });
                tracked.VIMP = true;
              }
            }, 1000);
            
            // 요소가 화면에서 벗어나면 타이머 취소
            const cleanupObserver = new IntersectionObserver(cleanupEntries => {
              cleanupEntries.forEach(cleanupEntry => {
                if (!cleanupEntry.isIntersecting || cleanupEntry.intersectionRatio < 0.5) {
                  clearTimeout(vimpTimer);
                  cleanupObserver.disconnect();
                }
              });
            }, { threshold: 0.5 });
            
            cleanupObserver.observe(videoElement);
            
            // 비디오 자동 재생 시도
            if (!videoElement.dataset.played) {
              videoElement.play().catch(err => {
                console.error("비디오 자동 재생 실패:", err);
              });
            }
          }
        });
      }, { threshold: 0.5 });
      
      // 관찰 시작
      observer.observe(videoElement);
      
      // 관찰 객체 저장 (정리를 위해)
      state.visibilityObserver = observer;
    } else {
      // 폴백: 비디오 로드 시 단순 VIMP 트래킹
      if (!tracked.VIMP) {
        this.trackEvent({ ask, actType: 'VIMP' });
        tracked.VIMP = true;
      }
    }
  }

  /**
   * 비디오 트래킹 정리
   * @param {string} trackingKey - 트래킹 키
   * @private
   */
  _cleanupVideoTracking(trackingKey) {
    const state = this.videoTrackingState.get(trackingKey);
    if (!state) return;
    
    // IntersectionObserver 정리
    if (state.visibilityObserver) {
      state.visibilityObserver.disconnect();
    }
    
    // 상태 맵에서 제거
    this.videoTrackingState.delete(trackingKey);
  }

  /**
   * 일반 노출 트래킹 설정
   * @param {HTMLElement} element - 트래킹할 요소
   * @param {Object} creative - 광고 크리에이티브
   * @returns {Function} 정리 함수
   */
  setupImpressionTracking(element, creative) {
    if (!element || !creative || !creative.apply?.ask) return () => {};
    
    const ask = creative.apply.ask;
    let tracked = false;
    let observer = null;
    
    // IntersectionObserver API 지원 확인
    if (isSupportedFeature.intersectionObserver()) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !tracked) {
            // 1초 이상 노출 시 VIMP 이벤트 전송
            const vimpTimer = setTimeout(() => {
              this.trackEvent({ ask, actType: 'VIMP' });
              tracked = true;
              
              // 이벤트 발생
              eventSystem.emit(EventTypes.AD_IMPRESSION, {
                creative
              });
              
              // 관찰 중단
              observer.disconnect();
            }, 1000);
            
            // 요소가 화면에서 벗어나면 타이머 취소
            const cleanupObserver = new IntersectionObserver(cleanupEntries => {
              cleanupEntries.forEach(cleanupEntry => {
                if (!cleanupEntry.isIntersecting || cleanupEntry.intersectionRatio < 0.5) {
                  clearTimeout(vimpTimer);
                  cleanupObserver.disconnect();
                }
              });
            }, { threshold: 0.5 });
            
            cleanupObserver.observe(element);
          }
        });
      }, { threshold: 0.5 });
      
      // 관찰 시작
      observer.observe(element);
    } else {
      // 폴백: 요소 로드 시 단순 VIMP 트래킹
      if (!tracked) {
        this.trackEvent({ ask, actType: 'VIMP' });
        tracked = true;
        
        // 이벤트 발생
        eventSystem.emit(EventTypes.AD_IMPRESSION, {
          creative
        });
      }
    }
    
    // 정리 함수 반환
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }

  /**
   * 클릭 이벤트 트래킹
   * @param {Object} creative - 광고 크리에이티브
   */
  trackClick(creative) {
    if (!creative || !creative.apply?.ask) return;
    
    this.trackEvent({ ask: creative.apply.ask, actType: 'CLICK' });
    
    // 이벤트 발생
    eventSystem.emit(EventTypes.AD_CLICKED, {
      creative
    });
  }

  /**
   * 보상형 광고 체크
   * @param {number} impType - 광고 임프레션 타입
   * @returns {boolean} 보상형 광고 여부
   */
  isRewardAd(impType) {
    return config.isRewardAdType(impType);
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export default new Tracker();