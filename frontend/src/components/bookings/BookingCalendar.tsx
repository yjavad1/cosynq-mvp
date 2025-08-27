import { useState, useCallback, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths,
  isSameDay,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Plus
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ErrorBoundary } from '../common/ErrorBoundary';
import EditBookingModal from './EditBookingModal';
import { useEditBooking } from '../../hooks/useEditBooking';

interface CalendarBooking {
  _id: string;
  spaceName: string;
  spaceType: string;
  contactName?: string;
  customerName?: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  // Additional fields needed for editing
  spaceId?: string;
  purpose?: string;
  specialRequests?: string;
  notes?: string;
  bookingReference?: string;
  contact?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  space?: {
    _id: string;
    name: string;
    locationId?: string;
    capacity: number;
    type: string;
  };
  customerEmail?: string;
  customerPhone?: string;
}

interface BookingCalendarProps {
  locationId: string;
  onDateSelect?: (date: Date) => void;
  onBookingClick?: (booking: CalendarBooking) => void;
  onCreateBooking?: (date: Date) => void;
  className?: string;
}

const fetchCalendarBookings = async (locationId: string, startDate: string, endDate: string): Promise<CalendarBooking[]> => {
  const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api';
  
  // Build query params to exclude cancelled bookings and filter by location
  const params = new URLSearchParams({
    locationId,
    startDate,
    endDate,
    // Exclude cancelled bookings from calendar display
    excludeStatus: 'Cancelled'
  });

  const response = await fetch(
    `${apiUrl}/bookings?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('cosynq_token')}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch calendar bookings: ${response.statusText}`);
  }

  const data = await response.json();
  const bookings = data.data?.bookings || [];
  
  // Client-side filter as additional safety net to ensure no cancelled bookings show
  const activeBookings = bookings.filter((booking: CalendarBooking) => {
    const status = booking.status?.toLowerCase();
    return status !== 'cancelled';
  });
  
  console.log(`📅 Fetched ${bookings.length} total bookings for location ${locationId}, showing ${activeBookings.length} active bookings`);
  
  return activeBookings;
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return '#10b981';
    case 'pending':
      return '#f59e0b';
    case 'cancelled':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

const formatTime = (dateString: string): string => {
  return format(new Date(dateString), 'h:mm a');
};

function BookingCalendarCore({
  locationId,
  onDateSelect,
  onBookingClick,
  onCreateBooking,
  className = ''
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Edit booking functionality
  const {
    editState,
    openEditModal,
    closeEditModal,
    updateBooking,
    deleteBooking,
    clearError
  } = useEditBooking();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const {
    data: bookings = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['calendar-bookings', locationId, format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')],
    queryFn: () => fetchCalendarBookings(
      locationId,
      format(monthStart, 'yyyy-MM-dd'),
      format(monthEnd, 'yyyy-MM-dd')
    ),
    enabled: !!locationId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [calendarStart, calendarEnd]);

  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, CalendarBooking[]> = {};
    
    bookings.forEach(booking => {
      const dateKey = format(new Date(booking.startTime), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(booking);
    });

    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });

    return grouped;
  }, [bookings]);

  const handlePreviousMonth = useCallback(() => {
    setCurrentDate(prev => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => addMonths(prev, 1));
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  }, [onDateSelect]);

  const handleBookingClick = useCallback((booking: CalendarBooking, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Convert CalendarBooking to BookingData format for the edit modal
    const bookingData = {
      _id: booking._id,
      organizationId: '', // Will be filled by backend
      spaceId: booking.spaceId || '',
      contactId: booking.contact?._id,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status === 'confirmed' ? 'Confirmed' as const : 
              booking.status === 'pending' ? 'Pending' as const :
              booking.status === 'cancelled' ? 'Cancelled' as const : 'Pending' as const,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      purpose: booking.purpose,
      attendeeCount: booking.attendeeCount,
      specialRequests: booking.specialRequests,
      totalAmount: 0, // Will be filled by backend
      currency: 'INR',
      paymentStatus: 'Pending' as const,
      checkedIn: false,
      bookingReference: booking.bookingReference || '',
      notes: booking.notes,
      createdBy: '',
      updatedBy: '',
      createdAt: '',
      updatedAt: '',
      space: booking.space ? {
        ...booking.space,
        locationId: booking.space.locationId || '' // Ensure locationId is present
      } : undefined,
      contact: booking.contact
    };

    // Open edit modal instead of calling external handler
    openEditModal(bookingData);
    
    // Still call the external handler if provided (for backward compatibility)
    if (onBookingClick) {
      onBookingClick(booking);
    }
  }, [onBookingClick, openEditModal]);

  const handleCreateBooking = useCallback((date: Date, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onCreateBooking) {
      onCreateBooking(date);
    }
  }, [onCreateBooking]);

  if (isLoading) {
    return (
      <div className={`p-6 bg-white rounded-lg border border-gray-200 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading calendar...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`p-6 bg-red-50 rounded-lg border border-red-200 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-red-600">
            <CalendarIcon className="w-5 h-5" />
            <div>
              <p className="text-sm font-medium">Error loading calendar</p>
              <p className="text-xs">{(error as Error)?.message}</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1 text-sm text-red-700 hover:bg-red-100 rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayBookings = bookingsByDate[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                className={`
                  relative p-2 min-h-[100px] border border-gray-100 rounded-lg cursor-pointer transition-colors group
                  ${isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'}
                  ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
                  ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isCurrentDay ? 'text-blue-600' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {isCurrentMonth && onCreateBooking && (
                    <button
                      onClick={(e) => handleCreateBooking(day, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 rounded transition-all"
                      title="Create booking"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  {dayBookings.slice(0, 3).map(booking => (
                    <div
                      key={booking._id}
                      onClick={(e) => handleBookingClick(booking, e)}
                      className="relative p-1 rounded text-xs text-white cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: getStatusColor(booking.status) }}
                    >
                      <div className="truncate font-medium">
                        {booking.spaceName}
                      </div>
                      <div className="truncate">
                        {formatTime(booking.startTime)} - {booking.contactName || booking.customerName}
                      </div>
                    </div>
                  ))}
                  
                  {dayBookings.length > 3 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{dayBookings.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          
          {(() => {
            const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
            const selectedBookings = bookingsByDate[selectedDateKey] || [];
            
            if (selectedBookings.length === 0) {
              return (
                <p className="text-sm text-gray-500">No bookings for this date</p>
              );
            }
            
            return (
              <div className="space-y-2">
                {selectedBookings.map(booking => (
                  <div
                    key={booking._id}
                    onClick={() => onBookingClick && onBookingClick(booking)}
                    className="flex items-center justify-between p-2 bg-white rounded border cursor-pointer hover:border-gray-300 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.spaceName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)} • {booking.contactName || booking.customerName}
                      </div>
                    </div>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getStatusColor(booking.status) }}
                    ></div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Edit Booking Modal */}
      <EditBookingModal
        isOpen={editState.isOpen}
        booking={editState.booking}
        isLoading={editState.isLoading}
        error={editState.error}
        onClose={closeEditModal}
        onSave={updateBooking}
        onDelete={deleteBooking}
        onClearError={clearError}
      />
    </div>
  );
}

export function BookingCalendar(props: BookingCalendarProps) {
  return (
    <ErrorBoundary>
      <BookingCalendarCore {...props} />
    </ErrorBoundary>
  );
}

export default BookingCalendar;