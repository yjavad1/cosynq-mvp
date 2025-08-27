import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApiService, BookingData, UpdateBookingData } from '../services/bookingApi';
import { BOOKINGS_QUERY_KEY, BOOKING_STATS_QUERY_KEY, SPACE_AVAILABILITY_QUERY_KEY } from './useBookings';

interface EditBookingState {
  isOpen: boolean;
  booking: BookingData | null;
  isLoading: boolean;
  error: string | null;
}

interface UseEditBookingReturn {
  // State
  editState: EditBookingState;
  
  // Actions
  openEditModal: (booking: BookingData) => void;
  closeEditModal: () => void;
  updateBooking: (bookingData: UpdateBookingData) => Promise<void>;
  deleteBooking: (cancelReason?: string) => Promise<void>;
  clearError: () => void;
}

export const useEditBooking = (): UseEditBookingReturn => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<EditBookingState>({
    isOpen: false,
    booking: null,
    isLoading: false,
    error: null
  });

  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, bookingData }: { id: string; bookingData: UpdateBookingData }) => {
      console.log('🔄 Updating booking:', id, 'with data:', bookingData);
      const response = await bookingApiService.updateBooking(id, bookingData);
      return response.data.data?.booking;
    },
    onMutate: async ({ id, bookingData }) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Cancel any outgoing refetches for the specific booking
      await queryClient.cancelQueries({ queryKey: [BOOKINGS_QUERY_KEY, id] });

      // Snapshot the previous value
      const previousBooking = queryClient.getQueryData([BOOKINGS_QUERY_KEY, id]);

      // Optimistically update the booking in the cache
      queryClient.setQueryData([BOOKINGS_QUERY_KEY, id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          ...bookingData,
          updatedAt: new Date().toISOString(),
        };
      });

      // Also update in bookings list cache
      queryClient.setQueryData([BOOKINGS_QUERY_KEY], (old: any) => {
        if (!old?.bookings) return old;
        return {
          ...old,
          bookings: old.bookings.map((booking: BookingData) =>
            booking._id === id ? { ...booking, ...bookingData } : booking
          ),
        };
      });

      return { previousBooking, previousBookingsList: queryClient.getQueryData([BOOKINGS_QUERY_KEY]) };
    },
    onError: (err: any, { id }, context) => {
      console.error('❌ Booking update failed:', err);
      
      // Roll back optimistic updates
      if (context?.previousBooking) {
        queryClient.setQueryData([BOOKINGS_QUERY_KEY, id], context.previousBooking);
      }
      if (context?.previousBookingsList) {
        queryClient.setQueryData([BOOKINGS_QUERY_KEY], context.previousBookingsList);
      }

      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update booking';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
    },
    onSuccess: (updatedBooking, { id, bookingData }) => {
      console.log('✅ Booking updated successfully:', updatedBooking);
      
      // Update the local state with the updated booking
      setState(prev => ({
        ...prev,
        booking: updatedBooking,
        isLoading: false,
        error: null
      }));

      // Update the specific booking cache with server response
      queryClient.setQueryData([BOOKINGS_QUERY_KEY, id], updatedBooking);
      
      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BOOKING_STATS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] }); // Invalidate calendar queries
      
      // If time changed, invalidate availability queries
      if (bookingData.startTime || bookingData.endTime) {
        queryClient.invalidateQueries({ queryKey: [SPACE_AVAILABILITY_QUERY_KEY] });
      }
    },
    onSettled: () => {
      // Always refetch bookings list to ensure consistency
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
    },
  });

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async ({ id, cancelReason }: { id: string; cancelReason?: string }) => {
      console.log('🗑️ Deleting booking:', id, cancelReason ? `with reason: ${cancelReason}` : '');
      const response = await bookingApiService.deleteBooking(id, cancelReason);
      return { ...response.data, deletedId: id };
    },
    onMutate: async ({ id }) => {
      console.log('🔄 Starting optimistic delete for booking:', id);
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Cancel ALL outgoing refetches for booking-related queries
      await Promise.all([
        queryClient.cancelQueries({ queryKey: [BOOKINGS_QUERY_KEY] }),
        queryClient.cancelQueries({ queryKey: ['calendar-bookings'] }),
        queryClient.cancelQueries({ queryKey: [BOOKING_STATS_QUERY_KEY] }),
        queryClient.cancelQueries({ queryKey: [SPACE_AVAILABILITY_QUERY_KEY] })
      ]);

      // Snapshot all related query data
      const previousBookingsList = queryClient.getQueryData([BOOKINGS_QUERY_KEY]);
      const previousCalendarData = queryClient.getQueryData(['calendar-bookings']);
      const previousStats = queryClient.getQueryData([BOOKING_STATS_QUERY_KEY]);

      // Optimistically remove the booking from ALL related caches
      
      // 1. Remove from main bookings list
      queryClient.setQueryData([BOOKINGS_QUERY_KEY], (old: any) => {
        if (!old?.bookings) return old;
        return {
          ...old,
          bookings: old.bookings.filter((booking: BookingData) => booking._id !== id),
        };
      });

      // 2. Remove from calendar-bookings cache (all variations)
      queryClient.getQueryCache().findAll({ queryKey: ['calendar-bookings'] }).forEach((query) => {
        queryClient.setQueryData(query.queryKey, (old: any) => {
          if (Array.isArray(old)) {
            return old.filter((booking: any) => booking._id !== id);
          }
          if (old?.bookings) {
            return {
              ...old,
              bookings: old.bookings.filter((booking: any) => booking._id !== id)
            };
          }
          return old;
        });
      });

      // 3. Update stats cache optimistically
      queryClient.setQueryData([BOOKING_STATS_QUERY_KEY], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          totalBookings: Math.max(0, (old.totalBookings || 0) - 1),
          // Update other stats as needed
        };
      });

      return { previousBookingsList, previousCalendarData, previousStats };
    },
    onError: (err: any, variables, context) => {
      console.error('❌ Booking deletion failed:', err);
      
      // Roll back ALL optimistic updates
      if (context?.previousBookingsList) {
        queryClient.setQueryData([BOOKINGS_QUERY_KEY], context.previousBookingsList);
      }
      if (context?.previousCalendarData) {
        queryClient.setQueryData(['calendar-bookings'], context.previousCalendarData);
      }
      if (context?.previousStats) {
        queryClient.setQueryData([BOOKING_STATS_QUERY_KEY], context.previousStats);
      }

      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to delete booking';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
    },
    onSuccess: (data, { id }) => {
      console.log('✅ Booking deleted successfully:', id, 'Response:', data);
      
      setState(prev => ({ ...prev, isLoading: false, error: null }));

      // Comprehensive cache invalidation with force refetch
      const invalidatePromises = [
        // Invalidate and force refetch all booking queries
        queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: [BOOKING_STATS_QUERY_KEY], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: [SPACE_AVAILABILITY_QUERY_KEY], refetchType: 'active' }),
        
        // Invalidate ALL calendar-bookings queries (with patterns)
        queryClient.invalidateQueries({ 
          queryKey: ['calendar-bookings'], 
          refetchType: 'active',
          exact: false // Match all calendar-booking query variations
        }),
        
        // Force refetch currently active queries for immediate consistency
        queryClient.refetchQueries({ queryKey: [BOOKINGS_QUERY_KEY], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['calendar-bookings'], type: 'active' })
      ];

      // Execute all invalidations
      Promise.all(invalidatePromises).then(() => {
        console.log('🔄 All caches invalidated and refetched after deletion');
        
        // Close modal after successful deletion and cache invalidation
        setState(prev => ({
          ...prev,
          isOpen: false,
          booking: null,
          error: null
        }));
      }).catch((error) => {
        console.error('⚠️ Some cache invalidations failed:', error);
        
        // Still close modal even if some cache invalidations failed
        setState(prev => ({
          ...prev,
          isOpen: false,
          booking: null,
          error: null
        }));
      });
    },
    onSettled: () => {
      // Final safety net - ensure all booking-related queries are fresh
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key.includes('booking') || key.includes('calendar') || key.includes('availability');
          }
        });
      }, 100);
    },
  });

  // Open edit modal with booking data
  const openEditModal = useCallback((booking: BookingData) => {
    console.log('📝 Opening edit modal for booking:', booking._id);
    setState({
      isOpen: true,
      booking,
      isLoading: false,
      error: null
    });
  }, []);

  // Close edit modal and reset state
  const closeEditModal = useCallback(() => {
    console.log('❌ Closing edit modal');
    setState({
      isOpen: false,
      booking: null,
      isLoading: false,
      error: null
    });
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Update booking function
  const updateBooking = useCallback(async (bookingData: UpdateBookingData) => {
    if (!state.booking) {
      throw new Error('No booking selected for editing');
    }

    try {
      await updateBookingMutation.mutateAsync({
        id: state.booking._id,
        bookingData
      });
    } catch (error) {
      // Error handling is done in the mutation's onError callback
      throw error;
    }
  }, [state.booking, updateBookingMutation]);

  // Delete booking function
  const deleteBooking = useCallback(async (cancelReason?: string) => {
    if (!state.booking) {
      throw new Error('No booking selected for deletion');
    }

    try {
      await deleteBookingMutation.mutateAsync({
        id: state.booking._id,
        cancelReason
      });
    } catch (error) {
      // Error handling is done in the mutation's onError callback
      throw error;
    }
  }, [state.booking, deleteBookingMutation]);

  return {
    editState: {
      ...state,
      isLoading: state.isLoading || updateBookingMutation.isPending || deleteBookingMutation.isPending
    },
    openEditModal,
    closeEditModal,
    updateBooking,
    deleteBooking,
    clearError
  };
};

export default useEditBooking;