/**
 * CashFriends SDK - Renderer Module
 * @description 광고 렌더링을 담당하는 모듈
 */
import config from '../core/config.js';
import templateManager from './templates.js';
import { handleError, ErrorTypes, applyStyles } from '../core/utils.js';
import eventSystem from '../core/events.js';
import { EventTypes } from '../core/utils.js';

export class Renderer {
  /**
   * 커스텀 템플릿 확인 및 추출
   * @param {HTMLElement} container - 광고가 표시될 컨테이너
   * @returns {string|null} 커스텀 템플릿 HTML 문자열 또는 null
   */
  extractCustomTemplate(container) {
    if (!config.get('useCustomTemplate') || !container) return null;
    
    // 컨테이너에 내용이 있는지 확인
    if (container.children.length > 0) {
      if (config.get('debug')) {
        console.log('Custom template found in container:', container.innerHTML);
      }
      return container.innerHTML;
    }
    
    return null;
  }

  /**
   * 광고 템플릿 렌더링
   * @param {Object} creative - 광고 크리에이티브
   * @param {HTMLElement} container - 렌더링 컨테이너
   * @param {string} customTemplate - 커스텀 템플릿 (옵션)
   * @returns {HTMLElement} 렌더링된 광고 엘리먼트
   */
  renderTemplate(creative, container, customTemplate) {
    try {
      if (!creative) {
        throw new Error('Creative is required for rendering');
      }
      
      // 템플릿 결정: 
      // 1. 커스텀 템플릿이 있으면 우선 사용
      // 2. creativeFormat에 맞는 내장 템플릿 사용
      // 3. 기본 템플릿 사용
      const raw = customTemplate || templateManager.getTemplate(creative.creativeFormat);
      
      // HTML 파싱
      const parser = new DOMParser();
      const doc = parser.parseFromString(raw, 'text/html');
      const el = doc.body.firstElementChild;
      
      if (!el) {
        throw new Error('Template parsing failed: No valid element found');
      }
      
      // 크리에이티브 타입별 특수 처리
      this._processCreativeByType(creative, el);
      
      // 옵셔널 애셋 처리 (data-asset-optional 속성 사용)
      this._processOptionalAssets(creative, el);

      // 보상 정보 처리
      this._processRewardInfo(creative, el);

      // 이벤트 발생
      eventSystem.emit(EventTypes.AD_RENDERED, {
        creative,
        element: el
      });
      
      return el;
    } catch (error) {
      handleError(error, ErrorTypes.RENDERING, {
        creativeId: creative?.id || 'unknown',
        creativeFormat: creative?.creativeFormat || 'unknown'
      });
      return null;
    }
  }

  /**
   * 크리에이티브 타입별 특수 처리
   * @param {Object} creative - 광고 크리에이티브
   * @param {HTMLElement} el - 렌더링 요소
   * @private
   */
  _processCreativeByType(creative, el) {
    const creativeFormat = creative.creativeFormat;
    
    // 비디오 광고 처리
    if (creativeFormat === "NATIVE_VIDEO") {
      this._configureVideoTemplate(creative, el);
    }
    
    // 네이티브 피드 처리
    if (creativeFormat === "NATIVE_FEED") {
      this._configureNativeFeedTemplate(creative, el);
    }
    
    // 미니툰 특수 처리
    if (creativeFormat === "MINITOON") {
      this._configureMiniToonTemplate(creative, el);
    }
  }

  /**
   * 비디오 템플릿 설정
   * @param {Object} creative - 광고 크리에이티브
   * @param {HTMLElement} el - 템플릿 요소
   * @private
   */
  _configureVideoTemplate(creative, el) {
    const mainImageAsset = creative.assets?.find(a => a.type === "MAIN_IMAGE");
    const mainVideoAsset = creative.assets?.find(a => a.type === "MAIN_VIDEO");
    
    // 비디오가 없고 이미지만 있는 경우, 이미지만 표시
    if (!mainVideoAsset && mainImageAsset) {
      const videoContainer = el.querySelector(".video-container");
      const thumbnailContainer = el.querySelector(".thumbnail-container");
      
      if (videoContainer && thumbnailContainer) {
        videoContainer.style.display = "none";
        thumbnailContainer.style.display = "block";
      }
    } else if (mainVideoAsset) {
      // 비디오가 있는 경우, 비디오 타임라인 업데이트 처리
      const video = el.querySelector("video");
      const videoTimeline = el.querySelector(".video-timeline");
      
      if (video && videoTimeline) {
        video.addEventListener("timeupdate", () => {
          if (video.duration) {
            requestAnimationFrame(() => {
              const progress = (video.currentTime / video.duration) * 100;
              videoTimeline.style.width = progress + "%";
            });
          }
        });
        
        // 비디오 종료 후 썸네일 표시
        video.addEventListener("ended", () => {
          const videoContainer = el.querySelector(".video-container");
          const thumbnailContainer = el.querySelector(".thumbnail-container");
          
          if (videoContainer && thumbnailContainer && mainImageAsset) {
            videoContainer.style.display = "none";
            thumbnailContainer.style.display = "block";
          }
        });
        
        // 재생 버튼 클릭 이벤트
        const playButton = el.querySelector(".play-button");
        if (playButton) {
          playButton.addEventListener("click", (event) => {
            event.stopPropagation();
            event.preventDefault();
            
            const videoContainer = el.querySelector(".video-container");
            const thumbnailContainer = el.querySelector(".thumbnail-container");
            
            if (videoContainer && thumbnailContainer) {
              thumbnailContainer.style.display = "none";
              videoContainer.style.display = "block";
              
              // 비디오 재생 시작
              video.currentTime = 0;
              video.play().catch(err => {
                console.error("비디오 재생 실패:", err);
                videoContainer.style.display = "none";
                thumbnailContainer.style.display = "block";
              });
              
              // 타임라인 초기화
              if (videoTimeline) {
                videoTimeline.style.width = "0%";
              }
            }
          });
        }
      }
    }
  }

  /**
   * 네이티브 피드 템플릿 설정
   * @param {Object} creative - 광고 크리에이티브
   * @param {HTMLElement} el - 템플릿 요소
   * @private
   */
  _configureNativeFeedTemplate(creative, el) {
    // ICON_TEXT가 있는 경우 표시
    const iconTextAsset = creative.assets?.find(a => a.type === "ICON_TEXT");
    const iconTextContainer = el.querySelector('.icon-text-container');
    const iconTextEl = el.querySelector('[data-asset-optional="ICON_TEXT"]');
    const iconTextImage = el.querySelector('.icon-text-image');
    
    if (iconTextAsset && iconTextEl && iconTextContainer) {
      const iconText = iconTextAsset.value;
      iconTextEl.textContent = iconText;
      iconTextContainer.style.display = "block";
      
      // iconTextMap에서 해당 텍스트에 매핑된 이미지가 있는지 확인
      const iconTextMap = config.get('iconTextMap');
      if (iconTextMap[iconText] && iconTextImage) {
        iconTextImage.src = iconTextMap[iconText];
        iconTextImage.style.display = "inline-block";
        
        if (config.get('debug')) {
          console.log(`Applied icon image for ICON_TEXT "${iconText}": ${iconTextMap[iconText]}`);
        }
      }
    }
  }

  /**
   * 미니툰 템플릿 설정
   * @param {Object} creative - 광고 크리에이티브
   * @param {HTMLElement} el - 템플릿 요소
   * @private
   */
  _configureMiniToonTemplate(creative, el) {
    // 미니툰 이미지 자동 슬라이딩 설정
    const toonImages = Array.from(el.querySelectorAll('[data-asset-optional="MAIN_IMAGE"]'));
    if (toonImages.length > 1) {
      let currentIndex = 0;
      
      // 몇 개의 이미지가 실제 존재하는지 확인
      const validImages = toonImages.filter(img => {
        const index = parseInt(img.getAttribute('data-index') || '0');
        const assets = creative.assets?.filter(a => a.type === 'MAIN_IMAGE') || [];
        return index <= assets.length;
      });
      
      if (validImages.length > 1) {
        const intervalTime = 3000; // 3초마다 이미지 변경
        
        const slideInterval = setInterval(() => {
          // 현재 이미지 숨기기
          validImages[currentIndex].style.display = 'none';
          
          // 다음 이미지 표시
          currentIndex = (currentIndex + 1) % validImages.length;
          validImages[currentIndex].style.display = 'block';
        }, intervalTime);
        
        // 요소가 DOM에서 제거될 때 인터벌 정리
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.removedNodes) {
              mutation.removedNodes.forEach((node) => {
                if (node === el || node.contains(el)) {
                  clearInterval(slideInterval);
                  observer.disconnect();
                }
              });
            }
          });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }
  }

  /**
   * 옵셔널 에셋 처리
   * @param {Object} creative - 광고 크리에이티브
   * @param {HTMLElement} el - 템플릿 요소
   * @private
   */
  _processOptionalAssets(creative, el) {
    el.querySelectorAll('[data-asset-optional]').forEach(target => {
      const type = target.getAttribute('data-asset-optional');
      let index = null;
      
      // MINITOON 형식의 경우 data-index 속성을 사용하여 여러 이미지 처리
      if (target.hasAttribute('data-index')) {
        index = target.getAttribute('data-index');
      }
      
      // 해당 타입의 에셋 찾기 (인덱스가 있는 경우, 배열에서 순서에 맞는 에셋 찾기)
      let asset = null;
      if (index !== null && creative.creativeFormat === 'MINITOON') {
        // MINITOON 형식일 경우 같은 MAIN_IMAGE 타입의 에셋을 여러 개 제공받을 수 있음
        const assets = creative.assets?.filter(a => a.type === type) || [];
        if (assets.length >= parseInt(index)) {
          asset = assets[parseInt(index) - 1];
        }
      } else {
        asset = creative.assets?.find(a => a.type === type);
      }
      
      // 에셋이 없는 경우 처리
      if (!asset) {
        if (config.get('debug')) {
          console.warn(`옵셔널 에셋 누락: ${type}${index ? ` (인덱스: ${index})` : ''}`);
        }
        
        // 비디오인 경우 대체 이미지 표시 시도
        if (type === "MAIN_VIDEO" && target.tagName === "VIDEO") {
          const thumbnailContainer = el.querySelector('.thumbnail-container');
          const videoContainer = target.closest('.video-container');
          
          if (thumbnailContainer && videoContainer) {
            videoContainer.style.display = "none";
            thumbnailContainer.style.display = "block";
          }
        } 
        // 개별 요소만 숨기고 컨테이너는 유지
        else {
          target.style.display = "none";
        }
        return;
      }
      
      // 에셋 타입에 따른 처리
      if (asset.assetType === 'TEXT') {
        target.textContent = asset.value;
        target.style.display = "block";
      }
      if (asset.assetType === 'IMAGE' || asset.assetType === 'VIDEO') {
        target.setAttribute('src', asset.value);
        target.style.display = "block";
        
        // 이미지나 비디오가 로드되었을 때 포맷에 맞게 스타일 조정
        if (asset.assetType === 'IMAGE' && target.tagName === 'IMG') {
          target.addEventListener('load', () => {
            this._adjustImageStyles(target, creative.creativeFormat);
          });
        }
      }
    });
  }

  /**
   * 이미지 스타일 조정
   * @param {HTMLImageElement} imageElement - 이미지 요소
   * @param {string} creativeFormat - 크리에이티브 포맷
   * @private
   */
  _adjustImageStyles(imageElement, creativeFormat) {
    // 특정 포맷에 따른 이미지 스타일 조정
    switch (creativeFormat) {
      case 'NATIVE_FEED':
        // 네이티브 피드의 경우 이미지 비율 조정
        if (imageElement.classList.contains('feed-main-img')) {
          applyStyles(imageElement, {
            aspectRatio: '16/9',
            objectFit: 'cover'
          });
        }
        break;
        
      case 'NATIVE_IMAGE':
        // 네이티브 이미지의 경우 둥근 모서리 적용
        applyStyles(imageElement, {
          borderTopLeftRadius: '10px',
          borderTopRightRadius: '10px'
        });
        break;
    }
  }

  /**
   * 보상 정보 처리
   * @param {Object} creative - 광고 크리에이티브
   * @param {HTMLElement} el - 템플릿 요소
   * @private
   */
  _processRewardInfo(creative, el) {
    const rewardEl = el?.querySelector('[data-reward-optional]');
    if (!rewardEl) return;
    
    if (creative.adReward?.rewardAmount) {
      rewardEl.textContent = creative.adReward.rewardAmount.toLocaleString() + ' 캐시';
      rewardEl.style.display = "inline";
    } else {
      rewardEl.style.display = "none";
      
      // NATIVE_FEED 경우 CTA 버튼 스타일 조정
      if (creative.creativeFormat === "NATIVE_FEED") {
        const ctaButton = rewardEl.closest('.cta-button');
        if (ctaButton) {
          const plusSign = ctaButton.querySelector('span[style*="margin: 0 4px"]');
          if (plusSign) plusSign.style.display = "none";
        }
      }
    }
  }

  /**
   * 렌더링 시 테마 스타일 적용
   * @param {HTMLElement} element - 적용할 요소
   * @param {Object} theme - 테마 설정
   */
  applyTheme(element, theme) {
    if (!element || !theme) return;
    
    const primaryColor = theme.primaryColor || '#5d2de3';
    const textColor = theme.textColor || '#333333';
    const backgroundColor = theme.backgroundColor || '#ffffff';
    const borderRadius = theme.borderRadius || '8px';
    
    // 기본 컨테이너 스타일 적용
    applyStyles(element, {
      backgroundColor: backgroundColor,
      color: textColor,
      borderRadius: borderRadius,
      overflow: 'hidden'
    });
    
    // 버튼 스타일 적용
    const buttons = element.querySelectorAll('button, .cta-button, .play-button');
    buttons.forEach(button => {
      applyStyles(button, {
        backgroundColor: primaryColor,
        color: '#ffffff',
        borderRadius: '4px',
        border: 'none'
      });
    });
    
    // 타임라인 스타일 적용
    const timelines = element.querySelectorAll('.video-timeline');
    timelines.forEach(timeline => {
      timeline.style.backgroundColor = primaryColor;
    });
    
    // 제목 스타일 적용
    const titles = element.querySelectorAll('.native-main-title, .feed-title, .ad-title, .offer-title');
    titles.forEach(title => {
      applyStyles(title, {
        color: textColor,
        fontWeight: 'bold'
      });
    });
  }

  /**
   * 광고 컨테이너 스타일 설정
   * @param {HTMLElement} container - 광고 컨테이너
   * @param {Object} styles - 적용할 스타일
   */
  styleContainer(container, styles) {
    if (!container || !styles) return;
    
    applyStyles(container, styles);
  }

  /**
   * 렌더링 이전 사전 처리
   * @param {Object} creative - 광고 크리에이티브
   * @returns {Object} 수정된 크리에이티브
   */
  preProcessCreative(creative) {
    if (!creative) return creative;
    
    // 딥 복사로 원본 데이터 보존
    const clonedCreative = JSON.parse(JSON.stringify(creative));
    
    // 필요한 경우 에셋 URL 수정 (예: HTTPS 강제 적용)
    if (clonedCreative.assets && Array.isArray(clonedCreative.assets)) {
      clonedCreative.assets = clonedCreative.assets.map(asset => {
        if (asset.assetType === 'IMAGE' || asset.assetType === 'VIDEO') {
          // HTTP URL을 HTTPS로 변환
          if (asset.value && asset.value.startsWith('http:')) {
            asset.value = asset.value.replace('http:', 'https:');
          }
        }
        return asset;
      });
    }
    
    return clonedCreative;
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export default new Renderer();