/**
 * Performance Monitoring Utility
 * 
 * Tracks application performance, user interactions, and system health
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface UserInteraction {
  type: string;
  target: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface ErrorReport {
  message: string;
  stack?: string;
  component?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface PerformanceConfig {
  enableMetrics: boolean;
  enableInteractionTracking: boolean;
  enableErrorTracking: boolean;
  sampleRate: number;
  apiEndpoint?: string;
  batchSize: number;
  batchInterval: number;
}

class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: PerformanceMetric[] = [];
  private interactions: UserInteraction[] = [];
  private errors: ErrorReport[] = [];
  private observer?: PerformanceObserver;
  private batchTimer?: NodeJS.Timeout;
  private startTime: number;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableMetrics: true,
      enableInteractionTracking: true,
      enableErrorTracking: true,
      sampleRate: 1.0,
      batchSize: 50,
      batchInterval: 30000, // 30 seconds
      ...config
    };

    this.startTime = performance.now();
    this.init();
  }

  private init() {
    if (this.config.enableMetrics) {
      this.setupPerformanceObserver();
      this.trackNavigationMetrics();
      this.trackResourceMetrics();
    }

    if (this.config.enableInteractionTracking) {
      this.setupInteractionTracking();
    }

    if (this.config.enableErrorTracking) {
      this.setupErrorTracking();
    }

    // Start batch reporting
    this.startBatchReporting();

    // Track page visibility changes
    this.setupVisibilityTracking();
  }

  private setupPerformanceObserver() {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      // Observe navigation timing
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: `${entry.entryType}.${entry.name}`,
            value: entry.duration || entry.responseEnd || 0,
            timestamp: Date.now(),
            metadata: {
              entryType: entry.entryType,
              startTime: entry.startTime,
              ...this.getEntryMetadata(entry)
            }
          });
        }
      });

      // Observe different types of performance entries
      const entryTypes = ['navigation', 'resource', 'measure', 'paint'];
      
      entryTypes.forEach(type => {
        try {
          this.observer!.observe({ entryTypes: [type] });
        } catch (error) {
          console.warn(`Failed to observe ${type} entries:`, error);
        }
      });

    } catch (error) {
      console.warn('Failed to setup PerformanceObserver:', error);
    }
  }

  private getEntryMetadata(entry: PerformanceEntry): Record<string, any> {
    const metadata: Record<string, any> = {};

    if ('transferSize' in entry) {
      metadata.transferSize = (entry as PerformanceResourceTiming).transferSize;
      metadata.encodedBodySize = (entry as PerformanceResourceTiming).encodedBodySize;
      metadata.decodedBodySize = (entry as PerformanceResourceTiming).decodedBodySize;
    }

    if ('responseEnd' in entry) {
      metadata.responseEnd = (entry as PerformanceResourceTiming).responseEnd;
      metadata.responseStart = (entry as PerformanceResourceTiming).responseStart;
    }

    return metadata;
  }

  private trackNavigationMetrics() {
    if (!('navigation' in performance)) return;

    const navigation = performance.navigation;
    const timing = performance.timing;

    // Calculate key navigation metrics
    const metrics = {
      'navigation.dns_lookup': timing.domainLookupEnd - timing.domainLookupStart,
      'navigation.tcp_connect': timing.connectEnd - timing.connectStart,
      'navigation.server_response': timing.responseEnd - timing.requestStart,
      'navigation.dom_parse': timing.domContentLoadedEventEnd - timing.responseEnd,
      'navigation.total_load': timing.loadEventEnd - timing.navigationStart,
      'navigation.first_byte': timing.responseStart - timing.requestStart,
      'navigation.dom_ready': timing.domContentLoadedEventEnd - timing.navigationStart
    };

    Object.entries(metrics).forEach(([name, value]) => {
      if (value > 0) {
        this.recordMetric({
          name,
          value,
          timestamp: Date.now(),
          metadata: {
            navigationType: navigation.type,
            redirectCount: navigation.redirectCount
          }
        });
      }
    });
  }

  private trackResourceMetrics() {
    if (!('getEntriesByType' in performance)) return;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    resources.forEach(resource => {
      this.recordMetric({
        name: `resource.${this.getResourceType(resource.name)}`,
        value: resource.duration,
        timestamp: Date.now(),
        metadata: {
          name: resource.name,
          transferSize: resource.transferSize,
          encodedBodySize: resource.encodedBodySize,
          decodedBodySize: resource.decodedBodySize
        }
      });
    });
  }

  private getResourceType(url: string): string {
    if (url.includes('/api/')) return 'api';
    if (url.match(/\.(js|mjs)$/)) return 'script';
    if (url.match(/\.(css)$/)) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    return 'other';
  }

  private setupInteractionTracking() {
    const eventTypes = ['click', 'scroll', 'keydown', 'touchstart'];
    
    eventTypes.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        if (Math.random() > this.config.sampleRate) return;

        const target = event.target as HTMLElement;
        const interaction: UserInteraction = {
          type: eventType,
          target: this.getElementSelector(target),
          timestamp: Date.now(),
          metadata: {
            tagName: target.tagName,
            className: target.className,
            id: target.id
          }
        };

        if (eventType === 'click') {
          interaction.metadata!.coordinates = {
            x: (event as MouseEvent).clientX,
            y: (event as MouseEvent).clientY
          };
        }

        this.recordInteraction(interaction);
      }, { passive: true });
    });

    // Track page scroll performance
    let scrollTimer: NodeJS.Timeout;
    let scrollStart = 0;

    document.addEventListener('scroll', () => {
      if (scrollStart === 0) {
        scrollStart = performance.now();
      }

      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const scrollDuration = performance.now() - scrollStart;
        this.recordMetric({
          name: 'interaction.scroll_duration',
          value: scrollDuration,
          timestamp: Date.now(),
          metadata: {
            scrollTop: window.scrollY,
            scrollHeight: document.documentElement.scrollHeight
          }
        });
        scrollStart = 0;
      }, 100);
    }, { passive: true });
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private setupErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.recordError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'javascript'
        }
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        metadata: {
          type: 'promise_rejection',
          reason: event.reason
        }
      });
    });

    // Resource loading errors
    document.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        this.recordError({
          message: `Resource loading error: ${target.tagName}`,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          metadata: {
            type: 'resource',
            tagName: target.tagName,
            src: (target as any).src || (target as any).href
          }
        });
      }
    }, true);
  }

  private setupVisibilityTracking() {
    let visibilityStart = Date.now();
    let totalVisibleTime = 0;

    const handleVisibilityChange = () => {
      const now = Date.now();
      
      if (document.hidden) {
        totalVisibleTime += now - visibilityStart;
        this.recordMetric({
          name: 'page.visible_time',
          value: totalVisibleTime,
          timestamp: now,
          metadata: {
            action: 'hidden'
          }
        });
      } else {
        visibilityStart = now;
        this.recordMetric({
          name: 'page.visibility_change',
          value: 0,
          timestamp: now,
          metadata: {
            action: 'visible'
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track session duration on beforeunload
    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - this.startTime;
      this.recordMetric({
        name: 'session.duration',
        value: sessionDuration,
        timestamp: Date.now(),
        metadata: {
          totalVisibleTime: totalVisibleTime + (document.hidden ? 0 : Date.now() - visibilityStart)
        }
      });
      
      // Send remaining data immediately
      this.sendBatch(true);
    });
  }

  private startBatchReporting() {
    this.batchTimer = setInterval(() => {
      this.sendBatch();
    }, this.config.batchInterval);
  }

  public recordMetric(metric: PerformanceMetric) {
    if (!this.config.enableMetrics) return;
    
    this.metrics.push(metric);
    
    if (this.metrics.length >= this.config.batchSize) {
      this.sendBatch();
    }
  }

  public recordInteraction(interaction: UserInteraction) {
    if (!this.config.enableInteractionTracking) return;
    
    this.interactions.push(interaction);
    
    if (this.interactions.length >= this.config.batchSize) {
      this.sendBatch();
    }
  }

  public recordError(error: ErrorReport) {
    if (!this.config.enableErrorTracking) return;
    
    this.errors.push(error);
    
    // Send errors immediately for high priority
    this.sendBatch();
  }

  public recordCustomMetric(name: string, value: number, metadata?: Record<string, any>) {
    this.recordMetric({
      name: `custom.${name}`,
      value,
      timestamp: Date.now(),
      metadata
    });
  }

  public startTiming(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name: `timing.${name}`,
        value: duration,
        timestamp: Date.now()
      });
    };
  }

  private async sendBatch(immediate = false) {
    if (!this.config.apiEndpoint) {
      // Log to console if no endpoint configured
      if (this.metrics.length > 0 || this.interactions.length > 0 || this.errors.length > 0) {
        console.group('🔍 Performance Monitor Batch');
        
        if (this.metrics.length > 0) {
          console.log('📊 Metrics:', this.metrics);
        }
        
        if (this.interactions.length > 0) {
          console.log('👆 Interactions:', this.interactions);
        }
        
        if (this.errors.length > 0) {
          console.error('❌ Errors:', this.errors);
        }
        
        console.groupEnd();
      }
      
      this.clearBatch();
      return;
    }

    const batch = {
      metrics: [...this.metrics],
      interactions: [...this.interactions],
      errors: [...this.errors],
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.getSessionId()
    };

    if (batch.metrics.length === 0 && batch.interactions.length === 0 && batch.errors.length === 0) {
      return;
    }

    this.clearBatch();

    try {
      const method = immediate ? 'sendBeacon' : 'fetch';
      
      if (method === 'sendBeacon' && 'sendBeacon' in navigator) {
        navigator.sendBeacon(
          this.config.apiEndpoint,
          JSON.stringify(batch)
        );
      } else {
        await fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(batch),
          keepalive: immediate
        });
      }
    } catch (error) {
      console.error('Failed to send performance batch:', error);
    }
  }

  private clearBatch() {
    this.metrics = [];
    this.interactions = [];
    this.errors = [];
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('performance_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('performance_session_id', sessionId);
    }
    return sessionId;
  }

  public getPerformanceReport(): {
    metrics: PerformanceMetric[];
    interactions: UserInteraction[];
    errors: ErrorReport[];
    summary: Record<string, any>;
  } {
    const summary = {
      totalMetrics: this.metrics.length,
      totalInteractions: this.interactions.length,
      totalErrors: this.errors.length,
      sessionDuration: Date.now() - this.startTime,
      avgMetricValue: this.metrics.length > 0 
        ? this.metrics.reduce((sum, m) => sum + m.value, 0) / this.metrics.length 
        : 0
    };

    return {
      metrics: [...this.metrics],
      interactions: [...this.interactions],
      errors: [...this.errors],
      summary
    };
  }

  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    
    // Send final batch
    this.sendBatch(true);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor({
  enableMetrics: true,
  enableInteractionTracking: process.env.NODE_ENV === 'production',
  enableErrorTracking: true,
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  apiEndpoint: process.env.NODE_ENV === 'production' 
    ? '/api/v1/analytics/performance' 
    : undefined
});

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const startTiming = (name: string) => performanceMonitor.startTiming(name);
  
  const recordMetric = (name: string, value: number, metadata?: Record<string, any>) => {
    performanceMonitor.recordCustomMetric(name, value, metadata);
  };

  const recordError = (error: Error, component?: string, metadata?: Record<string, any>) => {
    performanceMonitor.recordError({
      message: error.message,
      stack: error.stack,
      component,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      metadata
    });
  };

  return {
    startTiming,
    recordMetric,
    recordError,
    getReport: () => performanceMonitor.getPerformanceReport()
  };
}

export default PerformanceMonitor;