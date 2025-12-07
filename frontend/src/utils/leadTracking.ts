/**
 * Lead Tracking Utility
 * Simple one-pipe system for capturing and tracking leads
 */

interface LeadData {
  name?: string;
  email: string;
  phone?: string;
  source: string;
  utm?: {
    campaign?: string;
    source?: string;
    medium?: string;
    content?: string;
    term?: string;
  };
  notes?: string;
  demo_engagement?: {
    completed: boolean;
    replayed: boolean;
    paused_at_key_moments: boolean;
    duration_watched: number;
    timestamp_paused: number[];
  };
  survey_responses?: {
    challenge?: string;
    volume?: string;
    timeline?: string;
    process?: string;
    frustration?: string;
  };
}

interface LeadResponse {
  success: boolean;
  leadId?: string;
  score?: number;
  status?: string;
  message?: string;
  error?: string;
}

class LeadTrackingService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = '/api/leads';
  }

  /**
   * Capture a lead and store in Supabase
   */
  async captureLead(leadData: LeadData): Promise<LeadResponse> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      const result = await response.json();

      if (result.success) {
        // Fire GA4 event
        this.trackGA4Event('lead_captured', {
          lead_id: result.leadId,
          lead_score: result.score,
          lead_status: result.status,
          lead_source: leadData.source,
          email_domain: leadData.email.split('@')[1],
        });

        // Fire custom event for other tracking
        this.fireCustomEvent('lead_captured', {
          leadId: result.leadId,
          score: result.score,
          status: result.status,
          source: leadData.source,
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to capture lead:', error);
      return {
        success: false,
        error: 'Failed to capture lead'
      };
    }
  }

  /**
   * Track demo engagement
   */
  async trackDemoEngagement(engagement: LeadData['demo_engagement']) {
    // Store in localStorage for now, will be sent with lead capture
    localStorage.setItem('demo_engagement', JSON.stringify(engagement));
    
    // Fire GA4 event
    this.trackGA4Event('demo_engagement', {
      completed: engagement?.completed,
      replayed: engagement?.replayed,
      duration_watched: engagement?.duration_watched,
    });
  }

  /**
   * Track survey responses
   */
  async trackSurveyResponses(responses: LeadData['survey_responses']) {
    // Store in localStorage for now, will be sent with lead capture
    localStorage.setItem('survey_responses', JSON.stringify(responses));
    
    // Fire GA4 event
    this.trackGA4Event('survey_completed', {
      challenge: responses?.challenge,
      volume: responses?.volume,
      timeline: responses?.timeline,
    });
  }

  /**
   * Open Calendly for meeting booking
   */
  openCalendly(leadData: LeadData, meetingType: 'discovery' | 'demo' = 'discovery') {
    const calendlyUrl = `https://calendly.com/accorria/${meetingType}?name=${encodeURIComponent(leadData.name || '')}&email=${encodeURIComponent(leadData.email)}`;
    
    // Track meeting booking attempt
    this.trackGA4Event('meeting_booking_started', {
      meeting_type: meetingType,
      lead_source: leadData.source,
    });

    window.open(calendlyUrl, '_blank');
  }

  /**
   * Send follow-up email via SendGrid
   */
  async sendFollowUpEmail(leadData: LeadData, template: string = 'demo_followup') {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: leadData.email,
          template: template,
          data: leadData,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        this.trackGA4Event('followup_email_sent', {
          template: template,
          lead_source: leadData.source,
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to send follow-up email:', error);
      return { success: false, error: 'Failed to send email' };
    }
  }

  /**
   * Track GA4 events
   */
  private trackGA4Event(eventName: string, parameters: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, parameters);
    }
  }

  /**
   * Fire custom events for other tracking systems
   */
  private fireCustomEvent(eventName: string, data: Record<string, any>) {
    // Dispatch custom event for other tracking systems
    window.dispatchEvent(new CustomEvent('accorria_lead_event', {
      detail: { eventName, data }
    }));
  }

  /**
   * Get UTM parameters from URL
   */
  getUTMParameters(): LeadData['utm'] {
    if (typeof window === 'undefined') return {};

    const urlParams = new URLSearchParams(window.location.search);
    return {
      campaign: urlParams.get('utm_campaign') || undefined,
      source: urlParams.get('utm_source') || undefined,
      medium: urlParams.get('utm_medium') || undefined,
      content: urlParams.get('utm_content') || undefined,
      term: urlParams.get('utm_term') || undefined,
    };
  }

  /**
   * Complete lead capture flow
   */
  async completeLeadFlow(leadData: LeadData, options: {
    openCalendly?: boolean;
    sendEmail?: boolean;
    meetingType?: 'discovery' | 'demo';
  } = {}) {
    // Capture lead
    const result = await this.captureLead(leadData);

    if (result.success) {
      // Open Calendly if requested
      if (options.openCalendly) {
        this.openCalendly(leadData, options.meetingType);
      }

      // Send follow-up email if requested
      if (options.sendEmail) {
        await this.sendFollowUpEmail(leadData);
      }
    }

    return result;
  }
}

// Export singleton instance
export const leadTracking = new LeadTrackingService();

// Export types
export type { LeadData, LeadResponse };
