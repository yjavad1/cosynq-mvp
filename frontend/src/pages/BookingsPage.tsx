import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users, DollarSign, AlertTriangle, Clock, Plus } from 'lucide-react';
import { Breadcrumb } from '../components/navigation/Breadcrumb';
import { BookingCalendar } from '../components/bookings/BookingCalendar';
import { BookingForm } from '../components/bookings/BookingForm';
import { useLocation } from '../hooks/useLocations';
import { useBookings, useBookingStats } from '../hooks/useBookings';
import { View, Views } from 'react-big-calendar';

export default function BookingsPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<Date | undefined>();
  const [prefilledSpaceId, setPrefilledSpaceId] = useState<string | undefined>();
  
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

  // Handle booking event clicks
  const handleBookingClick = (booking: any) => {
    console.log('Booking clicked:', booking);
    // TODO: Open booking detail modal or navigate to booking detail page
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
    setPrefilledDate(undefined);
    setPrefilledSpaceId(undefined);
    // The bookings query will automatically refresh due to React Query cache invalidation
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
          onClose={() => setIsBookingFormOpen(false)}
          onSuccess={handleBookingFormSuccess}
          prefilledSpaceId={prefilledSpaceId}
          prefilledDate={prefilledDate}
        />
      )}
    </div>
  );
}