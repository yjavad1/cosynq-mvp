import React, { useState, useEffect } from 'react';
import { BookingCalendar } from './BookingCalendar';
import { LocationSelector } from '../locations/LocationSelector';
import { useLocations } from '../../hooks/useLocations';
import { Building2, Calendar, AlertCircle } from 'lucide-react';

interface LocationBookingCalendarProps {
  className?: string;
}

export const LocationBookingCalendar: React.FC<LocationBookingCalendarProps> = ({ 
  className = '' 
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const { data: locationsData, isLoading: locationsLoading } = useLocations();
  const locations = locationsData?.locations || [];

  // Auto-select first location if only one exists
  useEffect(() => {
    if (locations.length === 1 && !selectedLocationId) {
      setSelectedLocationId(locations[0]._id);
    }
  }, [locations, selectedLocationId]);

  // Handle location selection
  const handleLocationSelect = (locationId: string) => {
    console.log('📍 Location selected:', locationId);
    setSelectedLocationId(locationId);
  };

  // Loading state
  if (locationsLoading) {
    return (
      <div className={`${className} flex items-center justify-center h-96`}>
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading locations...</span>
        </div>
      </div>
    );
  }

  // No locations state
  if (locations.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center h-96 bg-white rounded-lg border border-gray-200`}>
        <div className="text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Locations Found</h3>
          <p className="text-gray-600">
            You need to create at least one location before you can manage bookings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Location Selection */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Booking Calendar</h1>
              <p className="text-gray-600">Manage bookings for your locations</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <LocationSelector
              selectedLocationId={selectedLocationId}
              onLocationSelect={handleLocationSelect}
              placeholder="Select Location"
            />
            
            {selectedLocationId && (
              <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                ✓ Location Selected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location Selection Prompt */}
      {!selectedLocationId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            <div>
              <h3 className="text-lg font-medium text-yellow-900">Select a Location</h3>
              <p className="text-yellow-700">
                Please select a location above to view and manage bookings for that specific location.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Booking Calendar */}
      {selectedLocationId && (
        <BookingCalendar
          locationId={selectedLocationId}
          key={selectedLocationId} // Force re-render when location changes
          className="booking-calendar-location-specific"
        />
      )}

      {/* Location Statistics */}
      {selectedLocationId && (
        <div className="text-center text-sm text-gray-500 bg-gray-50 py-3 rounded-lg">
          Showing bookings for{' '}
          <span className="font-medium text-gray-900">
            {locations.find(loc => loc._id === selectedLocationId)?.name}
          </span>
        </div>
      )}
    </div>
  );
};