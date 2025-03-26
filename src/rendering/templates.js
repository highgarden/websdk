/**
 * CashFriends SDK - Templates Module
 * @description 광고 템플릿 정의 및 관리
 */
export class TemplateManager {
    constructor() {
      // 광고 템플릿 정의
      this.TEMPLATES = {
        // 이미지 광고 템플릿
        IMAGE: `
          <div class="ad-image" style="background-color:transparent;">
            <div class="main-image-wrap" style="width:100%;">
              <img data-asset-optional="MAIN_IMAGE" style="width:100%;display:block;" />
            </div>
          </div>
        `,
        
        // 제품 광고 템플릿
        PRODUCT: `
          <div class="ad-product" style="background-color:transparent;">
            <div class="product-image-wrap">
              <img data-asset-optional="MAIN_IMAGE" style="width:100%;display:block;" />
            </div>
          </div>
        `,
        
        // 오퍼월 광고 템플릿
        OFFERWALL: `
          <div class="ad-offerwall" style="background-color:transparent;">
            <div class="offer-image-wrap">
              <img data-asset-optional="MAIN_IMAGE" style="width:100%;display:block;" />
            </div>
            <div class="offer-content">
              <div class="offer-title" data-asset-optional="TITLE"></div>
              <div class="offer-description" data-asset-optional="DESCRIPTION"></div>
              <div class="offer-mission" data-asset-optional="MISSION_DESCRIPTION"></div>
            </div>
          </div>
        `,
        
        // 미니툰 광고 템플릿
        MINITOON: `
          <div class="ad-minitoon" style="background-color:transparent;">
            <div class="toon-images">
              <img class="toon-img-1" data-asset-optional="MAIN_IMAGE" data-index="1" style="width:100%;display:block;" />
              <img class="toon-img-2" data-asset-optional="MAIN_IMAGE" data-index="2" style="width:100%;display:none;" />
              <img class="toon-img-3" data-asset-optional="MAIN_IMAGE" data-index="3" style="width:100%;display:none;" />
              <img class="toon-img-4" data-asset-optional="MAIN_IMAGE" data-index="4" style="width:100%;display:none;" />
            </div>
          </div>
        `,
        
        // 마이크로 광고 템플릿
        MICRO: `
          <div class="ad-micro" style="background-color:transparent;">
            <div class="thumbnail-wrap">
              <img data-asset-optional="THUMBNAIL_IMAGE" style="width:100%;display:block;" />
            </div>
            <div class="pre-post-images">
              <img class="pre-image" data-asset-optional="PRE_IMAGE" style="display:none;" />
              <img class="post-image" data-asset-optional="POST_IMAGE" style="display:none;" />
            </div>
          </div>
        `,
        
        // 스플래시 광고 템플릿
        SPLASH: `
          <div class="ad-splash" style="background-color:transparent;">
            <div class="logo-wrap">
              <img data-asset-optional="LOGO_IMAGE" style="max-width:100%;display:block;" />
            </div>
            <div class="splash-main-wrap">
              <img data-asset-optional="MAIN_IMAGE" style="width:100%;display:block;" />
            </div>
          </div>
        `,
        
        // 빅 광고 템플릿
        BIG: `
          <div class="ad-big" style="background-color:transparent;">
            <div class="big-main-wrap">
              <img data-asset-optional="MAIN_IMAGE" style="width:100%;display:block;" />
            </div>
            <div class="text-image-wrap">
              <img data-asset-optional="TEXT_IMAGE" style="width:100%;display:block;" />
            </div>
          </div>
        `,
        
        // 네이티브 비디오 광고 템플릿
        NATIVE_VIDEO: `
          <div class="ad-native-visual">
            <div class="media-wrap" style="position: relative; overflow: hidden; aspect-ratio: 16/9;">
              <div class="video-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
                <video class="main-video" data-asset-optional="MAIN_VIDEO" autoplay muted playsinline style="width:100%;height:100%;object-fit:cover;display:block;"></video>
                <div class="video-timeline-container" style="position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: rgba(255,255,255,0.3); z-index: 2;">
                  <div class="video-timeline" style="height: 100%; width: 0%; background: #5d2de3; transition: width 0.1s linear;"></div>
                </div>
              </div>
              <div class="thumbnail-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: none;">
                <img class="video-thumbnail" data-asset-optional="MAIN_IMAGE" style="width:100%;height:100%;object-fit:cover;" />
                <div class="play-button" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 50px; height: 50px; background: rgba(0,0,0,0.5); border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 2;">
                  <div style="width: 0; height: 0; border-top: 10px solid transparent; border-left: 15px solid white; border-bottom: 10px solid transparent; margin-left: 3px;"></div>
                </div>
              </div>
            </div>
            <div class="overlay-info" style="background: #f7f7f7; padding: 12px;">
              <div class="ad-title" data-asset-optional="DESCRIPTION" style="font-size: 14px; font-weight: bold; margin-bottom: 6px;"></div>
              <div class="ad-meta" style="display: flex; justify-content: space-between; font-size: 12px; color: #666;">
                <span class="ad-indicator">AD</span>
                <span class="ad-more">더보기 ></span>
              </div>
            </div>
          </div>
        `,
        
        // 네이티브 이미지 광고 템플릿
        NATIVE_IMAGE: `
          <div class="ad-native-image" style="border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div class="native-img-wrap">
              <img data-asset-optional="MAIN_IMAGE" style="width:100%;display:block;" />
            </div>
            <div class="native-content" style="background: #f7f7f7; padding: 12px;">
              <div class="native-main-title" data-asset-optional="MAIN_TITLE" style="font-size: 14px; font-weight: bold; margin-bottom: 3px;"></div>
              <div class="native-sub-title" data-asset-optional="SUB_TITLE" style="font-size: 13px; color: #444; margin-bottom: 3px;"></div>
              <div class="native-description" data-asset-optional="DESCRIPTION" style="font-size: 12px; color: #666;"></div>
              <div class="ad-indicator" style="font-size: 11px; color: #888; margin-top: 5px; display: flex; justify-content: space-between;">
                <span>AD</span>
                <span class="ad-more">더보기 ></span>
              </div>
            </div>
          </div>
        `,
        
        // 네이티브 피드 광고 템플릿
        NATIVE_FEED: `
          <div class="native-feed-card" style="border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); background: #fff; margin-bottom: 16px;">
            <img class="feed-main-img" data-asset-optional="MAIN_IMAGE" style="width: 100%; display: block; object-fit: cover;" />
            <div class="feed-body" style="padding: 16px;">
              <div class="feed-title" data-asset-optional="TITLE" style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #111;"></div>
              <div class="feed-desc" data-asset-optional="DESCRIPTION" style="font-size: 14px; color: #555; margin-bottom: 16px;"></div>
              <button class="cta-button" style="width: 100%; padding: 16px; border-radius: 8px; border: 1px solid #ececec; background: #fff; font-size: 16px; display: flex; justify-content: center; align-items: center; cursor: pointer; font-weight: bold;">
                <span class="cta-text" data-asset-optional="CTA_TEXT" style="color: #333;">사전예약하면</span>
                <span style="margin: 0 4px; font-weight: bold; color: #333;">+</span>
                <span class="reward-text" data-reward-optional style="font-weight: bold; color: #333;">1,000 캐시</span>
              </button>
              <div class="icon-text-container" style="font-size: 13px; color: #777; margin-top: 8px; display: none;">
                <img class="icon-text-image" style="display: none; vertical-align: middle; width: 16px; height: 16px; margin-right: 4px;" />
                <span class="icon-text" data-asset-optional="ICON_TEXT"></span>
              </div>
            </div>
          </div>
        `,
        
        // 배너 이미지 광고 템플릿
        BANNER_IMAGE: `
          <div class="ad-banner-image" style="background-color:transparent;">
            <div class="banner-image-wrap">
              <img data-asset-optional="MAIN_IMAGE" style="width:100%;display:block;" />
            </div>
          </div>
        `,
        
        // 기본 템플릿
        DEFAULT: `
          <div class="default-ad-card" style="background-color:transparent;">
            <div class="main-image-wrap" style="width:100%;">
              <img data-asset-optional="MAIN_IMAGE" style="width:100%;display:block;" />
            </div>
          </div>
        `
      };
    }
  
    /**
     * 템플릿 가져오기
     * @param {string} templateName - 템플릿 이름
     * @returns {string} 템플릿 HTML
     */
    getTemplate(templateName) {
      return this.TEMPLATES[templateName] || this.TEMPLATES.DEFAULT;
    }
  
    /**
     * 모든 템플릿 이름 목록 가져오기
     * @returns {Array<string>} 템플릿 이름 목록
     */
    getTemplateNames() {
      return Object.keys(this.TEMPLATES);
    }
  
    /**
     * 커스텀 템플릿 추가
     * @param {string} templateName - 템플릿 이름
     * @param {string} templateHtml - 템플릿 HTML
     */
    addTemplate(templateName, templateHtml) {
      if (typeof templateName !== 'string' || typeof templateHtml !== 'string') {
        throw new Error('Template name and HTML must be strings');
      }
      
      this.TEMPLATES[templateName] = templateHtml;
    }
  
    /**
     * 템플릿 수정
     * @param {string} templateName - 템플릿 이름
     * @param {string} templateHtml - 새 템플릿 HTML
     * @returns {boolean} 성공 여부
     */
    updateTemplate(templateName, templateHtml) {
      if (!this.TEMPLATES[templateName]) {
        return false;
      }
      
      this.TEMPLATES[templateName] = templateHtml;
      return true;
    }
  
    /**
     * 모든 템플릿에 공통 스타일 적용
     * @param {Object} styles - 적용할 CSS 스타일 객체
     */
    applyGlobalStyles(styles) {
      if (typeof styles !== 'object') {
        throw new Error('Styles must be an object');
      }
      
      // 스타일 문자열 생성
      const styleStr = Object.entries(styles)
        .map(([prop, value]) => `${prop}: ${value};`)
        .join(' ');
      
      // 모든 템플릿의 루트 요소에 스타일 적용
      Object.keys(this.TEMPLATES).forEach(key => {
        const template = this.TEMPLATES[key];
        
        // 첫 번째 태그에 스타일 추가
        this.TEMPLATES[key] = template.replace(/<div/, `<div style="${styleStr}"`);
      });
    }
  }
  
  // 싱글톤 인스턴스 생성 및 내보내기
  export default new TemplateManager();