export { useAIIntegration } from './useAIIntegration';
export { useAnalyticsIntegration } from './useAnalyticsIntegration';
export { useWhatsAppIntegration } from './useWhatsAppIntegration';

export interface IntegrationConfig {
  ai: {
    enabled: boolean;
    showRecommendations: boolean;
    autoSuggestSpaces: boolean;
  };
  analytics: {
    enabled: boolean;
    trackPageViews: boolean;
    trackUserInteractions: boolean;
    trackBookingEvents: boolean;
  };
  whatsapp: {
    enabled: boolean;
    sendConfirmations: boolean;
    sendReminders: boolean;
    autoSendOnCreate: boolean;
  };
}

export const defaultIntegrationConfig: IntegrationConfig = {
  ai: {
    enabled: false,
    showRecommendations: true,
    autoSuggestSpaces: false
  },
  analytics: {
    enabled: false,
    trackPageViews: true,
    trackUserInteractions: true,
    trackBookingEvents: true
  },
  whatsapp: {
    enabled: false,
    sendConfirmations: true,
    sendReminders: false,
    autoSendOnCreate: false
  }
};