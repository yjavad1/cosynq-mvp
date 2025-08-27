import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { useLocations } from '../../hooks/useLocations';

interface LocationSelectorProps {
  selectedLocationId: string;
  onLocationSelect: (locationId: string) => void;
  className?: string;
  placeholder?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedLocationId,
  onLocationSelect,
  className = '',
  placeholder = 'Select Location'
}) => {
  const { data: locationsData, isLoading } = useLocations();
  const locations = locationsData?.locations || [];

  const selectedLocation = locations.find(loc => loc._id === selectedLocationId);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <MapPin className="w-4 h-4" />
        <span>Loading locations...</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <select
          value={selectedLocationId}
          onChange={(e) => onLocationSelect(e.target.value)}
          className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
        >
          <option value="">{placeholder}</option>
          {locations.map((location) => (
            <option key={location._id} value={location._id}>
              {location.name} ({location.code})
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
        
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <MapPin className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      
      {selectedLocation && (
        <div className="mt-1 text-xs text-gray-600">
          {selectedLocation.address?.city}, {selectedLocation.address?.state}
        </div>
      )}
    </div>
  );
};