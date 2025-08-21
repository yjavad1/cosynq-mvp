import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
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

// Location-specific Booking Statistics Query
export const useLocationBookingStats = (locationId: string | undefined) => {
  const { data: bookingsData } = useBookings({
    page: 1,
    limit: 1000, // Get all bookings for calculations
    sortBy: 'startTime',
    sortOrder: 'desc'
  });

  return useMemo(() => {
    if (!bookingsData?.bookings || !locationId) {
      return {
        totalBookings: 0,
        todayBookings: 0,
        thisWeekBookings: 0,
        thisMonthBookings: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        thisWeekRevenue: 0,
        thisMonthRevenue: 0,
        averageBookingValue: 0,
        occupancyRate: 0,
        upcomingBookings: 0,
        bookingsByStatus: [],
        recentBookings: []
      };
    }

    // Filter bookings for spaces in this location
    const locationBookings = bookingsData.bookings.filter(booking => {
      // Check if booking's space belongs to this location
      if (typeof booking.spaceId === 'object' && (booking.spaceId as any)?.locationId) {
        return (booking.spaceId as any).locationId === locationId;
      }
      // For now, if we can't determine location from space, include all bookings
      // This can be enhanced when space data is properly populated
      return true;
    });

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Calculate various metrics
    const totalBookings = locationBookings.length;
    
    const todayBookings = locationBookings.filter(booking => {
      const bookingDate = new Date(booking.startTime);
      return bookingDate >= today && bookingDate < tomorrow;
    }).length;
    
    const thisWeekBookings = locationBookings.filter(booking => {
      const bookingDate = new Date(booking.startTime);
      return bookingDate >= thisWeekStart;
    }).length;
    
    const thisMonthBookings = locationBookings.filter(booking => {
      const bookingDate = new Date(booking.startTime);
      return bookingDate >= thisMonthStart && bookingDate < nextMonthStart;
    }).length;

    // Revenue calculations
    const totalRevenue = locationBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    
    const todayRevenue = locationBookings
      .filter(booking => {
        const bookingDate = new Date(booking.startTime);
        return bookingDate >= today && bookingDate < tomorrow;
      })
      .reduce((sum, booking) => sum + booking.totalAmount, 0);
    
    const thisWeekRevenue = locationBookings
      .filter(booking => {
        const bookingDate = new Date(booking.startTime);
        return bookingDate >= thisWeekStart;
      })
      .reduce((sum, booking) => sum + booking.totalAmount, 0);
    
    const thisMonthRevenue = locationBookings
      .filter(booking => {
        const bookingDate = new Date(booking.startTime);
        return bookingDate >= thisMonthStart && bookingDate < nextMonthStart;
      })
      .reduce((sum, booking) => sum + booking.totalAmount, 0);

    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Upcoming bookings (future bookings)
    const upcomingBookings = locationBookings.filter(booking => {
      const bookingStart = new Date(booking.startTime);
      return bookingStart > now && (booking.status === 'Pending' || booking.status === 'Confirmed');
    }).length;

    // Bookings by status
    const statusCounts = locationBookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<BookingStatus, number>);

    const bookingsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status: status as BookingStatus,
      count
    }));

    // Recent bookings (last 5)
    const recentBookings = locationBookings
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalBookings,
      todayBookings,
      thisWeekBookings,
      thisMonthBookings,
      totalRevenue,
      todayRevenue,
      thisWeekRevenue,
      thisMonthRevenue,
      averageBookingValue,
      occupancyRate: 0, // TODO: Calculate based on space capacity and time slots
      upcomingBookings,
      bookingsByStatus,
      recentBookings
    };
  }, [bookingsData, locationId]);
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
    onError: (err: any, _newBooking, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousBookings) {
        queryClient.setQueryData([BOOKINGS_QUERY_KEY], context.previousBookings);
      }
      console.error('❌ Booking creation error:', err);
      console.error('📋 Error response details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          data: err.config?.data
        }
      });
    },
    onSuccess: (data, variables) => {
      console.log('✅ Booking created successfully:', data);
      console.log('🔄 Invalidating React Query cache for immediate calendar update...');
      
      // Invalidate ALL booking-related queries to ensure calendar refreshes
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BOOKING_STATS_QUERY_KEY] });
      
      // Invalidate location-specific booking stats
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey as any[];
          return queryKey[0] === BOOKINGS_QUERY_KEY || 
                 queryKey[0] === BOOKING_STATS_QUERY_KEY ||
                 (queryKey[0] === 'location-booking-stats');
        }
      });
      
      // Force immediate refetch for space-specific queries
      if (variables.spaceId) {
        console.log('🔄 Invalidating space-specific bookings for spaceId:', variables.spaceId);
        queryClient.invalidateQueries({ 
          queryKey: [BOOKINGS_QUERY_KEY],
          predicate: (query) => {
            const queryKey = query.queryKey as any[];
            return queryKey[1]?.spaceId === variables.spaceId;
          }
        });
      }
      
      // Invalidate availability for the booked space
      queryClient.invalidateQueries({ 
        queryKey: [SPACE_AVAILABILITY_QUERY_KEY, variables.spaceId] 
      });

      // Force immediate refetch of all active booking queries
      console.log('🚀 Force refetching all booking queries...');
      queryClient.refetchQueries({ 
        queryKey: [BOOKINGS_QUERY_KEY],
        type: 'active'
      });
      
      // Additional aggressive cache invalidation for calendar
      setTimeout(() => {
        console.log('🔄 Secondary cache invalidation for calendar reliability...');
        queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
      }, 100);

      // Dispatch custom event for direct calendar refresh
      window.dispatchEvent(new CustomEvent('bookingCreated', { 
        detail: { booking: data, variables } 
      }));
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

// Centralized event adapter - tolerant to both field naming conventions
function toCalendarEvent(booking: BookingData) {
  // Normalize time fields to handle both start/end and startTime/endTime
  const startTime = (booking as any).start || booking.startTime;
  const endTime = (booking as any).end || booking.endTime;
  
  return {
    id: booking._id,
    title: `${booking.customerName || booking.contact?.firstName + ' ' + booking.contact?.lastName || 'Booking'} - ${booking.space?.name || 'Space'}`,
    start: new Date(startTime),
    end: new Date(endTime),
    status: booking.status, // Add status at root level for easy filtering
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
  };
}

// Transform booking data for react-big-calendar with cancellation filtering
export const transformBookingsForCalendar = (bookings: BookingData[], showCancelled: boolean = false) => {
  return bookings
    .filter((booking) => showCancelled || booking.status !== 'Cancelled') // Filter cancelled by default
    .map(toCalendarEvent);
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