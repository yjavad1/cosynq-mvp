import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { 
  bookingAvailabilityService, 
  AvailabilityRequest, 
  BulkAvailabilityRequest,
  BusinessRules 
} from '../services/bookingAvailability';
import { AvailabilityResponse, Slot, Suggestion } from '../types/availability';
import { format } from 'date-fns';

// Query Keys
export const AVAILABILITY_QUERY_KEY = 'booking-availability';
export const DAY_AVAILABILITY_QUERY_KEY = 'day-availability';
export const BULK_AVAILABILITY_QUERY_KEY = 'bulk-availability';
export const REAL_TIME_AVAILABILITY_QUERY_KEY = 'realtime-availability';

/**
 * Enhanced availability check with comprehensive validation
 * Provides conflict detection, business rules enforcement, and alternative suggestions
 */
export const useBookingAvailabilityCheck = (request: AvailabilityRequest | null) => {
 return useQuery<AvailabilityResponse>({
    queryKey: [AVAILABILITY_QUERY_KEY, request],
    queryFn: async (): Promise<AvailabilityResponse> => {
      if (!request) throw new Error('Availability request is required');
      return await bookingAvailabilityService.checkAvailability(request);
    },
    enabled: !!request && !!request.spaceId && !!request.startTime && !!request.endTime,
    staleTime: 1000 * 60, // 1 minute - availability changes frequently
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true, // Important for booking conflicts
    refetchInterval: 1000 * 30, // Refresh every 30 seconds for real-time accuracy
    retry: 2
  });
};

/**
 * Real-time availability check for quick validation
 * Optimized for frequent calls with minimal overhead
 */
export const useRealTimeAvailabilityCheck = (request: AvailabilityRequest | null) => {
  return useQuery({
    queryKey: [REAL_TIME_AVAILABILITY_QUERY_KEY, request],
    queryFn: async (): Promise<boolean> => {
      if (!request) return false;
      return await bookingAvailabilityService.checkRealTimeAvailability(request);
    },
    enabled: !!request?.spaceId && !!request?.startTime && !!request?.endTime,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false, // Reduce unnecessary calls
    retry: 1,
  });
};

/**
 * Get available time slots for a specific day
 * Perfect for calendar and time picker components
 */
export const useDayAvailability = (spaceId: string | undefined, date: Date | string | undefined) => {
return useQuery<Slot[]>({
    queryKey: [DAY_AVAILABILITY_QUERY_KEY, spaceId, date],
    queryFn: async (): Promise<Slot[]> => {
      if (!spaceId || !date) throw new Error('Space ID and date are required');
      return await bookingAvailabilityService.getDayAvailability(spaceId, date);
    },
    enabled: !!spaceId && !!date,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
refetchOnWindowFocus: true,
  });
};

/**
 * Bulk availability check for multiple spaces
 * Useful for space comparison and selection
 */
export const useBulkAvailability = (request: BulkAvailabilityRequest | null) => {
return useQuery<Map<string, Slot[]>>({
    queryKey: [BULK_AVAILABILITY_QUERY_KEY, request],
    queryFn: async (): Promise<Map<string, Slot[]>> => {
      if (!request) throw new Error('Bulk availability request is required');
      return await bookingAvailabilityService.getBulkAvailability(request);
    },
    enabled: !!request && !!request.spaceIds.length && !!request.date,
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
refetchOnWindowFocus: true,
  });
};

/**
 * Business rules management mutation
 * Allows dynamic configuration of booking policies
 */
export const useUpdateBusinessRules = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rules: Partial<BusinessRules>) => {
      bookingAvailabilityService.updateBusinessRules(rules);
      return rules;
    },
    onSuccess: (updatedRules) => {
      // Invalidate all availability queries when business rules change
      queryClient.invalidateQueries({ queryKey: [AVAILABILITY_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [DAY_AVAILABILITY_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BULK_AVAILABILITY_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [REAL_TIME_AVAILABILITY_QUERY_KEY] });
      
      console.log('✅ Business rules updated:', updatedRules);
    },
    onError: (error: Error) => {
      console.error('❌ Failed to update business rules:', error);
    }
  });
};

/**
 * Enhanced hook for booking form validation with real-time feedback
 */
export const useBookingFormValidation = () => {
  const queryClient = useQueryClient();

  const validateBookingRequest = useCallback(async (request: AvailabilityRequest): Promise<{
    isValid: boolean;
    conflicts: AvailabilityResponse;
    suggestions: Suggestion[];
  }> => {
    try {
      const conflicts = await bookingAvailabilityService.checkAvailability(request);
      
      return {
        isValid: !conflicts.hasConflict,
        conflicts,
        suggestions: conflicts.suggestions || []
      };
    } catch (error) {
      console.error('Form validation error:', error);
      return {
        isValid: false,
        conflicts: {
          hasConflict: true,
          conflicts: [],
          suggestions: [],
          errors: [{
            code: 'VALIDATION_ERROR',
            message: 'Unable to validate booking. Please try again.'
          }],
          slots: []
        },
        suggestions: []
      };
    }
  }, []);

  const invalidateAvailabilityQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [AVAILABILITY_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [DAY_AVAILABILITY_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [REAL_TIME_AVAILABILITY_QUERY_KEY] });
  }, [queryClient]);

  return {
    validateBookingRequest,
    invalidateAvailabilityQueries
  };
};

/**
 * Helper hooks for common availability scenarios
 */

// Check if a time slot is available (simple boolean)
export const useIsTimeSlotAvailable = (
  spaceId: string | undefined, 
  startTime: Date | string | undefined, 
  endTime: Date | string | undefined
) => {
  const request = useMemo(() => {
    if (!spaceId || !startTime || !endTime) return null;
    return {
      spaceId,
      startTime,
      endTime,
      checkBusinessRules: false // Quick check without business rules
    };
  }, [spaceId, startTime, endTime]);

  const { data: isAvailable, ...rest } = useRealTimeAvailabilityCheck(request);
  
  return {
    isAvailable: isAvailable ?? false,
    ...rest
  };
};

// Get next available slots for a space
export const useNextAvailableSlots = (spaceId: string | undefined, fromDate?: Date) => {
  const searchDate = fromDate || new Date();
  const { data: daySlots } = useDayAvailability(spaceId, searchDate);
  
  return useMemo(() => {
    const slots: Slot[] = daySlots ?? [];
    
 return slots
      .filter((slot: Slot) => slot.available)
      .slice(0, 10) // Next 10 available slots
      .map((slot: Slot) => ({
        label: `${format(new Date(slot.start), 'h:mm a')} - ${format(new Date(slot.end), 'h:mm a')}`,
        value: slot.start,
        startTime: new Date(slot.start),
        endTime: new Date(slot.end),
        available: slot.available,
        reason: slot.reason
      }));
  }, [daySlots]);
};

// Get availability statistics for a space
export const useSpaceAvailabilityStats = (spaceId: string | undefined, date: Date | string | undefined) => {
  const { data: daySlots } = useDayAvailability(spaceId, date);
  
  return useMemo(() => {
    const slots: Slot[] = daySlots ?? [];
    
    if (!slots.length) {
      return {
        totalSlots: 0,
        availableSlots: 0,
        bookedSlots: 0,
        occupancyRate: 0
      };
    }

const totalSlots = slots.length;
    const availableSlots = slots.filter((slot: Slot) => slot.available).length;
    const bookedSlots = totalSlots - availableSlots;
    const occupancyRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

    return {
      totalSlots,
      availableSlots,
      bookedSlots,
      occupancyRate
    };
  }, [daySlots]);
};

/**
 * Utility functions for availability display
 */

// Format conflict messages for user-friendly display
export const formatConflictMessage = (conflict: AvailabilityResponse): string[] => {
  const messages: string[] = [];
  
  // Add error messages
  if (conflict.errors.length > 0) {
    messages.push(...conflict.errors.map(error => error.message));
  }
  
  // Add conflict messages
  if (conflict.conflicts.length > 0) {
    messages.push(...conflict.conflicts.map(c => `${c.start} - ${c.end}: ${c.reference || 'Conflict detected'}`));
  }
  
  return messages;
};

// Get conflict severity level
export const getConflictSeverity = (conflict: AvailabilityResponse): 'none' | 'warning' | 'error' => {
  if (conflict.errors.length > 0) return 'error';
  if (conflict.hasConflict) return 'error';
  return 'none';
};

// Transform time slots for select components
export const transformSlotsForSelect = (slots: Slot[]) => {
  return slots
    .filter((slot: Slot) => slot.available)
    .map((slot: Slot) => ({
      label: `${format(new Date(slot.start), 'h:mm a')} - ${format(new Date(slot.end), 'h:mm a')}`,
      value: slot.start,
      disabled: !slot.available,
      reason: slot.reason
    }));
};

export default {
  useBookingAvailabilityCheck,
  useRealTimeAvailabilityCheck,
  useDayAvailability,
  useBulkAvailability,
  useUpdateBusinessRules,
  useBookingFormValidation,
  useIsTimeSlotAvailable,
  useNextAvailableSlots,
  useSpaceAvailabilityStats,
  formatConflictMessage,
  getConflictSeverity,
  transformSlotsForSelect
};