import { MapPin, Building, TrendingUp, Star } from 'lucide-react';
import { LocationStats as LocationStatsType, AmenityType } from '@shared/types';
import { getAmenityDisplayName, getAmenityIcon } from '../../hooks/useLocations';

interface LocationStatsProps {
  data?: LocationStatsType;
  isLoading: boolean;
}

export function LocationStats({ data, isLoading }: LocationStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="animate-pulse">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Show empty state if no locations exist
  if (data.totalLocations === 0) {
    return (
      <div className="text-center py-12">
        <Building className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No locations yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first location.
        </p>
      </div>
    );
  }

  // Handle backend response mismatches and safe array access
  const locationsByCity = data.locationsByCity || [];
  const topAmenities = data.topAmenities || [];
  const recentLocations = data.recentLocations || [];

  const stats = [
    {
      name: 'Total Locations',
      value: data.totalLocations.toLocaleString(),
      icon: MapPin,
      color: 'bg-blue-500',
      change: data.totalLocations > 0 ? '+0%' : '0%',
      changeType: 'neutral' as const,
    },
    {
      name: 'Active Locations',
      value: data.activeLocations.toLocaleString(),
      icon: Building,
      color: 'bg-green-500',
      change: data.totalLocations > 0 ? `${Math.round((data.activeLocations / data.totalLocations) * 100)}%` : '0%',
      changeType: data.activeLocations === data.totalLocations ? 'positive' as const : data.activeLocations === 0 ? 'negative' as const : 'neutral' as const,
    },
    {
      name: 'Top City',
      value: locationsByCity.length > 0 ? locationsByCity[0].city : 'None',
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: locationsByCity.length > 0 ? `${locationsByCity[0].count} locations` : '0 locations',
      changeType: 'neutral' as const,
    },
    {
      name: 'Top Amenity',
      value: topAmenities.length > 0 ? getAmenityDisplayName(topAmenities[0].amenity as AmenityType) : 'None',
      icon: Star,
      color: 'bg-orange-500',
      change: topAmenities.length > 0 ? `${topAmenities[0].count} locations` : '0 locations',
      changeType: 'neutral' as const,
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${stat.color} rounded-md flex items-center justify-center`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' :
                        stat.changeType === 'negative' ? 'text-red-600' :
                        'text-gray-500'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Cities */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Locations by City</h3>
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          {locationsByCity.length > 0 ? (
            <div className="space-y-3">
              {locationsByCity.slice(0, 5).map((cityData, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900">{cityData.city}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {cityData.count} location{cityData.count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No location data available</p>
          )}
        </div>

        {/* Top Amenities */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Popular Amenities</h3>
            <Star className="h-5 w-5 text-gray-400" />
          </div>
          {topAmenities.length > 0 ? (
            <div className="space-y-3">
              {topAmenities.slice(0, 5).map((amenityData, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm mr-2">{getAmenityIcon(amenityData.amenity as AmenityType)}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {getAmenityDisplayName(amenityData.amenity as AmenityType)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {amenityData.count} location{amenityData.count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No amenity data available</p>
          )}
        </div>
      </div>

      {/* Recent Locations */}
      {recentLocations.length > 0 && (
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recently Added Locations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentLocations.map((location) => (
              <div key={location._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {location.name}
                  </h4>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {location.code}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2">{location.address.city}</p>
                <p className="text-xs text-gray-400">
                  Added {new Date(location.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}