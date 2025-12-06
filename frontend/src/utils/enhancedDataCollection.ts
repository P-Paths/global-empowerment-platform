/**
 * Enhanced Data Collection Utility
 * Implements best practices from Google Analytics, Mixpanel, Facebook, Amazon, and Bloomberg
 */

import { api } from './api';

// Data Collection Configuration
const DATA_COLLECTION_CONFIG = {
  // Session management
  sessionTimeoutMinutes: 30,
  maxSessionDurationHours: 24,
  
  // Event batching
  batchSize: 10,
  flushIntervalMs: 30000, // 30 seconds
  
  // Privacy settings
  anonymizeAfterDays: 365,
  retentionDays: 730,
  
  // Feature flags
  enableRealTimeTracking: true,
  enableMarketSignals: true,
  enableConversionFunnel: true,
  enableSearchAnalytics: true,
  enableAITracking: true,
  enableCrossPlatformTracking: true
};

// Event Types (Google Analytics + Mixpanel style)
export enum EventType {
  // Page and navigation
  PAGE_VIEW = 'page_view',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  
  // User interactions
  BUTTON_CLICK = 'button_click',
  FORM_SUBMIT = 'form_submit',
  FORM_FIELD_CHANGE = 'form_field_change',
  SCROLL = 'scroll',
  HOVER = 'hover',
  
  // Listing interactions (Amazon style)
  LISTING_VIEW = 'listing_view',
  LISTING_SAVE = 'listing_save',
  LISTING_SHARE = 'listing_share',
  LISTING_REPORT = 'listing_report',
  
  // Search behavior (Google style)
  SEARCH_PERFORMED = 'search_performed',
  SEARCH_RESULT_CLICK = 'search_result_click',
  FILTER_APPLIED = 'filter_applied',
  SORT_CHANGED = 'sort_changed',
  
  // Transaction events (eBay style)
  OFFER_MADE = 'offer_made',
  OFFER_ACCEPTED = 'offer_accepted',
  OFFER_REJECTED = 'offer_rejected',
  DEAL_COMPLETED = 'deal_completed',
  
  // Escrow events (PayPal style)
  ESCROW_STARTED = 'escrow_started',
  ESCROW_FUNDED = 'escrow_funded',
  ESCROW_COMPLETED = 'escrow_completed',
  ESCROW_FAILED = 'escrow_failed',
  
  // AI interactions (OpenAI style)
  AI_FEATURE_USED = 'ai_feature_used',
  AI_SUGGESTION_ACCEPTED = 'ai_suggestion_accepted',
  AI_SUGGESTION_REJECTED = 'ai_suggestion_rejected',
  AI_CONTENT_GENERATED = 'ai_content_generated',
  
  // Cross-platform posting (Buffer style)
  CROSS_POST_CREATED = 'cross_post_created',
  CROSS_POST_SUCCESS = 'cross_post_success',
  CROSS_POST_FAILED = 'cross_post_failed',
  
  // Conversion funnel (Facebook Ads style)
  FUNNEL_AWARENESS = 'funnel_awareness',
  FUNNEL_CONSIDERATION = 'funnel_consideration',
  FUNNEL_DECISION = 'funnel_decision',
  FUNNEL_PURCHASE = 'funnel_purchase',
  
  // Error tracking
  ERROR_OCCURRED = 'error_occurred',
  PERFORMANCE_ISSUE = 'performance_issue'
}

// Market Signal Types (Bloomberg style)
export enum MarketSignalType {
  PRICE_ELASTICITY = 'price_elasticity',
  DEMAND_VOLUME = 'demand_volume',
  SUPPLY_CONSTRAINTS = 'supply_constraints',
  CONVERSION_RATE = 'conversion_rate',
  ESCROW_SUCCESS_RATE = 'escrow_success_rate',
  CROSS_PLATFORM_PERFORMANCE = 'cross_platform_performance',
  AI_ADOPTION_RATE = 'ai_adoption_rate',
  SEARCH_TREND = 'search_trend',
  REGIONAL_MIGRATION = 'regional_migration',
  CONSUMER_CONFIDENCE = 'consumer_confidence'
}

// Data Structures
export interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  pageViews: number;
  eventsCount: number;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceInfo: DeviceInfo;
  locationInfo: LocationInfo;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenResolution: string;
  connectionType: string;
  deviceCategory: 'mobile' | 'desktop' | 'tablet';
  browserFamily: string;
}

export interface LocationInfo {
  city?: string;
  region?: string;
  country: string;
  timezone: string;
}

export interface EventData {
  eventId: string;
  eventType: EventType;
  sessionId: string;
  userId?: string;
  timestamp: Date;
  properties: Record<string, any>;
  metadata: Record<string, any>;
}

export interface MarketSignal {
  signalId: string;
  signalType: MarketSignalType;
  assetType: string;
  region: string;
  value: number;
  confidence: number;
  timestamp: Date;
  source: string;
}

// Enhanced Data Collection Service
class EnhancedDataCollectionService {
  private session: UserSession | null = null;
  private eventBuffer: EventData[] = [];
  private marketSignals: MarketSignal[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Start session tracking
      await this.startSession();
      
      // Set up automatic flushing
      this.setupAutoFlush();
      
      // Set up session timeout
      this.setupSessionTimeout();
      
      // Track page view
      await this.trackPageView();
      
      this.isInitialized = true;
      console.log('📊 Enhanced Data Collection Service initialized');
    } catch (error) {
      console.error('Failed to initialize data collection service:', error);
    }
  }

  private async startSession(): Promise<void> {
    const sessionId = this.generateSessionId();
    const now = new Date();
    
    this.session = {
      sessionId,
              userId: this.getUserIdFromStorage(),
      startTime: now,
      lastActivity: now,
      pageViews: 0,
      eventsCount: 0,
      referrer: document.referrer,
      utmSource: this.getUrlParameter('utm_source'),
      utmMedium: this.getUrlParameter('utm_medium'),
      utmCampaign: this.getUrlParameter('utm_campaign'),
      deviceInfo: this.getDeviceInfo(),
      locationInfo: await this.getLocationInfo()
    };

    // Track session start
    await this.trackEvent(EventType.SESSION_START, {
      referrer: this.session.referrer,
      utm_source: this.session.utmSource,
      utm_medium: this.session.utmMedium,
      utm_campaign: this.session.utmCampaign
    });

    console.log('📊 Session started:', sessionId);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserIdFromStorage(): string | undefined {
    // Get user ID from authentication context
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).id : undefined;
  }

  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const screen = window.screen;
    
    return {
      userAgent,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      connectionType: this.getConnectionType(),
      deviceCategory: this.getDeviceCategory(),
      browserFamily: this.getBrowserFamily()
    };
  }

  private getConnectionType(): string {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || connection.type || 'unknown';
    }
    return 'unknown';
  }

  private getDeviceCategory(): 'mobile' | 'desktop' | 'tablet' {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
      return /tablet|ipad/i.test(userAgent) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  }

  private getBrowserFamily(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return 'chrome';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('safari')) return 'safari';
    if (userAgent.includes('edge')) return 'edge';
    return 'unknown';
  }

  private async getLocationInfo(): Promise<LocationInfo> {
    // In a real implementation, you'd get this from IP geolocation
    // For now, return default values
    return {
      country: 'US',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private getUrlParameter(name: string): string | undefined {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name) || undefined;
  }

  private setupAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, DATA_COLLECTION_CONFIG.flushIntervalMs);
  }

  private setupSessionTimeout(): void {
    setInterval(() => {
      if (this.session) {
        const now = new Date();
        const timeSinceLastActivity = now.getTime() - this.session.lastActivity.getTime();
        const timeoutMs = DATA_COLLECTION_CONFIG.sessionTimeoutMinutes * 60 * 1000;
        
        if (timeSinceLastActivity > timeoutMs) {
          this.endSession();
        }
      }
    }, 60000); // Check every minute
  }

  private async endSession(): Promise<void> {
    if (!this.session) return;

    await this.trackEvent(EventType.SESSION_END, {
      session_duration_minutes: this.getSessionDurationMinutes(),
      total_page_views: this.session.pageViews,
      total_events: this.session.eventsCount
    });

    console.log('📊 Session ended:', this.session.sessionId);
    this.session = null;
  }

  private getSessionDurationMinutes(): number {
    if (!this.session) return 0;
    const durationMs = new Date().getTime() - this.session.startTime.getTime();
    return Math.round(durationMs / (1000 * 60));
  }

  // Public API Methods

  async trackEvent(
    eventType: EventType,
    properties: Record<string, any> = {},
    metadata: Record<string, any> = {}
  ): Promise<string> {
    if (!this.session) {
      await this.initializeService();
    }

    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const eventData: EventData = {
      eventId,
      eventType,
      sessionId: this.session!.sessionId,
      userId: this.session!.userId,
      timestamp: now,
      properties: {
        ...properties,
        page: window.location.pathname,
        url: window.location.href,
        title: document.title
      },
      metadata: {
        ...metadata,
        device_info: this.session!.deviceInfo,
        location_info: this.session!.locationInfo
      }
    };

    // Update session
    this.session!.lastActivity = now;
    this.session!.eventsCount++;
    if (eventType === EventType.PAGE_VIEW) {
      this.session!.pageViews++;
    }

    // Add to buffer
    this.eventBuffer.push(eventData);

    // Flush if buffer is full
    if (this.eventBuffer.length >= DATA_COLLECTION_CONFIG.batchSize) {
      await this.flushEvents();
    }

    return eventId;
  }

  async trackPageView(): Promise<string> {
    return this.trackEvent(EventType.PAGE_VIEW, {
      page_title: document.title,
      page_url: window.location.href,
      referrer: document.referrer
    });
  }

  async trackButtonClick(
    buttonId: string,
    buttonText: string,
    page: string
  ): Promise<string> {
    return this.trackEvent(EventType.BUTTON_CLICK, {
      button_id: buttonId,
      button_text: buttonText,
      page
    });
  }

  async trackListingView(
    listingId: string,
    assetType: string,
    price: number,
    region: string,
    source: string = 'organic'
  ): Promise<string> {
    const eventId = await this.trackEvent(EventType.LISTING_VIEW, {
      listing_id: listingId,
      asset_type: assetType,
      price,
      region,
      source
    });

    // Generate market signal
    await this.generateMarketSignal(
      MarketSignalType.DEMAND_VOLUME,
      assetType,
      region,
      1,
      'user_view'
    );

    return eventId;
  }

  async trackOfferMade(
    listingId: string,
    offerAmount: number,
    listPrice: number,
    assetType: string,
    region: string
  ): Promise<string> {
    const offerRatio = offerAmount / listPrice;
    
    const eventId = await this.trackEvent(EventType.OFFER_MADE, {
      listing_id: listingId,
      offer_amount: offerAmount,
      list_price: listPrice,
      offer_ratio: offerRatio,
      asset_type: assetType,
      region
    });

    // Generate market signals
    await this.generateMarketSignal(
      MarketSignalType.PRICE_ELASTICITY,
      assetType,
      region,
      offerRatio,
      'user_offer'
    );

    await this.generateMarketSignal(
      MarketSignalType.CONSUMER_CONFIDENCE,
      assetType,
      region,
      offerRatio,
      'offer_analysis'
    );

    return eventId;
  }

  async trackEscrowEvent(
    listingId: string,
    escrowStatus: string,
    amount: number,
    assetType: string,
    region: string,
    failureReason?: string
  ): Promise<string> {
    const eventType = escrowStatus === 'completed' 
      ? EventType.ESCROW_COMPLETED 
      : escrowStatus === 'failed' 
        ? EventType.ESCROW_FAILED 
        : EventType.ESCROW_STARTED;

    const eventId = await this.trackEvent(eventType, {
      listing_id: listingId,
      escrow_status: escrowStatus,
      amount,
      asset_type: assetType,
      region,
      failure_reason: failureReason
    });

    // Generate market signal
    if (escrowStatus === 'completed') {
      await this.generateMarketSignal(
        MarketSignalType.ESCROW_SUCCESS_RATE,
        assetType,
        region,
        1,
        'escrow_completion'
      );
    } else if (escrowStatus === 'failed') {
      await this.generateMarketSignal(
        MarketSignalType.ESCROW_SUCCESS_RATE,
        assetType,
        region,
        0,
        'escrow_failure'
      );
    }

    return eventId;
  }

  async trackAIInteraction(
    aiFeature: string,
    userAction: 'accepted' | 'rejected' | 'modified',
    inputData: Record<string, any>,
    outputData: Record<string, any>,
    processingTimeMs: number
  ): Promise<string> {
    const eventType = userAction === 'accepted' 
      ? EventType.AI_SUGGESTION_ACCEPTED 
      : userAction === 'rejected' 
        ? EventType.AI_SUGGESTION_REJECTED 
        : EventType.AI_FEATURE_USED;

    const eventId = await this.trackEvent(eventType, {
      ai_feature: aiFeature,
      user_action: userAction,
      input_data: inputData,
      output_data: outputData,
      processing_time_ms: processingTimeMs,
      success: userAction === 'accepted' || userAction === 'modified'
    });

    // Generate market signal
    await this.generateMarketSignal(
      MarketSignalType.AI_ADOPTION_RATE,
      'ai_features',
      'global',
      userAction === 'accepted' ? 1 : 0,
      'ai_interaction'
    );

    return eventId;
  }

  async trackSearchBehavior(
    searchQuery: string,
    filters: Record<string, any>,
    resultsCount: number,
    clickedResults: string[]
  ): Promise<string> {
    const eventId = await this.trackEvent(EventType.SEARCH_PERFORMED, {
      search_query: searchQuery,
      filters,
      results_count: resultsCount,
      clicked_results: clickedResults,
      query_length: searchQuery.length,
      filter_count: Object.keys(filters).length
    });

    // Generate market signal
    await this.generateMarketSignal(
      MarketSignalType.SEARCH_TREND,
      'search_analytics',
      'global',
      1,
      'user_search'
    );

    return eventId;
  }

  async trackConversionFunnel(
    funnelStage: 'awareness' | 'consideration' | 'decision' | 'purchase',
    assetType: string,
    region: string
  ): Promise<string> {
    const eventType = {
      awareness: EventType.FUNNEL_AWARENESS,
      consideration: EventType.FUNNEL_CONSIDERATION,
      decision: EventType.FUNNEL_DECISION,
      purchase: EventType.FUNNEL_PURCHASE
    }[funnelStage];

    const eventId = await this.trackEvent(eventType, {
      funnel_stage: funnelStage,
      asset_type: assetType,
      region
    });

    // Generate market signal
    await this.generateMarketSignal(
      MarketSignalType.CONVERSION_RATE,
      assetType,
      region,
      1,
      'conversion_funnel'
    );

    return eventId;
  }

  private async generateMarketSignal(
    signalType: MarketSignalType,
    assetType: string,
    region: string,
    value: number,
    source: string,
    confidence: number = 0.8
  ): Promise<void> {
    if (!DATA_COLLECTION_CONFIG.enableMarketSignals) return;

    const signal: MarketSignal = {
      signalId: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      signalType,
      assetType,
      region,
      value,
      confidence,
      timestamp: new Date(),
      source
    };

    this.marketSignals.push(signal);

    // Flush market signals if we have enough
    if (this.marketSignals.length >= DATA_COLLECTION_CONFIG.batchSize) {
      await this.flushMarketSignals();
    }
  }

  private async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const eventsToFlush = this.eventBuffer.splice(0);
    
    try {
      // Send events to backend
      await api.post('/api/v1/data-collection/event/track', {
        events: eventsToFlush
      });

      console.log(`📊 Flushed ${eventsToFlush.length} events to backend`);
    } catch (error) {
      console.error('Failed to flush events:', error);
      // Put events back in buffer for retry
      this.eventBuffer.unshift(...eventsToFlush);
    }
  }

  private async flushMarketSignals(): Promise<void> {
    if (this.marketSignals.length === 0) return;

    const signalsToFlush = this.marketSignals.splice(0);
    
    try {
      // Send market signals to backend
      await api.post('/api/v1/data-collection/market/signals', {
        signals: signalsToFlush
      });

      console.log(`📊 Flushed ${signalsToFlush.length} market signals to backend`);
    } catch (error) {
      console.error('Failed to flush market signals:', error);
      // Put signals back in buffer for retry
      this.marketSignals.unshift(...signalsToFlush);
    }
  }

  // Utility methods
  getSessionId(): string | null {
    return this.session?.sessionId || null;
  }

  getUserId(): string | undefined {
    return this.session?.userId;
  }

  isTrackingEnabled(): boolean {
    return this.isInitialized && this.session !== null;
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushEvents();
    this.flushMarketSignals();
    this.endSession();
  }
}

// Global instance
export const enhancedDataCollection = new EnhancedDataCollectionService();

// React hook for easy usage
export const useEnhancedDataCollection = () => {
  return {
    trackEvent: enhancedDataCollection.trackEvent.bind(enhancedDataCollection),
    trackPageView: enhancedDataCollection.trackPageView.bind(enhancedDataCollection),
    trackButtonClick: enhancedDataCollection.trackButtonClick.bind(enhancedDataCollection),
    trackListingView: enhancedDataCollection.trackListingView.bind(enhancedDataCollection),
    trackOfferMade: enhancedDataCollection.trackOfferMade.bind(enhancedDataCollection),
    trackEscrowEvent: enhancedDataCollection.trackEscrowEvent.bind(enhancedDataCollection),
    trackAIInteraction: enhancedDataCollection.trackAIInteraction.bind(enhancedDataCollection),
    trackSearchBehavior: enhancedDataCollection.trackSearchBehavior.bind(enhancedDataCollection),
    trackConversionFunnel: enhancedDataCollection.trackConversionFunnel.bind(enhancedDataCollection),
    getSessionId: enhancedDataCollection.getSessionId.bind(enhancedDataCollection),
    getUserId: enhancedDataCollection.getUserId.bind(enhancedDataCollection),
    isTrackingEnabled: enhancedDataCollection.isTrackingEnabled.bind(enhancedDataCollection)
  };
};

// Auto-initialize on page load
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    enhancedDataCollection.destroy();
  });
}
