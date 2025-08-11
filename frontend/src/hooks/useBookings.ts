import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApiService } from '../services/bookingApi';
import {
  BookingData,
  CreateBookingData,
  UpdateBookingData,
  BookingStatus,
  PaymentStatus
} from '../services/bookingApi';
import { format } from 'date-fns';

// Query Keys
export const BOOKINGS_QUERY_KEY = 'bookings';
export const BOOKING_STATS_QUERY_KEY = 'booking-stats';
export const SPACE_AVAILABILITY_QUERY_KEY = 'space-availability';

// Bookings List Query
export const useBookings = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  spaceId?: string;
  contactId?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  checkedIn?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  return useQuery({
    queryKey: [BOOKINGS_QUERY_KEY, params],
    queryFn: async () => {
      const response = await bookingApiService.getBookings(params);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - bookings need fresher data
    refetchOnWindowFocus: true, // Important for booking conflicts
  });
};

// Single Booking Query
export const useBooking = (id: string | undefined) => {
  return useQuery({
    queryKey: [BOOKINGS_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) throw new Error('Booking ID is required');
      const response = await bookingApiService.getBooking(id);
      return response.data.data?.booking;
    },
    enabled: !!id,
    staleTime: 1000 * 30, // 30 seconds - individual bookings need frequent updates
  });
};

// Booking Statistics Query
export const useBookingStats = () => {
  return useQuery({
    queryKey: [BOOKING_STATS_QUERY_KEY],
    queryFn: async () => {
      const response = await bookingApiService.getBookingStats();
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes for dashboard
  });
};

// Space Availability Query
export const useSpaceAvailability = (
  spaceId: string | undefined,
  date: string | undefined,
  duration?: number
) => {
  return useQuery({
    queryKey: [SPACE_AVAILABILITY_QUERY_KEY, spaceId, date, duration],
    queryFn: async () => {
      if (!spaceId || !date) throw new Error('Space ID and date are required');
      const response = await bookingApiService.checkAvailability(spaceId, {
        date,
        duration,
      });
      return response.data.data;
    },
    enabled: !!spaceId && !!date,
    staleTime: 1000 * 60, // 1 minute - availability changes quickly
    refetchOnWindowFocus: true, // Important for real-time availability
  });
};

// Create Booking Mutation
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingData: CreateBookingData) => {
      const response = await bookingApiService.createBooking(bookingData);
      return response.data.data?.booking;
    },
    onMutate: async (newBooking) => {
      // Cancel any outgoing refetches for bookings
      await queryClient.cancelQueries({ queryKey: [BOOKINGS_QUERY_KEY] });

      // Snapshot the previous value
      const previousBookings = queryClient.getQueryData([BOOKINGS_QUERY_KEY]);

      // Optimistically update the cache
      const optimisticBooking: Partial<BookingData> = {
        _id: `temp-${Date.now()}`,
        ...newBooking,
        status: 'Pending',
        paymentStatus: 'Pending',
        checkedIn: false,
        bookingReference: `BK${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Return a context object with the snapshotted value
      return { previousBookings, optimisticBooking };
    },
    onError: (err, _newBooking, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousBookings) {
        queryClient.setQueryData([BOOKINGS_QUERY_KEY], context.previousBookings);
      }
      console.error('Booking creation error:', err);
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch bookings list and stats
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BOOKING_STATS_QUERY_KEY] });
      
      // Invalidate availability for the booked space
      queryClient.invalidateQueries({ 
        queryKey: [SPACE_AVAILABILITY_QUERY_KEY, variables.spaceId] 
      });

      console.log('Booking created successfully:', data);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
    },
  });
};

// Update Booking Mutation
export const useUpdateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, bookingData }: { id: string; bookingData: UpdateBookingData }) => {
      const response = await bookingApiService.updateBooking(id, bookingData);
      return response.data.data?.booking;
    },
    onMutate: async ({ id, bookingData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [BOOKINGS_QUERY_KEY, id] });

      // Snapshot the previous value
      const previousBooking = queryClient.getQueryData([BOOKINGS_QUERY_KEY, id]);

      // Optimistically update the cache
      queryClient.setQueryData([BOOKINGS_QUERY_KEY, id], (old: any) => ({
        ...old,
        ...bookingData,
        updatedAt: new Date().toISOString(),
      }));

      return { previousBooking };
    },
    onError: (err, { id }, context) => {
      // Roll back on error
      if (context?.previousBooking) {
        queryClient.setQueryData([BOOKINGS_QUERY_KEY, id], context.previousBooking);
      }
      console.error('Booking update error:', err);
    },
    onSuccess: (data, { id, bookingData }) => {
      // Update the specific booking cache
      queryClient.setQueryData([BOOKINGS_QUERY_KEY, id], data);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BOOKING_STATS_QUERY_KEY] });
      
      // If space or time changed, invalidate availability
      if (bookingData.startTime || bookingData.endTime) {
        queryClient.invalidateQueries({ queryKey: [SPACE_AVAILABILITY_QUERY_KEY] });
      }

      console.log('Booking updated successfully:', data);
    },
  });
};

// Delete/Cancel Booking Mutation
export const useDeleteBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cancelReason }: { id: string; cancelReason?: string }) => {
      await bookingApiService.deleteBooking(id, cancelReason);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache and refetch lists
      queryClient.removeQueries({ queryKey: [BOOKINGS_QUERY_KEY, deletedId] });
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BOOKING_STATS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SPACE_AVAILABILITY_QUERY_KEY] });

      console.log('Booking cancelled successfully:', deletedId);
    },
    onError: (error) => {
      console.error('Booking cancellation error:', error);
    },
  });
};

// Convenience Mutation Hooks for Common Operations

// Confirm Booking
export const useConfirmBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await bookingApiService.confirmBooking(id);
      return response.data.data?.booking;
    },
    onSuccess: (data, id) => {
      queryClient.setQueryData([BOOKINGS_QUERY_KEY, id], data);
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BOOKING_STATS_QUERY_KEY] });
    },
  });
};

// Cancel Booking
export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cancelReason }: { id: string; cancelReason: string }) => {
      const response = await bookingApiService.cancelBooking(id, cancelReason);
      return response.data.data?.booking;
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData([BOOKINGS_QUERY_KEY, id], data);
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BOOKING_STATS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SPACE_AVAILABILITY_QUERY_KEY] });
    },
  });
};

// Check-in Booking
export const useCheckInBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await bookingApiService.checkInBooking(id);
      return response.data.data?.booking;
    },
    onSuccess: (data, id) => {
      queryClient.setQueryData([BOOKINGS_QUERY_KEY, id], data);
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BOOKING_STATS_QUERY_KEY] });
    },
  });
};

// Check-out Booking
export const useCheckOutBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await bookingApiService.checkOutBooking(id);
      return response.data.data?.booking;
    },
    onSuccess: (data, id) => {
      queryClient.setQueryData([BOOKINGS_QUERY_KEY, id], data);
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BOOKING_STATS_QUERY_KEY] });
    },
  });
};

// Mark No Show
export const useMarkNoShow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await bookingApiService.markNoShow(id);
      return response.data.data?.booking;
    },
    onSuccess: (data, id) => {
      queryClient.setQueryData([BOOKINGS_QUERY_KEY, id], data);
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BOOKING_STATS_QUERY_KEY] });
    },
  });
};

// Complete Booking
export const useCompleteBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await bookingApiService.completeBooking(id);
      return response.data.data?.booking;
    },
    onSuccess: (data, id) => {
      queryClient.setQueryData([BOOKINGS_QUERY_KEY, id], data);
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BOOKING_STATS_QUERY_KEY] });
    },
  });
};

// Payment Status Updates
export const useMarkPaymentPaid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await bookingApiService.markPaymentPaid(id);
      return response.data.data?.booking;
    },
    onSuccess: (data, id) => {
      queryClient.setQueryData([BOOKINGS_QUERY_KEY, id], data);
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BOOKING_STATS_QUERY_KEY] });
    },
  });
};

export const useMarkPaymentFailed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await bookingApiService.markPaymentFailed(id);
      return response.data.data?.booking;
    },
    onSuccess: (data, id) => {
      queryClient.setQueryData([BOOKINGS_QUERY_KEY, id], data);
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BOOKING_STATS_QUERY_KEY] });
    },
  });
};

export const useRefundPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await bookingApiService.refundPayment(id);
      return response.data.data?.booking;
    },
    onSuccess: (data, id) => {
      queryClient.setQueryData([BOOKINGS_QUERY_KEY, id], data);
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BOOKING_STATS_QUERY_KEY] });
    },
  });
};

// Calendar Integration Helpers

// Transform booking data for react-big-calendar
export const transformBookingsForCalendar = (bookings: BookingData[]) => {
  return bookings.map((booking) => ({
    id: booking._id,
    title: `${booking.customerName || booking.contact?.firstName + ' ' + booking.contact?.lastName || 'Booking'} - ${booking.space?.name || 'Space'}`,
    start: new Date(booking.startTime),
    end: new Date(booking.endTime),
    resource: {
      booking,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      spaceName: booking.space?.name,
      customerName: booking.customerName || `${booking.contact?.firstName} ${booking.contact?.lastName}`,
      attendeeCount: booking.attendeeCount,
      totalAmount: booking.totalAmount,
      currency: booking.currency,
      bookingReference: booking.bookingReference,
    },
  }));
};

// Get booking status color for calendar display
export const getBookingStatusColor = (status: BookingStatus): string => {
  switch (status) {
    case 'Pending':
      return '#f59e0b'; // amber
    case 'Confirmed':
      return '#10b981'; // emerald
    case 'Cancelled':
      return '#ef4444'; // red
    case 'Completed':
      return '#6b7280'; // gray
    case 'No Show':
      return '#dc2626'; // red-600
    default:
      return '#6b7280'; // gray
  }
};

// Get payment status color
export const getPaymentStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case 'Pending':
      return '#f59e0b'; // amber
    case 'Paid':
      return '#10b981'; // emerald
    case 'Refunded':
      return '#6b7280'; // gray
    case 'Failed':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
};

// Format booking time range for display
export const formatBookingTimeRange = (startTime: string, endTime: string): string => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  return `${format(start, 'MMM d, yyyy h:mm a')} - ${format(end, 'h:mm a')}`;
};

// Calculate booking duration in minutes
export const calculateBookingDuration = (startTime: string, endTime: string): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
};

// Check if booking can be cancelled (following backend logic)
export const canBookingBeCancelled = (booking: BookingData): boolean => {
  const now = new Date();
  const startTime = new Date(booking.startTime);
  const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return booking.status === 'Pending' || 
         (booking.status === 'Confirmed' && hoursUntilStart >= 2); // 2 hours cancellation policy
};

// Check if booking can be modified (following backend logic)
export const canBookingBeModified = (booking: BookingData): boolean => {
  const now = new Date();
  const startTime = new Date(booking.startTime);
  const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return (booking.status === 'Pending' || booking.status === 'Confirmed') && 
         hoursUntilStart >= 4; // 4 hours modification policy
};

// Check if booking is currently active
export const isBookingActive = (booking: BookingData): boolean => {
  const now = new Date();
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  
  return booking.status === 'Confirmed' && 
         start <= now && 
         end > now;
};

// Utility function to get next available time slots
export const getNextAvailableSlots = (
  availability: { startTime: string; endTime: string }[],
  duration: number = 60
): Array<{ label: string; value: string }> => {
  return availability
    .filter(slot => {
      const slotDuration = (new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / (1000 * 60);
      return slotDuration >= duration;
    })
    .map(slot => ({
      label: `${format(new Date(slot.startTime), 'h:mm a')} - ${format(new Date(slot.endTime), 'h:mm a')}`,
      value: slot.startTime,
    }))
    .slice(0, 10); // Limit to next 10 available slots
};