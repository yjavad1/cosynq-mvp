import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Building, 
  Calendar, 
  Settings, 
  BarChart3,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { Location } from '@shared/types';
import { useSpaces } from '../../hooks/useSpaces';
import { useLocationBookingStats } from '../../hooks/useBookings';

interface EnhancedLocationCardProps {
  location: Location;
}

export function EnhancedLocationCard({ location }: EnhancedLocationCardProps) {
  // Get space count for this location
  const { data: spacesData } = useSpaces({ limit: 1000 });
  // Filter spaces for this location on the frontend
  const locationSpaces = spacesData?.spaces?.filter(space => {
    if (typeof space.locationId === 'object' && space.locationId && '_id' in space.locationId) {
      return (space.locationId as any)._id === location._id;
    }
    return space.locationId === location._id;
  }) || [];
  const spaceCount = locationSpaces.length;
  
  // Get booking statistics for this location
  const bookingStats = useLocationBookingStats(location._id);
  
  // Calculate setup progress based on available data
  const calculateSetupProgress = () => {
    let progress = 0;
    if (location.name) progress += 20;
    if (location.address) progress += 20;
    if (spaceCount > 0) progress += 40;
    if (bookingStats.totalBookings > 0) progress += 20;
    return Math.min(progress, 100);
  };
  
  const setupProgress = calculateSetupProgress();
  
  const getSetupStatus = () => {
    if (setupProgress >= 100) return { status: 'complete', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle };
    if (setupProgress >= 60) return { status: 'good', color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock };
    return { status: 'needs-attention', color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertCircle };
  };

  const setupStatus = getSetupStatus();
  const StatusIcon = setupStatus.icon;

  const getNextStep = () => {
    if (spaceCount === 0) return 'Configure your first space offering';
    if (setupProgress < 50) return 'Complete pricing setup';
    if (setupProgress < 75) return 'Add booking rules';
    if (setupProgress < 100) return 'Review and launch';
    return 'Setup complete!';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 group">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <Link to={`/locations/${location._id}`}>
                  <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                    {location.name}
                  </h3>
                </Link>
                <p className="text-sm text-gray-500 font-mono">{location.code}</p>
              </div>
            </div>
            
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <MapPin className="h-4 w-4 mr-1" />
              <span>
                {location.address.city}
                {'state' in location.address && location.address.state && `, ${location.address.state}`}
              </span>
            </div>

            {/* Setup Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <StatusIcon className={`h-4 w-4 ${setupStatus.color}`} />
                  <span className="text-sm font-medium text-gray-700">
                    Setup Progress
                  </span>
                </div>
                <span className={`text-sm font-semibold ${setupStatus.color}`}>
                  {setupProgress}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-700 ${
                    setupProgress >= 100 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                      : setupProgress >= 60 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                        : 'bg-gradient-to-r from-orange-500 to-amber-600'
                  }`}
                  style={{ width: `${setupProgress}%` }}
                />
              </div>
              
              <p className="text-xs text-gray-500">{getNextStep()}</p>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4 border-t border-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-50 rounded-lg mx-auto mb-2">
              <Building className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-lg font-semibold text-gray-900">{spaceCount}</div>
            <div className="text-xs text-gray-500">Spaces</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-lg mx-auto mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-lg font-semibold text-gray-900">{bookingStats.totalBookings}</div>
            <div className="text-xs text-gray-500">Bookings</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-green-50 rounded-lg mx-auto mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-lg font-semibold text-gray-900">₹{bookingStats.thisMonthRevenue.toLocaleString()}</div>
            <div className="text-xs text-gray-500">This Month</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-50 rounded-lg mx-auto mb-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-lg font-semibold text-gray-900">{bookingStats.upcomingBookings}</div>
            <div className="text-xs text-gray-500">Upcoming</div>
          </div>
        </div>

        {/* Today's Performance */}
        {(bookingStats.todayBookings > 0 || bookingStats.todayRevenue > 0) && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Today's Activity</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-blue-900">
                  {bookingStats.todayBookings} bookings • ₹{bookingStats.todayRevenue.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
        <div className="grid grid-cols-3 gap-2">
          <Link
            to={`/locations/${location._id}/spaces`}
            className="flex items-center justify-center px-3 py-2 text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-md transition-colors group"
          >
            <Settings className="h-3 w-3 mr-1" />
            Configure
          </Link>
          
          <Link
            to={`/locations/${location._id}/bookings`}
            className="flex items-center justify-center px-3 py-2 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors group"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Bookings
          </Link>
          
          <Link
            to={`/locations/${location._id}`}
            className="flex items-center justify-center px-3 py-2 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors group"
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}

export default EnhancedLocationCard;