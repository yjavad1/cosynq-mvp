import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users, DollarSign, AlertTriangle, Clock, Plus, X, Eye } from 'lucide-react';
import { Breadcrumb } from '../components/navigation/Breadcrumb';
import { BookingCalendar } from '../components/bookings/BookingCalendar';
import { BookingForm } from '../components/bookings/BookingForm';
import { BookingDetailsModal } from '../components/bookings/BookingDetailsModal';
import { CancelBookingDialog } from '../components/bookings/CancelBookingDialog';
import { useLocation } from '../hooks/useLocations';
import { useBookings, useBookingStats, useDeleteBooking } from '../hooks/useBookings';
import { BookingData } from '../services/bookingApi';
import { View, Views } from 'react-big-calendar';

export default function BookingsPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<Date | undefined>();
  const [prefilledSpaceId, setPrefilledSpaceId] = useState<string | undefined>();
  
  // Booking details modal state
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [isBookingDetailsOpen, setIsBookingDetailsOpen] = useState(false);
  
  // Edit booking state
  const [isEditingBooking, setIsEditingBooking] = useState(false);
  
  // Cancel booking state
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<BookingData | null>(null);
  
  // Cancelled bookings panel state
  const [showCancelledPanel, setShowCancelledPanel] = useState(false);
  
  // Fetch location details
  const { data: location, isLoading: isLoadingLocation, error: locationError } = useLocation(locationId!);
  
  // Fetch booking statistics
  const { data: statsData, isLoading: isLoadingStats } = useBookingStats();
  
  // Fetch bookings for this location (filtered by spaces in the location)
  const { data: bookingsData, isLoading: isLoadingBookings } = useBookings({
    page: 1,
    limit: 1000, // Get all bookings for calendar display
    sortBy: 'startTime',
    sortOrder: 'asc'
  });

  // Mutations
  const deleteBookingMutation = useDeleteBooking();
  
  // Filter cancelled bookings
  const cancelledBookings = useMemo(() => {
    return bookingsData?.bookings?.filter(booking => booking.status === 'Cancelled') || [];
  }, [bookingsData]);
  
  // Handle booking event clicks
  const handleBookingClick = (booking: BookingData) => {
    setSelectedBooking(booking);
    setIsBookingDetailsOpen(true);
  };

  // Handle calendar slot clicks for creating new bookings
  const handleSlotClick = (slotInfo: { start: Date; end: Date; action: 'select' | 'click' | 'doubleClick' }) => {
    setPrefilledDate(slotInfo.start);
    setPrefilledSpaceId(undefined); // Let user select space
    setIsBookingFormOpen(true);
  };

  // Handle create booking button click
  const handleCreateBooking = () => {
    setPrefilledDate(undefined);
    setPrefilledSpaceId(undefined);
    setIsBookingFormOpen(true);
  };

  // Handle booking form success
  const handleBookingFormSuccess = () => {
    setIsBookingFormOpen(false);
    setIsEditingBooking(false);
    setSelectedBooking(null);
    setPrefilledDate(undefined);
    setPrefilledSpaceId(undefined);
    // The bookings query will automatically refresh due to React Query cache invalidation
  };
  
  // Handle edit booking
  const handleEditBooking = (booking: BookingData) => {
    setSelectedBooking(booking);
    setIsBookingDetailsOpen(false);
    setIsEditingBooking(true);
    setIsBookingFormOpen(true);
  };
  
  // Handle cancel booking request
  const handleCancelBookingRequest = (booking: BookingData) => {
    setBookingToCancel(booking);
    setIsBookingDetailsOpen(false);
    setIsCancelDialogOpen(true);
  };
  
  // Handle confirm cancel booking
  const handleConfirmCancelBooking = async (booking: BookingData, reason: string) => {
    try {
      await deleteBookingMutation.mutateAsync({ 
        id: booking._id, 
        cancelReason: reason 
      });
      setIsCancelDialogOpen(false);
      setBookingToCancel(null);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      // Error will be handled by the mutation error handling
    }
  };
  
  // Handle close booking details
  const handleCloseBookingDetails = () => {
    setIsBookingDetailsOpen(false);
    setSelectedBooking(null);
  };
  
  // Handle close cancel dialog
  const handleCloseCancelDialog = () => {
    setIsCancelDialogOpen(false);
    setBookingToCancel(null);
  };

  // Loading state
  if (isLoadingLocation || isLoadingStats || isLoadingBookings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (locationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <div className="text-red-500 text-lg font-medium mb-2">
            Error loading location
          </div>
          <p className="text-gray-600 mb-4">
            {locationError instanceof Error ? locationError.message : 'Failed to load location data'}
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Location Not Found</h1>
          <p className="text-gray-600 mb-4">The requested location could not be found.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link
                to={`/locations/${locationId}`}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Location
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      {location.name} • {location.address.city}, {location.address.state}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Cancelled Bookings Toggle */}
              {cancelledBookings.length > 0 && (
                <button
                  onClick={() => setShowCancelledPanel(!showCancelledPanel)}
                  className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md transition-colors ${
                    showCancelledPanel
                      ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelled ({cancelledBookings.length})
                </button>
              )}
              
              {/* Create Booking Button */}
              <button
                onClick={handleCreateBooking}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Booking
              </button>

              {/* View Toggle */}
              <div className="hidden sm:flex items-center space-x-2">
                {(['month', 'week', 'day'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setCurrentView(view)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      currentView === view
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb />
        
        {/* Booking Statistics */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Bookings
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statsData?.totalBookings || bookingsData?.pagination.totalItems || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Today's Bookings
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statsData?.todayBookings || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      This Week
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statsData?.thisWeekBookings || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Revenue
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${bookingsData?.bookings?.reduce((sum, b) => sum + b.totalAmount, 0)?.toLocaleString() || '0'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile View Toggle */}
        <div className="sm:hidden mb-6">
          <div className="flex items-center justify-center space-x-2">
            {(['month', 'week', 'day'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentView === view
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Booking Calendar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Booking Calendar - {location.name}
            </h2>
            <p className="text-sm text-gray-600">
              View and manage all bookings for this location. Click on any booking to see details, or click an empty time slot to create a new booking.
            </p>
          </div>

          <BookingCalendar
            locationId={locationId}
            onEventClick={handleBookingClick}
            onSlotClick={handleSlotClick}
            viewMode={currentView}
            className="booking-calendar-container"
          />
        </div>

        {/* Cancelled Bookings Panel */}
        {showCancelledPanel && cancelledBookings.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-red-200">
            <div className="px-6 py-4 border-b border-red-100 bg-red-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <X className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-medium text-red-900">
                    Cancelled Bookings ({cancelledBookings.length})
                  </h3>
                </div>
                <button
                  onClick={() => setShowCancelledPanel(false)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-1 text-sm text-red-700">
                These bookings have been cancelled and are not shown on the calendar.
              </p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {cancelledBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-red-200 hover:bg-red-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <X className="h-4 w-4 text-red-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {booking.customerName || 
                                 (typeof booking.contactId === 'object' && booking.contactId 
                                   ? `${booking.contactId.firstName} ${booking.contactId.lastName}` 
                                   : 'Unknown Customer')}
                              </p>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Cancelled
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(booking.startTime).toLocaleDateString()} • {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {typeof booking.spaceId === 'object' && booking.spaceId 
                                  ? booking.spaceId.name 
                                  : 'Unknown Space'}
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {booking.attendeeCount} attendees
                              </div>
                            </div>
                            {booking.cancelReason && (
                              <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                <strong>Reason:</strong> {booking.cancelReason}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <span className="text-sm font-medium text-gray-900">
                          {booking.bookingReference}
                        </span>
                        <button
                          onClick={() => handleBookingClick(booking)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {cancelledBookings.length === 0 && (
                <div className="text-center py-8">
                  <X className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No cancelled bookings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    There are currently no cancelled bookings to display.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingBookings && (!bookingsData?.bookings || bookingsData.bookings.length === 0) && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                This location doesn't have any bookings yet. Once customers start making reservations, 
                they'll appear on the calendar above.
              </p>
              <div className="space-y-2 sm:space-y-0 sm:space-x-3 sm:flex sm:justify-center">
                <Link
                  to={`/locations/${locationId}/spaces`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Configure Spaces
                </Link>
                <Link
                  to={`/locations/${locationId}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Back to Location
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {statsData && statsData.bookingsByStatus && statsData.bookingsByStatus.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Status Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {statsData.bookingsByStatus.map((stat) => (
                <div key={stat.status} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stat.count}</div>
                  <div className="text-sm text-gray-600">{stat.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking Form Modal */}
      {isBookingFormOpen && locationId && (
        <BookingForm
          locationId={locationId}
          isOpen={isBookingFormOpen}
          onClose={() => {
            setIsBookingFormOpen(false);
            setIsEditingBooking(false);
            setSelectedBooking(null);
          }}
          onSuccess={handleBookingFormSuccess}
          prefilledSpaceId={prefilledSpaceId}
          prefilledDate={prefilledDate}
          isEditing={isEditingBooking}
          existingBooking={isEditingBooking && selectedBooking ? selectedBooking : undefined}
        />
      )}
      
      {/* Booking Details Modal */}
      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={isBookingDetailsOpen}
        onClose={handleCloseBookingDetails}
        onEdit={handleEditBooking}
        onCancel={handleCancelBookingRequest}
        isLoading={deleteBookingMutation.isPending}
      />
      
      {/* Cancel Booking Confirmation Dialog */}
      <CancelBookingDialog
        booking={bookingToCancel}
        isOpen={isCancelDialogOpen}
        onClose={handleCloseCancelDialog}
        onConfirm={handleConfirmCancelBooking}
        isLoading={deleteBookingMutation.isPending}
      />
    </div>
  );
}