import { useState } from 'react';
import { 
  MapPin, 
  Users, 
  Clock, 
  Phone, 
  Mail, 
  Building, 
  Eye, 
  Edit, 
  MoreVertical,
  Calendar,
  Activity
} from 'lucide-react';
import { Location } from '@shared/types';
import { getAmenityDisplayName, getAmenityIcon, useDeleteLocation } from '../../hooks/useLocations';
import { LocationForm } from './LocationForm';

interface LocationCardProps {
  location: Location;
  onClick?: () => void;
}

export function LocationCard({ location, onClick }: LocationCardProps) {
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const deleteLocation = useDeleteLocation();

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${location.name}"? This action cannot be undone.`)) {
      try {
        await deleteLocation.mutateAsync(location._id);
      } catch (error) {
        console.error('Failed to delete location:', error);
      }
    }
    setIsMenuOpen(false);
  };

  const handleEditSuccess = () => {
    setIsEditFormOpen(false);
    setIsMenuOpen(false);
  };

  const primaryContact = location.contacts.find(c => c.isPrimary) || location.contacts[0];
  const totalAmenities = location.amenities.length;
  const currentTime = new Date();
  const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentTime.getDay()] as any;
  const todayHours = location.operatingHours.find(h => h.day === currentDay);
  const isOpen = todayHours?.isOpen || false;

  return (
    <>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {location.name}
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {location.code}
              </span>
            </div>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick?.();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Eye className="h-4 w-4 mr-3" />
                    View Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditFormOpen(true);
                    }}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Edit className="h-4 w-4 mr-3" />
                    Edit Location
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    <Calendar className="h-4 w-4 mr-3" />
                    Delete Location
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Status and Hours */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                location.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <Activity className="h-3 w-3 mr-1" />
                {location.isActive ? 'Active' : 'Inactive'}
              </span>
              {todayHours && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isOpen 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Clock className="h-3 w-3 mr-1" />
                  {isOpen && todayHours.openTime && todayHours.closeTime
                    ? `${todayHours.openTime} - ${todayHours.closeTime}`
                    : 'Closed'
                  }
                </span>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start space-x-2 mb-4">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-600">
              <p>{location.address.street}</p>
              <p>{location.address.city}, {location.address.state} {location.address.zipCode}</p>
              {location.address.landmark && (
                <p className="text-xs text-gray-500 italic">Near {location.address.landmark}</p>
              )}
            </div>
          </div>

          {/* Contact Info */}
          {primaryContact && (
            <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
              {primaryContact.type === 'phone' ? (
                <div className="flex items-center space-x-1">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{primaryContact.value}</span>
                </div>
              ) : primaryContact.type === 'email' ? (
                <div className="flex items-center space-x-1">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{primaryContact.value}</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Capacity and Floors */}
          <div className="flex items-center justify-between mb-4 text-sm">
            {location.totalCapacity && (
              <div className="flex items-center space-x-1 text-gray-600">
                <Users className="h-4 w-4 text-gray-400" />
                <span>Capacity: {location.totalCapacity.toLocaleString()}</span>
              </div>
            )}
            {location.totalFloors && (
              <div className="flex items-center space-x-1 text-gray-600">
                <Building className="h-4 w-4 text-gray-400" />
                <span>{location.totalFloors} floor{location.totalFloors !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Amenities Preview */}
          {totalAmenities > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-2">
                {location.amenities.slice(0, 4).map((amenity) => (
                  <span
                    key={amenity}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                    title={getAmenityDisplayName(amenity)}
                  >
                    <span className="mr-1 text-xs">{getAmenityIcon(amenity)}</span>
                    {getAmenityDisplayName(amenity)}
                  </span>
                ))}
                {totalAmenities > 4 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    +{totalAmenities - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          {location.stats && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {location.stats.totalSpaces || 0}
                </div>
                <div className="text-xs text-gray-500">Total Spaces</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {location.stats.currentOccupancy || 0}%
                </div>
                <div className="text-xs text-gray-500">Occupancy</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Created {new Date(location.createdAt).toLocaleDateString()}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Eye className="h-3 w-3 mr-1" />
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Edit Location Modal */}
      {isEditFormOpen && (
        <LocationForm
          isOpen={isEditFormOpen}
          onClose={() => setIsEditFormOpen(false)}
          onSuccess={handleEditSuccess}
          location={location}
        />
      )}
    </>
  );
}