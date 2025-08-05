import { Space } from '@shared/types';
import { MapPin, Users, Clock, DollarSign, Settings, Eye, Edit, Trash2 } from 'lucide-react';

interface SpaceCardProps {
  space: Space;
  onView: (space: Space) => void;
  onEdit: (space: Space) => void;
  onDelete: (space: Space) => void;
}

export function SpaceCard({ space, onView, onEdit, onDelete }: SpaceCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Occupied':
        return 'bg-red-100 text-red-800';
      case 'Maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'Out of Service':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Hot Desk':
        return 'bg-blue-100 text-blue-800';
      case 'Meeting Room':
        return 'bg-purple-100 text-purple-800';
      case 'Private Office':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRate = () => {
    if (space.rates.hourly) {
      return `$${space.rates.hourly}/hr`;
    }
    if (space.rates.daily) {
      return `$${space.rates.daily}/day`;
    }
    if (space.rates.weekly) {
      return `$${space.rates.weekly}/week`;
    }
    if (space.rates.monthly) {
      return `$${space.rates.monthly}/month`;
    }
    return 'Free';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{space.name}</h3>
            {space.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{space.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-1 ml-4">
            <button
              onClick={() => onView(space)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEdit(space)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
              title="Edit Space"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(space)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
              title="Delete Space"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Type and Status Badges */}
        <div className="flex items-center space-x-2 mb-4">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(space.type)}`}>
            {space.type}
          </span>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(space.status)}`}>
            {space.status}
          </span>
          {!space.isActive && (
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
              Inactive
            </span>
          )}
        </div>

        {/* Location */}
        {(space.floor || space.room) && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            {space.floor && `Floor ${space.floor}`}
            {space.floor && space.room && ' • '}
            {space.room && `Room ${space.room}`}
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            <span>{space.capacity} people</span>
          </div>
          <div className="flex items-center text-gray-600">
            <DollarSign className="h-4 w-4 mr-2" />
            <span>{formatRate()}</span>
          </div>
          {space.area && (
            <div className="flex items-center text-gray-600">
              <Settings className="h-4 w-4 mr-2" />
              <span>{space.area} sq ft</span>
            </div>
          )}
          <div className="flex items-center text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span>{space.minimumBookingDuration}min min</span>
          </div>
        </div>

        {/* Amenities */}
        {space.amenities.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Amenities</h4>
            <div className="flex flex-wrap gap-1">
              {space.amenities.slice(0, 3).map((amenity, index) => (
                <span
                  key={index}
                  className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md"
                >
                  {amenity}
                </span>
              ))}
              {space.amenities.length > 3 && (
                <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-md">
                  +{space.amenities.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}