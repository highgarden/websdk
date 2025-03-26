/**
 * CashFriends SDK - Event System Module
 * @description 이벤트 발행/구독 시스템
 */
export class EventSystem {
    constructor() {
      this.events = {};
      this.debugEnabled = false;
    }
  
    /**
     * 디버깅 활성화 설정
     * @param {boolean} enabled - 디버깅 활성화 여부
     */
    setDebug(enabled) {
      this.debugEnabled = !!enabled;
    }
  
    /**
     * 이벤트 구독
     * @param {string} eventName - 이벤트 이름
     * @param {Function} callback - 콜백 함수
     * @returns {Function} 구독 취소 함수
     */
    on(eventName, callback) {
      if (!this.events[eventName]) {
        this.events[eventName] = [];
      }
      
      this.events[eventName].push(callback);
      
      if (this.debugEnabled) {
        console.log(`[EventSystem] Subscribed to "${eventName}"`);
      }
      
      // 구독 취소 함수 반환
      return () => this.off(eventName, callback);
    }
  
    /**
     * 이벤트 한 번만 구독
     * @param {string} eventName - 이벤트 이름
     * @param {Function} callback - 콜백 함수
     * @returns {Function} 구독 취소 함수
     */
    once(eventName, callback) {
      const onceWrapper = (...args) => {
        this.off(eventName, onceWrapper);
        callback.apply(this, args);
      };
      
      return this.on(eventName, onceWrapper);
    }
  
    /**
     * 이벤트 구독 취소
     * @param {string} eventName - 이벤트 이름
     * @param {Function} callback - 취소할 콜백 함수
     */
    off(eventName, callback) {
      if (!this.events[eventName]) return;
      
      if (callback) {
        this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
      } else {
        // 콜백이 제공되지 않으면 모든 구독 취소
        delete this.events[eventName];
      }
      
      if (this.debugEnabled) {
        console.log(`[EventSystem] Unsubscribed from "${eventName}"`);
      }
    }
  
    /**
     * 이벤트 발행
     * @param {string} eventName - 이벤트 이름
     * @param {...any} args - 이벤트 데이터
     */
    emit(eventName, ...args) {
      if (!this.events[eventName]) return;
      
      if (this.debugEnabled) {
        console.log(`[EventSystem] Emitting "${eventName}" with data:`, args);
      }
      
      this.events[eventName].forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`[EventSystem] Error in "${eventName}" event handler:`, error);
        }
      });
    }
  
    /**
     * 모든 이벤트 구독 취소
     */
    clear() {
      this.events = {};
      
      if (this.debugEnabled) {
        console.log('[EventSystem] All event subscriptions cleared');
      }
    }
  
    /**
     * 특정 이벤트의 구독자 수 반환
     * @param {string} eventName - 이벤트 이름
     * @returns {number} 구독자 수
     */
    listenerCount(eventName) {
      return this.events[eventName]?.length || 0;
    }
  }
  
  // 싱글톤 인스턴스 생성 및 내보내기
  export default new EventSystem();