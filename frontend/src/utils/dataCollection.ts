/**
 * Data Collection Utility
 * Saves user interactions for learning and training purposes
 */

import { api } from './api';

export interface UserInteraction {
  userId?: string;
  sessionId: string;
  action: string;
  timestamp: string;
  data: any;
  metadata?: {
    userAgent: string;
    platform: string;
    screenSize: string;
  };
}

export interface CarAnalysisData {
  userId?: string;
  sessionId: string;
  carDetails: {
    make: string;
    model: string;
    year: string;
    mileage: string;
    price: string;
    condition: string;
    titleStatus: string;
  };
  analysisResult: any;
  imagesCount: number;
  processingTime: number;
  confidenceScore: number;
  timestamp: string;
}

export interface ListingGenerationData {
  userId?: string;
  sessionId: string;
  carAnalysisId: string;
  generatedListing: string;
  platform: string;
  finalPrice: string;
  timestamp: string;
}

class DataCollectionService {
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getMetadata() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenSize: `${window.screen.width}x${window.screen.height}`,
    };
  }

  async trackUserInteraction(action: string, data: any, userId?: string): Promise<void> {
    try {
      const interaction: UserInteraction = {
        userId,
        sessionId: this.sessionId,
        action,
        timestamp: new Date().toISOString(),
        data,
        metadata: this.getMetadata(),
      };

      // Send to backend for storage
      await api.post('/api/v1/analytics/track-interaction', interaction);
      
      console.log('📊 Tracked interaction:', action);
    } catch (error) {
      console.error('Failed to track interaction:', error);
      // Don't throw - data collection shouldn't break the app
    }
  }

  async saveCarAnalysis(
    carDetails: any, 
    analysisResult: any, 
    imagesCount: number,
    processingTime: number,
    confidenceScore: number,
    userId?: string
  ): Promise<string> {
    try {
      const analysisData: CarAnalysisData = {
        userId,
        sessionId: this.sessionId,
        carDetails: {
          make: carDetails.make || '',
          model: carDetails.model || '',
          year: carDetails.year || '',
          mileage: carDetails.mileage || '',
          price: carDetails.price || '',
          condition: carDetails.condition || '',
          titleStatus: carDetails.titleStatus || '',
        },
        analysisResult,
        imagesCount,
        processingTime,
        confidenceScore,
        timestamp: new Date().toISOString(),
      };

      const response = await api.post('/api/v1/analytics/save-car-analysis', analysisData) as any;
      
      console.log('📊 Saved car analysis:', response.analysisId);
      return response.analysisId;
    } catch (error) {
      console.error('Failed to save car analysis:', error);
      return '';
    }
  }

  async saveListingGeneration(
    carAnalysisId: string,
    generatedListing: string,
    platform: string,
    finalPrice: string,
    userId?: string
  ): Promise<void> {
    try {
      const listingData: ListingGenerationData = {
        userId,
        sessionId: this.sessionId,
        carAnalysisId,
        generatedListing,
        platform,
        finalPrice,
        timestamp: new Date().toISOString(),
      };

      await api.post('/api/v1/analytics/save-listing-generation', listingData);
      
      console.log('📊 Saved listing generation');
    } catch (error) {
      console.error('Failed to save listing generation:', error);
    }
  }

  async trackPageView(page: string, userId?: string): Promise<void> {
    await this.trackUserInteraction('page_view', { page }, userId);
  }

  async trackButtonClick(buttonName: string, page: string, userId?: string): Promise<void> {
    await this.trackUserInteraction('button_click', { buttonName, page }, userId);
  }

  async trackFormSubmission(formName: string, formData: any, userId?: string): Promise<void> {
    await this.trackUserInteraction('form_submission', { formName, formData }, userId);
  }

  async trackError(error: string, context: string, userId?: string): Promise<void> {
    await this.trackUserInteraction('error', { error, context }, userId);
  }
}

// Create singleton instance
export const dataCollection = new DataCollectionService();

// React hook for easy usage
export const useDataCollection = () => {
  return {
    trackUserInteraction: dataCollection.trackUserInteraction.bind(dataCollection),
    saveCarAnalysis: dataCollection.saveCarAnalysis.bind(dataCollection),
    saveListingGeneration: dataCollection.saveListingGeneration.bind(dataCollection),
    trackPageView: dataCollection.trackPageView.bind(dataCollection),
    trackButtonClick: dataCollection.trackButtonClick.bind(dataCollection),
    trackFormSubmission: dataCollection.trackFormSubmission.bind(dataCollection),
    trackError: dataCollection.trackError.bind(dataCollection),
  };
};
