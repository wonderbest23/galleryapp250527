// 클라이언트 사이드 에러 로깅 유틸리티

export class ErrorLogger {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  // 세션 ID 생성
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 전역 에러 핸들러 설정
  setupGlobalErrorHandlers() {
    // JavaScript 에러 캐치
    window.addEventListener('error', (event) => {
      this.logError({
        error_type: 'JavaScript Error',
        error_message: event.message,
        error_stack: event.error?.stack,
        error_url: event.filename,
        component: 'Global',
        action: 'Runtime Error'
      });
    });

    // Promise rejection 에러 캐치
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        error_type: 'Promise Rejection',
        error_message: event.reason?.message || event.reason,
        error_stack: event.reason?.stack,
        error_url: window.location.href,
        component: 'Global',
        action: 'Promise Rejection'
      });
    });

    // React 에러 바운더리 (선택사항)
    if (typeof window !== 'undefined' && window.React) {
      // React Error Boundary와 연동
    }
  }

  // 에러 로깅
  async logError(errorData) {
    try {
      const logData = {
        type: errorData.type || 'client',
        message: errorData.message || 'Unknown error',
        stack: errorData.stack || '',
        component: errorData.component || 'Unknown',
        severity: errorData.severity || 'medium',
        category: errorData.category || 'general',
        user_id: errorData.user_id || null,
        session_id: errorData.session_id || this.sessionId,
        url: errorData.url || window.location.href,
        user_agent: errorData.user_agent || navigator.userAgent,
        created_at: new Date().toISOString()
      };

      console.log('에러 로깅 시도:', logData);

      // 서버로 전송
      const response = await fetch('/api/error-monitoring/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });

      if (response.ok) {
        console.log('에러 로깅 성공');
        const result = await response.json();
        return result;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('에러 로깅 실패:', error);
      
      // 오프라인일 때 로컬 스토리지에 저장
      this.saveToLocalStorage(errorData);
    }
  }

  // 로컬 스토리지에 저장
  saveToLocalStorage(errorData) {
    try {
      const errors = JSON.parse(localStorage.getItem('pending_errors') || '[]');
      errors.push(errorData);
      
      // 최대 50개까지만 저장
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      localStorage.setItem('pending_errors', JSON.stringify(errors));
    } catch (error) {
      console.error('로컬 스토리지 저장 실패:', error);
    }
  }

  // 로컬 스토리지에서 제거
  removeFromLocalStorage(errorData) {
    try {
      const errors = JSON.parse(localStorage.getItem('pending_errors') || '[]');
      const filteredErrors = errors.filter(error => 
        error.timestamp !== errorData.timestamp
      );
      localStorage.setItem('pending_errors', JSON.stringify(filteredErrors));
    } catch (error) {
      console.error('로컬 스토리지 제거 실패:', error);
    }
  }

  // 대기 중인 에러 재전송
  async retryPendingErrors() {
    try {
      const errors = JSON.parse(localStorage.getItem('pending_errors') || '[]');
      
      for (const error of errors) {
        await this.logError(error);
        // 잠시 대기 (서버 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('대기 중인 에러 재전송 실패:', error);
    }
  }

  // 수동 에러 로깅
  logManualError(errorType, errorMessage, component, action, metadata = {}) {
    this.logError({
      error_type: errorType,
      error_message: errorMessage,
      component: component,
      action: action,
      metadata: metadata
    });
  }

  // API 에러 로깅
  logApiError(url, method, status, response, error) {
    this.logError({
      error_type: 'API Error',
      error_message: `API 요청 실패: ${method} ${url} - ${status}`,
      error_stack: error?.stack,
      component: 'API',
      action: `${method} ${url}`,
      metadata: {
        url: url,
        method: method,
        status: status,
        response: response,
        error: error?.message
      }
    });
  }

  // 네트워크 에러 로깅
  logNetworkError(url, method, error) {
    this.logError({
      error_type: 'Network Error',
      error_message: `네트워크 오류: ${method} ${url}`,
      error_stack: error?.stack,
      component: 'Network',
      action: `${method} ${url}`,
      metadata: {
        url: url,
        method: method,
        error: error?.message,
        online: navigator.onLine
      }
    });
  }

  // 성능 관련 에러 로깅
  logPerformanceError(metric, value, threshold) {
    this.logError({
      error_type: 'Performance Error',
      error_message: `성능 임계값 초과: ${metric} = ${value}ms (임계값: ${threshold}ms)`,
      component: 'Performance',
      action: metric,
      metadata: {
        metric: metric,
        value: value,
        threshold: threshold
      }
    });
  }
}

// 전역 에러 로거 인스턴스
let errorLogger = null;

export const initErrorLogger = () => {
  if (typeof window !== 'undefined' && !errorLogger) {
    errorLogger = new ErrorLogger();
    
    // 페이지 로드 시 대기 중인 에러 재전송
    window.addEventListener('load', () => {
      errorLogger.retryPendingErrors();
    });
  }
  return errorLogger;
};

export const getErrorLogger = () => {
  return errorLogger || initErrorLogger();
};

// 편의 함수들
export const logError = (errorData) => {
  const logger = getErrorLogger();
  if (logger) {
    logger.logError(errorData);
  }
};

export const logApiError = (url, method, status, response, error) => {
  const logger = getErrorLogger();
  if (logger) {
    logger.logApiError(url, method, status, response, error);
  }
};

export const logNetworkError = (url, method, error) => {
  const logger = getErrorLogger();
  if (logger) {
    logger.logNetworkError(url, method, error);
  }
};

export const logPerformanceError = (metric, value, threshold) => {
  const logger = getErrorLogger();
  if (logger) {
    logger.logPerformanceError(metric, value, threshold);
  }
};
