import { useState } from 'react';
import { Search, Filter, MapPin, Users } from 'lucide-react';
import { AmenityType } from '@shared/types';
import { getAmenityDisplayName, getAmenityIcon } from '../../hooks/useLocations';

interface LocationFiltersProps {
  filters: {
    search?: string;
    isActive?: boolean;
    city?: string;
    state?: string;
    amenities?: string;
    minCapacity?: number;
    maxCapacity?: number;
  };
  onFiltersChange: (filters: LocationFiltersProps['filters']) => void;
}

const availableAmenities: AmenityType[] = [
  'WiFi', 'AC', 'Parking', 'Coffee', 'Security', 'Reception',
  'Kitchen', 'Printer', 'Scanner', 'Whiteboard', 'Projector',
  'Conference_Room', 'Phone_Booth', 'Lounge', 'Gym', 'Shower',
  'Bike_Storage', 'Mail_Service', 'Cleaning_Service', 'Catering',
  'Event_Space', 'Terrace', 'Garden', 'Handicap_Accessible'
];

export function LocationFilters({ filters, onFiltersChange }: LocationFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleInputChange = (key: keyof LocationFiltersProps['filters'], value: any) => {
    const newFilters = { ...filters };
    if (value === '' || value === undefined) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onFiltersChange(newFilters);
  };

  const handleAmenityToggle = (amenity: AmenityType) => {
    const currentAmenities = filters.amenities ? filters.amenities.split(',') : [];
    const isSelected = currentAmenities.includes(amenity);
    
    let newAmenities;
    if (isSelected) {
      newAmenities = currentAmenities.filter(a => a !== amenity);
    } else {
      newAmenities = [...currentAmenities, amenity];
    }
    
    handleInputChange('amenities', newAmenities.length > 0 ? newAmenities.join(',') : '');
  };

  const selectedAmenities = filters.amenities ? filters.amenities.split(',') : [];
  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof typeof filters] !== undefined && 
    filters[key as keyof typeof filters] !== ''
  );

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search locations..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={filters.search || ''}
              onChange={(e) => handleInputChange('search', e.target.value)}
            />
          </div>

          {/* Status */}
          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={filters.isActive?.toString() || ''}
            onChange={(e) => handleInputChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {/* City */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="City"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={filters.city || ''}
              onChange={(e) => handleInputChange('city', e.target.value)}
            />
          </div>

          {/* State */}
          <input
            type="text"
            placeholder="State"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={filters.state || ''}
            onChange={(e) => handleInputChange('state', e.target.value)}
          />
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <Filter className="h-4 w-4 mr-1" />
            Advanced Filters
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {Object.keys(filters).length}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={() => onFiltersChange({})}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {isAdvancedOpen && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            {/* Capacity Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Users className="inline h-4 w-4 mr-1" />
                Capacity Range
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                  <input
                    type="number"
                    placeholder="Min capacity"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={filters.minCapacity || ''}
                    onChange={(e) => handleInputChange('minCapacity', e.target.value ? parseInt(e.target.value) : undefined)}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                  <input
                    type="number"
                    placeholder="Max capacity"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={filters.maxCapacity || ''}
                    onChange={(e) => handleInputChange('maxCapacity', e.target.value ? parseInt(e.target.value) : undefined)}
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Amenities
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {availableAmenities.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      onClick={() => handleAmenityToggle(amenity)}
                      className={`
                        inline-flex items-center px-3 py-2 rounded-md text-sm font-medium border transition-colors duration-200
                        ${isSelected
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="mr-1 text-xs">{getAmenityIcon(amenity)}</span>
                      <span className="truncate">{getAmenityDisplayName(amenity)}</span>
                    </button>
                  );
                })}
              </div>
              {selectedAmenities.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    {selectedAmenities.length} amenit{selectedAmenities.length !== 1 ? 'ies' : 'y'} selected
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}