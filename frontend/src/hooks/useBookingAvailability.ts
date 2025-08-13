import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { 
  bookingAvailabilityService, 
  AvailabilityRequest, 
  ConflictResult, 
  TimeSlot, 
  BulkAvailabilityRequest,
  BusinessRules 
} from '../services/bookingAvailability';
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
  return useQuery<ConflictResult, Error>({
    queryKey: [AVAILABILITY_QUERY_KEY, request],
    queryFn: async (): Promise<ConflictResult> => {
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
  return useQuery<TimeSlot[], Error>({
    queryKey: [DAY_AVAILABILITY_QUERY_KEY, spaceId, date],
    queryFn: async (): Promise<TimeSlot[]> => {
      if (!spaceId || !date) throw new Error('Space ID and date are required');
      return await bookingAvailabilityService.getDayAvailability(spaceId, date);
    },
    enabled: !!spaceId && !!date,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true
  });
};

/**
 * Bulk availability check for multiple spaces
 * Useful for space comparison and selection
 */
export const useBulkAvailability = (request: BulkAvailabilityRequest | null) => {
  return useQuery<Map<string, TimeSlot[]>, Error>({
    queryKey: [BULK_AVAILABILITY_QUERY_KEY, request],
    queryFn: async (): Promise<Map<string, TimeSlot[]>> => {
      if (!request) throw new Error('Bulk availability request is required');
      return await bookingAvailabilityService.getBulkAvailability(request);
    },
    enabled: !!request && !!request.spaceIds.length && !!request.date,
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: true
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
    conflicts: ConflictResult;
    suggestions: TimeSlot[];
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
            field: 'general',
            message: 'Unable to validate booking. Please try again.',
            code: 'VALIDATION_ERROR'
          }]
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
    if (!daySlots) return [];
    
    return daySlots
      .filter((slot: TimeSlot) => slot.available)
      .slice(0, 10) // Next 10 available slots
      .map((slot: TimeSlot) => ({
        label: `${format(slot.startTime, 'h:mm a')} - ${format(slot.endTime, 'h:mm a')}`,
        value: slot.startTime.toISOString(),
        startTime: slot.startTime,
        endTime: slot.endTime,
        isPeak: slot.isPeak,
        price: slot.price
      }));
  }, [daySlots]);
};

// Get availability statistics for a space
export const useSpaceAvailabilityStats = (spaceId: string | undefined, date: Date | string | undefined) => {
  const { data: daySlots } = useDayAvailability(spaceId, date);
  
  return useMemo(() => {
    if (!daySlots || !daySlots.length) {
      return {
        totalSlots: 0,
        availableSlots: 0,
        bookedSlots: 0,
        peakSlots: 0,
        occupancyRate: 0
      };
    }

    const totalSlots = daySlots.length;
    const availableSlots = daySlots.filter((slot: TimeSlot) => slot.available).length;
    const bookedSlots = totalSlots - availableSlots;
    const peakSlots = daySlots.filter((slot: TimeSlot) => slot.isPeak).length;
    const occupancyRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

    return {
      totalSlots,
      availableSlots,
      bookedSlots,
      peakSlots,
      occupancyRate
    };
  }, [daySlots]);
};

/**
 * Utility functions for availability display
 */

// Format conflict messages for user-friendly display
export const formatConflictMessage = (conflict: ConflictResult): string[] => {
  const messages: string[] = [];
  
  // Add error messages
  if (conflict.errors.length > 0) {
    messages.push(...conflict.errors.map(error => error.message));
  }
  
  // Add conflict messages
  if (conflict.conflicts.length > 0) {
    messages.push(...conflict.conflicts.map(c => c.message));
  }
  
  return messages;
};

// Get conflict severity level
export const getConflictSeverity = (conflict: ConflictResult): 'none' | 'warning' | 'error' => {
  if (conflict.errors.length > 0) return 'error';
  if (conflict.conflicts.some(c => c.severity === 'error')) return 'error';
  if (conflict.conflicts.some(c => c.severity === 'warning')) return 'warning';
  return 'none';
};

// Transform time slots for select components
export const transformSlotsForSelect = (slots: TimeSlot[]) => {
  return slots
    .filter(slot => slot.available)
    .map(slot => ({
      label: `${format(slot.startTime, 'h:mm a')} - ${format(slot.endTime, 'h:mm a')}${slot.isPeak ? ' (Peak)' : ''}`,
      value: slot.startTime.toISOString(),
      disabled: !slot.available,
      peak: slot.isPeak,
      price: slot.price
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