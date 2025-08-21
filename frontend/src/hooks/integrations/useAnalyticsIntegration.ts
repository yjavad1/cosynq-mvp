import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';

interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp?: string;
  sessionId?: string;
}

interface BookingAnalyticsData {
  action: 'create' | 'update' | 'delete' | 'view';
  bookingId?: string;
  spaceId?: string;
  locationId?: string;
  duration?: number;
  attendeeCount?: number;
  bookingSource?: 'web' | 'whatsapp' | 'api';
  userType?: 'existing_contact' | 'new_customer';
}

const sendAnalyticsEvent = async (event: AnalyticsEvent): Promise<void> => {
  try {
    const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api';
    
    await fetch(`${apiUrl}/analytics/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('cosynq_token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...event,
        timestamp: event.timestamp || new Date().toISOString(),
        sessionId: event.sessionId || generateSessionId()
      })
    });
  } catch (error) {
    console.error('Analytics event failed:', error);
  }
};

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export function useAnalyticsIntegration(enabled: boolean = false) {
  
  const eventMutation = useMutation({
    mutationFn: sendAnalyticsEvent,
    retry: false // Don't retry analytics events
  });

  const trackBookingEvent = useCallback((
    action: BookingAnalyticsData['action'], 
    data: Omit<BookingAnalyticsData, 'action'>
  ) => {
    if (!enabled) return;
    
    const event: AnalyticsEvent = {
      event: `booking_${action}`,
      properties: {
        ...data,
        page: 'booking_management',
        feature: 'core_booking'
      }
    };

    eventMutation.mutate(event);
  }, [enabled, eventMutation]);

  const trackPageView = useCallback((page: string, properties?: Record<string, any>) => {
    if (!enabled) return;
    
    const event: AnalyticsEvent = {
      event: 'page_view',
      properties: {
        page,
        ...properties
      }
    };

    eventMutation.mutate(event);
  }, [enabled, eventMutation]);

  const trackUserInteraction = useCallback((
    interaction: string, 
    component: string, 
    properties?: Record<string, any>
  ) => {
    if (!enabled) return;
    
    const event: AnalyticsEvent = {
      event: 'user_interaction',
      properties: {
        interaction,
        component,
        ...properties
      }
    };

    eventMutation.mutate(event);
  }, [enabled, eventMutation]);

  const trackTimeSlotSelection = useCallback((data: {
    spaceId: string;
    date: string;
    startTime: string;
    endTime: string;
    selectionMethod: 'manual' | 'suggestion' | 'quick_select';
  }) => {
    if (!enabled) return;
    
    trackUserInteraction('time_slot_selected', 'time_slot_picker', data);
  }, [enabled, trackUserInteraction]);

  const trackFormValidation = useCallback((data: {
    formType: string;
    validationErrors: string[];
    fieldsFilled: string[];
  }) => {
    if (!enabled) return;
    
    trackUserInteraction('form_validation', 'booking_form', data);
  }, [enabled, trackUserInteraction]);

  const trackSearchUsage = useCallback((data: {
    searchType: 'contact' | 'space' | 'booking';
    query: string;
    resultsCount: number;
  }) => {
    if (!enabled) return;
    
    trackUserInteraction('search_performed', 'search_component', {
      ...data,
      queryLength: data.query.length
    });
  }, [enabled, trackUserInteraction]);

  return {
    isEnabled: enabled,
    trackBookingEvent,
    trackPageView,
    trackUserInteraction,
    trackTimeSlotSelection,
    trackFormValidation,
    trackSearchUsage,
    isTracking: eventMutation.isPending
  };
}