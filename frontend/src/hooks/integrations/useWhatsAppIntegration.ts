import { useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  status: 'approved' | 'pending' | 'rejected';
  components: {
    type: 'header' | 'body' | 'footer';
    text?: string;
    parameters?: string[];
  }[];
}

interface SendWhatsAppData {
  to: string;
  templateName: string;
  parameters: Record<string, string>;
}

interface BookingNotificationData {
  contactPhone: string;
  bookingId: string;
  spaceName: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  notificationType: 'confirmation' | 'reminder' | 'cancellation' | 'update';
}

const fetchWhatsAppTemplates = async (): Promise<WhatsAppTemplate[]> => {
  const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api';
  const response = await fetch(`${apiUrl}/whatsapp/templates`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('cosynq_token')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch WhatsApp templates: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data?.templates || [];
};

const sendWhatsAppMessage = async (messageData: SendWhatsAppData): Promise<void> => {
  const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api';
  const response = await fetch(`${apiUrl}/whatsapp/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('cosynq_token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(messageData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to send WhatsApp message');
  }
};

export function useWhatsAppIntegration(enabled: boolean = false) {
  
  const {
    data: templates = [],
    isLoading: templatesLoading,
    isError: templatesError,
    error: templatesErrorMessage
  } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: fetchWhatsAppTemplates,
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1
  });

  const sendMessageMutation = useMutation({
    mutationFn: sendWhatsAppMessage,
    retry: 1
  });

  const getTemplateByType = useCallback((type: BookingNotificationData['notificationType']) => {
    const templateMap = {
      confirmation: 'booking_confirmation',
      reminder: 'booking_reminder', 
      cancellation: 'booking_cancellation',
      update: 'booking_update'
    };
    
    return templates.find(template => 
      template.name === templateMap[type] && template.status === 'approved'
    );
  }, [templates]);

  const sendBookingNotification = useCallback(async (data: BookingNotificationData) => {
    if (!enabled) {
      console.log('WhatsApp integration disabled');
      return;
    }

    const template = getTemplateByType(data.notificationType);
    if (!template) {
      console.warn(`No approved WhatsApp template found for ${data.notificationType}`);
      return;
    }

    const messageData: SendWhatsAppData = {
      to: data.contactPhone,
      templateName: template.name,
      parameters: {
        customer_name: data.customerName,
        space_name: data.spaceName,
        booking_date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        booking_id: data.bookingId
      }
    };

    await sendMessageMutation.mutateAsync(messageData);
  }, [enabled, getTemplateByType, sendMessageMutation]);

  const canSendNotification = useCallback((type: BookingNotificationData['notificationType']) => {
    if (!enabled) return false;
    return !!getTemplateByType(type);
  }, [enabled, getTemplateByType]);

  const validatePhoneNumber = useCallback((phone: string): boolean => {
    // Basic phone number validation - should start with + and have at least 10 digits
    const phoneRegex = /^\+\d{10,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }, []);

  const formatPhoneNumber = useCallback((phone: string): string => {
    // Remove spaces and ensure it starts with +
    let formatted = phone.replace(/\s/g, '');
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }
    return formatted;
  }, []);

  const getAvailableNotificationTypes = useCallback((): BookingNotificationData['notificationType'][] => {
    if (!enabled) return [];
    
    const types: BookingNotificationData['notificationType'][] = [];
    
    if (canSendNotification('confirmation')) types.push('confirmation');
    if (canSendNotification('reminder')) types.push('reminder');
    if (canSendNotification('cancellation')) types.push('cancellation');
    if (canSendNotification('update')) types.push('update');
    
    return types;
  }, [enabled, canSendNotification]);

  return {
    isEnabled: enabled,
    templates,
    templatesLoading,
    templatesError,
    templatesErrorMessage,
    sendBookingNotification,
    canSendNotification,
    validatePhoneNumber,
    formatPhoneNumber,
    getAvailableNotificationTypes,
    isSending: sendMessageMutation.isPending,
    sendError: sendMessageMutation.error,
    lastSentSuccess: sendMessageMutation.isSuccess
  };
}