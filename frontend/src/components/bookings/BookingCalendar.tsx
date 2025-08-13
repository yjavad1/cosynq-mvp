import { useState, useMemo, useCallback, useEffect } from 'react';
import { Calendar, Views, View, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { 
  useBookings, 
  transformBookingsForCalendar, 
  getBookingStatusColor,
  getPaymentStatusColor,
  // formatBookingTimeRange,
  // calculateBookingDuration 
} from '../../hooks/useBookings';
import { BookingData, BookingStatus } from '../../services/bookingApi';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './BookingCalendar.css';

// Configure date-fns localizer for react-big-calendar
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 0 }), // Sunday = 0
  getDay,
  locales: {}, // Use default locale
});

interface BookingCalendarProps {
  locationId?: string;
  spaceId?: string;
  onEventClick?: (booking: BookingData) => void;
  onSlotClick?: (slotInfo: { start: Date; end: Date; action: 'select' | 'click' | 'doubleClick' }) => void;
  viewMode?: View;
  className?: string;
  showCancelled?: boolean; // Control visibility of cancelled bookings
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    booking: BookingData;
    status: BookingStatus;
    paymentStatus: string;
    spaceName?: string;
    customerName: string;
    attendeeCount: number;
    totalAmount: number;
    currency: string;
    bookingReference: string;
  };
}

export function BookingCalendar({ 
  locationId: _locationId, // Available but not currently used for filtering
  spaceId, 
  onEventClick, 
  onSlotClick,
  viewMode = Views.MONTH,
  className = '',
  showCancelled = false
}: BookingCalendarProps) {
  const [currentView, setCurrentView] = useState<View>(viewMode);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [internalShowCancelled, setInternalShowCancelled] = useState(showCancelled);

  // Calculate date range for current view
  const dateRange = useMemo(() => {
    const startDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd');
    const endDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), 'yyyy-MM-dd');
    console.log('📅 Calendar fetching bookings for range:', { startDate, endDate, spaceId });
    return { startDate, endDate };
  }, [currentDate]);

  // Fetch bookings with filters
  const { 
    data: bookingsData, 
    isLoading, 
    isError, 
    error,
    refetch: refetchBookings
  } = useBookings({
    spaceId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    sortBy: 'startTime',
    sortOrder: 'asc'
  });

  // Add window event listener for manual calendar refresh
  useEffect(() => {
    const handleBookingCreated = () => {
      console.log('📅 Calendar received booking created event - force refreshing...');
      refetchBookings();
    };

    window.addEventListener('bookingCreated', handleBookingCreated);
    return () => window.removeEventListener('bookingCreated', handleBookingCreated);
  }, [refetchBookings]);

  // Transform bookings for calendar display
  const calendarEvents = useMemo(() => {
    if (!bookingsData?.bookings) {
      console.log('📅 Calendar: No bookings data available');
      return [];
    }
    console.log(`📅 Calendar: Transforming ${bookingsData.bookings.length} bookings for display`);
    console.log('📅 Calendar bookings:', bookingsData.bookings.map(b => ({
      id: b._id,
      ref: b.bookingReference,
      start: b.startTime,
      end: b.endTime,
      customer: b.customerName,
      status: b.status
    })));
    const transformedEvents = transformBookingsForCalendar(bookingsData.bookings, internalShowCancelled);
    console.log(`📅 Calendar: Filtered to ${transformedEvents.length} events (showCancelled: ${internalShowCancelled})`);
    return transformedEvents;
  }, [bookingsData, internalShowCancelled]);

  // Custom event styling based on booking status
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const { status, paymentStatus } = event.resource;
    const paymentStatusTyped = paymentStatus as 'Pending' | 'Paid' | 'Refunded' | 'Failed';
    
    return {
      style: {
        backgroundColor: getBookingStatusColor(status),
        borderColor: getPaymentStatusColor(paymentStatusTyped),
        borderWidth: '2px',
        borderStyle: 'solid',
        color: 'white',
        fontWeight: '500',
        fontSize: '12px',
        borderRadius: '4px',
        padding: '2px 4px',
      }
    };
  }, []);

  // Custom event component for better display
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const { customerName, spaceName, attendeeCount } = event.resource;
    
    return (
      <div className="booking-event">
        <div className="font-medium text-xs truncate">
          {customerName}
        </div>
        {spaceName && (
          <div className="text-xs opacity-90 truncate">
            {spaceName}
          </div>
        )}
        <div className="text-xs opacity-80 flex items-center">
          <Users className="w-3 h-3 mr-1" />
          {attendeeCount}
        </div>
      </div>
    );
  };

  // Handle event clicks
  const handleEventClick = (event: CalendarEvent) => {
    if (onEventClick) {
      onEventClick(event.resource.booking);
    }
  };

  // Handle slot clicks for creating new bookings
  const handleSlotClick = (slotInfo: { start: Date; end: Date; action: 'select' | 'click' | 'doubleClick' }) => {
    // Only allow clicks on future slots
    if (slotInfo.start < new Date()) {
      return;
    }

    if (onSlotClick) {
      onSlotClick(slotInfo);
    }
  };

  // Custom toolbar component
  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('PREV')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous period"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => onNavigate('TODAY')}
            className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => onNavigate('NEXT')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next period"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* View Buttons */}
        {['month', 'week', 'day'].map((view) => (
          <button
            key={view}
            onClick={() => onView(view)}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              currentView === view
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
        
        {/* Show Cancelled Toggle */}
        <div className="border-l border-gray-200 pl-2 ml-2">
          <button
            onClick={() => setInternalShowCancelled(!internalShowCancelled)}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center space-x-1 ${
              internalShowCancelled
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title={internalShowCancelled ? 'Hide cancelled bookings' : 'Show cancelled bookings'}
          >
            <span>{internalShowCancelled ? 'Hide' : 'Show'} Cancelled</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Custom time gutter for business hours
  const customTimeGutterFormat = (date: Date) => formatInTimeZone(date, 'Asia/Kolkata', 'h:mm a');

  // Loading state
  if (isLoading) {
    return (
      <div className={`booking-calendar ${className}`}>
        <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading bookings...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={`booking-calendar ${className}`}>
        <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Bookings</h3>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'Failed to load booking data'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`booking-calendar ${className}`}>
      {/* Calendar Statistics */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">
                {bookingsData?.bookings?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">
                {bookingsData?.bookings?.filter(b => b.status === 'Confirmed').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {bookingsData?.bookings?.filter(b => b.status === 'Pending').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${bookingsData?.bookings?.reduce((sum, b) => sum + b.totalAmount, 0)?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Status Legend */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Booking Status Legend</h3>
        <div className="flex flex-wrap gap-4">
          {[
            { status: 'Pending', color: '#f59e0b', label: 'Pending Confirmation' },
            { status: 'Confirmed', color: '#10b981', label: 'Confirmed' },
            { status: 'Cancelled', color: '#ef4444', label: 'Cancelled' },
            { status: 'Completed', color: '#6b7280', label: 'Completed' },
            { status: 'No Show', color: '#dc2626', label: 'No Show' },
          ].map(({ status, color, label }) => (
            <div key={status} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-sm text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Component */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          onSelectEvent={handleEventClick}
          onSelectSlot={handleSlotClick}
          selectable={true}
          eventPropGetter={eventStyleGetter}
          components={{
            toolbar: CustomToolbar,
            event: EventComponent,
          }}
          formats={{
            timeGutterFormat: customTimeGutterFormat,
          }}
          min={new Date(2024, 0, 1, 8, 0, 0)} // 8:00 AM
          max={new Date(2024, 0, 1, 20, 0, 0)} // 8:00 PM
          step={30}
          timeslots={2}
          showMultiDayTimes={true}
          popup={true}
          popupOffset={30}
          dayLayoutAlgorithm="no-overlap"
        />
      </div>

      {/* Empty State */}
      {(!bookingsData?.bookings || bookingsData.bookings.length === 0) && !isLoading && (
        <div className="mt-8 text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
          <p className="text-gray-600 mb-4">
            {spaceId 
              ? 'No bookings found for this space in the selected time period.' 
              : 'No bookings found in the selected time period.'
            }
          </p>
        </div>
      )}
    </div>
  );
}

export default BookingCalendar;