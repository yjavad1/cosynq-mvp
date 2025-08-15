import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';

export interface TimeSlot {
  startTime: string; // ISO string
  endTime: string;   // ISO string
  duration: number;  // in minutes
  isAvailable: boolean;
  validationErrors?: string[];
  validationWarnings?: string[];
  timeUntilBooking?: {
    minutes: number;
    hours: number;
    days: number;
  };
}

export interface TimeSlotAvailability {
  date: string;
  timezone: string;
  currentTime: string;
  isToday: boolean;
  allowSameDayBooking: boolean;
  minimumAdvanceMinutes: number;
  onlyFutureSlots: boolean;
  availableSlots: TimeSlot[];
  unavailableSlots: TimeSlot[];
  summary: {
    totalSlotsGenerated: number;
    availableSlots: number;
    conflictingSlots: number;
    existingBookings: number;
  };
}

/**
 * Hook to fetch and manage available time slots for a specific space and date
 */
export function useTimeSlots(spaceId: string | null, date: string | null, duration: number = 60) {
  const [localError, setLocalError] = useState<string>('');

  // Query for fetching available time slots
  const {
    data: availabilityData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['timeSlots', spaceId, date, duration],
    queryFn: async () => {
      if (!spaceId || !date) {
        throw new Error('Space ID and date are required');
      }

      try {
        // Make the API call using the public method
        const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api';
        const response = await fetch(`${apiUrl}/spaces/${spaceId}/availability?date=${date}&duration=${duration}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('cosynq_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.data as TimeSlotAvailability;
      } catch (err: any) {
        console.error('Error fetching time slots:', err);
        
        if (err.response?.status === 400) {
          throw new Error(err.response.data.message || 'Invalid request parameters');
        } else if (err.response?.status === 404) {
          throw new Error('Space not found');
        } else {
          throw new Error('Failed to fetch available time slots');
        }
      }
    },
    enabled: !!(spaceId && date),
    staleTime: 2 * 60 * 1000, // 2 minutes - time slots change frequently
    refetchOnWindowFocus: true,
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 2;
    }
  });

  // Process available slots for easier UI consumption
  const processedSlots = useMemo(() => {
    if (!availabilityData) {
      return {
        availableSlots: [],
        unavailableSlots: [],
        allSlots: [],
        timeSlotOptions: [],
        canBookToday: false,
        nextAvailableSlot: null
      };
    }

    const { availableSlots, unavailableSlots, isToday, allowSameDayBooking } = availabilityData;
    
    // Combine and sort all slots by time
    const allSlots = [...availableSlots, ...unavailableSlots].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Create dropdown options for available slots only
    const timeSlotOptions = availableSlots.map(slot => ({
      value: `${formatTimeForInput(slot.startTime)}-${formatTimeForInput(slot.endTime)}`,
      label: `${formatTimeForDisplay(slot.startTime)} - ${formatTimeForDisplay(slot.endTime)}`,
      startTime: formatTimeForInput(slot.startTime),
      endTime: formatTimeForInput(slot.endTime),
      slot: slot
    }));

    // Find next available slot
    const nextAvailableSlot = availableSlots.length > 0 ? availableSlots[0] : null;

    return {
      availableSlots,
      unavailableSlots,
      allSlots,
      timeSlotOptions,
      canBookToday: !isToday || allowSameDayBooking,
      nextAvailableSlot
    };
  }, [availabilityData]);

  // Validation function for selected time slot
  const validateTimeSlot = (startTime: string, endTime: string) => {
    setLocalError('');

    if (!availabilityData || !startTime || !endTime) {
      return { isValid: false, error: 'Please select both start and end times' };
    }

    // Check if the selected time matches any available slot
    const selectedSlot = availabilityData.availableSlots.find(slot => {
      const slotStart = formatTimeForInput(slot.startTime);
      const slotEnd = formatTimeForInput(slot.endTime);
      return slotStart === startTime && slotEnd === endTime;
    });

    if (!selectedSlot) {
      const error = 'Selected time slot is not available. Please choose from available slots only.';
      setLocalError(error);
      return { isValid: false, error };
    }

    // Additional validation checks
    if (selectedSlot.validationErrors && selectedSlot.validationErrors.length > 0) {
      const error = selectedSlot.validationErrors[0];
      setLocalError(error);
      return { isValid: false, error };
    }

    return { 
      isValid: true, 
      slot: selectedSlot,
      warnings: selectedSlot.validationWarnings || []
    };
  };

  // Helper to check if a specific time slot is available
  const isSlotAvailable = (startTime: string, endTime: string) => {
    if (!availabilityData) return false;
    
    return availabilityData.availableSlots.some(slot => {
      const slotStart = formatTimeForInput(slot.startTime);
      const slotEnd = formatTimeForInput(slot.endTime);
      return slotStart === startTime && slotEnd === endTime;
    });
  };

  // Force refresh time slots
  const refreshSlots = () => {
    setLocalError('');
    refetch();
  };

  return {
    // Data
    availabilityData,
    ...processedSlots,
    
    // Loading states
    isLoading,
    isError: isError || !!localError,
    error: localError || (error as Error)?.message || '',
    
    // Validation
    validateTimeSlot,
    isSlotAvailable,
    
    // Actions
    refreshSlots,
    
    // Metadata
    timezone: availabilityData?.timezone || 'Asia/Kolkata',
    currentTime: availabilityData?.currentTime,
    summary: availabilityData?.summary
  };
}

// Helper functions for time formatting
function formatTimeForInput(isoString: string): string {
  const date = new Date(isoString);
  return date.toTimeString().slice(0, 5); // HH:MM format
}

function formatTimeForDisplay(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

/**
 * Hook for getting time slot suggestions based on duration and preferences
 */
export function useTimeSlotSuggestions(
  spaceId: string | null, 
  date: string | null, 
  duration: number = 60,
  preferredStartTime?: string
) {
  const { availableSlots, isLoading } = useTimeSlots(spaceId, date, duration);

  const suggestions = useMemo(() => {
    if (!availableSlots || availableSlots.length === 0) {
      return [];
    }

    let slots = [...availableSlots];

    // If preferred start time is provided, prioritize slots around that time
    if (preferredStartTime) {
      const [preferredHour, preferredMinute] = preferredStartTime.split(':').map(Number);
      const preferredTotalMinutes = preferredHour * 60 + preferredMinute;

      slots.sort((a, b) => {
        const aTime = new Date(a.startTime);
        const bTime = new Date(b.startTime);
        const aTotalMinutes = aTime.getHours() * 60 + aTime.getMinutes();
        const bTotalMinutes = bTime.getHours() * 60 + bTime.getMinutes();

        const aDiff = Math.abs(aTotalMinutes - preferredTotalMinutes);
        const bDiff = Math.abs(bTotalMinutes - preferredTotalMinutes);

        return aDiff - bDiff;
      });
    }

    // Return top 5 suggestions
    return slots.slice(0, 5).map(slot => ({
      startTime: formatTimeForInput(slot.startTime),
      endTime: formatTimeForInput(slot.endTime),
      label: `${formatTimeForDisplay(slot.startTime)} - ${formatTimeForDisplay(slot.endTime)}`,
      slot
    }));
  }, [availableSlots, preferredStartTime]);

  return {
    suggestions,
    isLoading,
    hasSuggestions: suggestions.length > 0
  };
}