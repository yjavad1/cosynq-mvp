import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Building, 
  Calendar, 
  Settings, 
  BarChart3,
  Clock,
  DollarSign,
  ChevronRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Location, LocationStats } from '@shared/types';

interface DashboardLocationCardProps {
  location: Location | LocationStats['recentLocations'][0];
  spaceCount?: number;
  setupProgress?: number;
  monthlyRevenue?: number;
  totalBookings?: number;
}

export function DashboardLocationCard({ 
  location, 
  spaceCount = 0, 
  setupProgress = 0,
  monthlyRevenue = 0,
  totalBookings = 0
}: DashboardLocationCardProps) {
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

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-50 rounded-lg mx-auto mb-2">
              <Building className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-lg font-semibold text-gray-900">{spaceCount}</div>
            <div className="text-xs text-gray-500">Spaces</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-green-50 rounded-lg mx-auto mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-lg font-semibold text-gray-900">₹{monthlyRevenue.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Monthly</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-lg mx-auto mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-lg font-semibold text-gray-900">{totalBookings}</div>
            <div className="text-xs text-gray-500">Bookings</div>
          </div>
        </div>
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
          
          <button
            disabled
            className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-400 bg-gray-100 rounded-md cursor-not-allowed"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Bookings
          </button>
          
          <button
            disabled
            className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-400 bg-gray-100 rounded-md cursor-not-allowed"
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Analytics
          </button>
        </div>
        
        {setupProgress < 100 && (
          <Link
            to={`/locations/${location._id}/spaces`}
            className="mt-3 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-md shadow-sm hover:shadow-md transition-all group"
          >
            Complete Setup
            <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
    </div>
  );
}