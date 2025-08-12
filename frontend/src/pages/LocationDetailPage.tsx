import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Settings, BarChart3, Calendar, DollarSign, Users, TrendingUp, Clock } from 'lucide-react';
import { Breadcrumb } from '../components/navigation/Breadcrumb';
import { useLocation } from '../hooks/useLocations';
import { useLocationBookingStats } from '../hooks/useBookings';
import { useSpaces } from '../hooks/useSpaces';

export default function LocationDetailPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const { data: location, isLoading } = useLocation(locationId!);
  
  // Get booking statistics for this location
  const bookingStats = useLocationBookingStats(locationId);
  
  // Get all spaces (they will be filtered by location on the backend based on user's organization)
  const { data: spacesData } = useSpaces({ limit: 1000 });
  
  // Filter spaces for this location on the frontend
  const locationSpaces = spacesData?.spaces?.filter(space => {
    if (typeof space.locationId === 'object' && space.locationId && '_id' in space.locationId) {
      return (space.locationId as any)._id === locationId;
    }
    return space.locationId === locationId;
  }) || [];
  const spaceCount = locationSpaces.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Location Not Found</h1>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
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
                to="/dashboard"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{location.name}</h1>
                <p className="text-sm text-gray-600">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  {location.address.city}, {location.address.state}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb />
        
        {/* Booking Analytics Dashboard */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Booking Analytics</h2>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{bookingStats.totalBookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{bookingStats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">₹{bookingStats.thisMonthRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-gray-900">{bookingStats.upcomingBookings}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Today's Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Today's Activity
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bookings</span>
                  <span className="font-semibold text-gray-900">{bookingStats.todayBookings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="font-semibold text-gray-900">₹{bookingStats.todayRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg. Booking Value</span>
                  <span className="font-semibold text-gray-900">₹{bookingStats.averageBookingValue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Space Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-600" />
                Space Overview
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Spaces</span>
                  <span className="font-semibold text-gray-900">{spaceCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">This Week</span>
                  <span className="font-semibold text-gray-900">{bookingStats.thisWeekBookings} bookings</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Week Revenue</span>
                  <span className="font-semibold text-gray-900">₹{bookingStats.thisWeekRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Location Management Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Configure Spaces */}
          <Link
            to={`/locations/${locationId}/spaces`}
            className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-105"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                <Settings className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                Configure Spaces
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Set up workspace offerings, pricing, and capacity for this location.
              </p>
              <div className="mt-3 text-sm font-medium text-blue-600">
                Manage space types →
              </div>
            </div>
          </Link>

          {/* Bookings Management */}
          <Link
            to={`/locations/${locationId}/bookings`}
            className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-105"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                <Calendar className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                View Bookings
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                View and manage space reservations with the booking calendar.
              </p>
              <div className="mt-3 text-sm font-medium text-blue-600">
                Open calendar →
              </div>
            </div>
          </Link>

          {/* Analytics (Coming Soon) */}
          <div className="group relative bg-white p-6 rounded-lg shadow-sm opacity-60">
            <div>
              <span className="rounded-lg inline-flex p-3 bg-gray-50 text-gray-400 ring-4 ring-white">
                <BarChart3 className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-400">
                Analytics
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Coming soon - View performance metrics and insights.
              </p>
            </div>
          </div>
        </div>

        {/* Location Details */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Address</h3>
              <p className="text-gray-900">
                {location.address.street}<br />
                {location.address.city}, {location.address.state} {location.address.zipCode}<br />
                {location.address.country}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Code</h3>
              <p className="text-gray-900 font-mono">{location.code}</p>
              
              <h3 className="text-sm font-medium text-gray-500 mb-2 mt-4">Status</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                location.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {location.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          
          {location.description && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <p className="text-gray-900">{location.description}</p>
            </div>
          )}

          {location.amenities && location.amenities.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {location.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {amenity.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}