import { useState } from 'react';
import { 
  Plus, 
  MapPin, 
  Edit, 
  Trash2, 
  Building, 
  Users, 
  Clock,
  MoreVertical,
  Eye
} from 'lucide-react';
import { Location } from '@shared/types';
import { useLocations, useDeleteLocation } from '../../hooks/useLocations';
import { LocationForm } from './LocationForm';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface LocationsManagementProps {
  organizationId?: string;
  showHeader?: boolean;
  maxDisplayed?: number;
}

interface LocationCardProps {
  location: Location;
  onEdit: (location: Location) => void;
  onDelete: (locationId: string) => void;
  onView?: (location: Location) => void;
}

function LocationCard({ location, onEdit, onDelete, onView }: LocationCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteLocation = useDeleteLocation();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${location.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteLocation.mutateAsync(location._id);
      onDelete(location._id);
    } catch (error) {
      console.error('Failed to delete location:', error);
      alert('Failed to delete location. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const formatAddress = (address: Location['address']) => {
    return `${address.city}, ${address.state}${address.zipCode ? ` ${address.zipCode}` : ''}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(location.isActive)}`}>
                {location.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-mono">{location.code}</p>
            <p className="text-sm text-gray-500">{formatAddress(location.address)}</p>
          </div>

          {/* Actions Menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
              <MoreVertical className="h-4 w-4" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  {onView && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => onView(location)}
                          className={`${
                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                          } flex items-center px-4 py-2 text-sm w-full text-left`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </button>
                      )}
                    </Menu.Item>
                  )}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => onEdit(location)}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } flex items-center px-4 py-2 text-sm w-full text-left`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Location
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className={`${
                          active ? 'bg-red-50 text-red-900' : 'text-red-700'
                        } flex items-center px-4 py-2 text-sm w-full text-left disabled:opacity-50`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? 'Deleting...' : 'Delete Location'}
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>

        {/* Details */}
        <div className="space-y-3">
          {location.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{location.description}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {location.totalCapacity && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{location.totalCapacity} capacity</span>
              </div>
            )}
            {location.totalFloors && (
              <div className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                <span>{location.totalFloors} floor{location.totalFloors > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Contacts */}
          {location.contacts && location.contacts.length > 0 && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Contact: </span>
              {location.contacts
                .filter(c => c.isPrimary)
                .slice(0, 1)
                .map(contact => `${contact.value} (${contact.type})`)
                .join(', ') || 
              location.contacts.slice(0, 1).map(contact => `${contact.value} (${contact.type})`).join(', ')
              }
            </div>
          )}

          {/* Amenities */}
          {location.amenities && location.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {location.amenities.slice(0, 3).map((amenity) => (
                <span
                  key={amenity}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {amenity.replace('_', ' ')}
                </span>
              ))}
              {location.amenities.length > 3 && (
                <span className="text-xs text-gray-500">+{location.amenities.length - 3} more</span>
              )}
            </div>
          )}

          {/* Operating Hours */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>
              {location.operatingHours?.find(h => h.isOpen)?.openTime || '9:00'} - {' '}
              {location.operatingHours?.find(h => h.isOpen)?.closeTime || '18:00'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LocationsManagement({ 
  showHeader = true, 
  maxDisplayed 
}: LocationsManagementProps) {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  
  const { data: locationsData, isLoading, error } = useLocations({
    limit: maxDisplayed || 50
  });

  const locations = locationsData?.locations || [];

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
  };

  const handleDeleteLocation = (locationId: string) => {
    // Location will be removed from cache by the mutation
    console.log('Location deleted:', locationId);
  };

  const handleFormSuccess = () => {
    setIsCreateFormOpen(false);
    setEditingLocation(null);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-red-800">Error loading locations</h3>
        <p className="text-sm text-red-700 mt-1">
          Failed to load your locations. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Locations Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your workspace locations and settings
            </p>
          </div>
          <button
            onClick={() => setIsCreateFormOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Locations Grid */}
      {!isLoading && (
        <>
          {locations.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No locations yet</h3>
              <p className="text-gray-500 mb-6">
                Get started by adding your first workspace location.
              </p>
              <button
                onClick={() => setIsCreateFormOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Location
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {locations.slice(0, maxDisplayed).map((location) => (
                  <LocationCard
                    key={location._id}
                    location={location}
                    onEdit={handleEditLocation}
                    onDelete={handleDeleteLocation}
                  />
                ))}
              </div>

              {maxDisplayed && locations.length > maxDisplayed && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Showing {maxDisplayed} of {locations.length} locations
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Create Location Modal */}
      {isCreateFormOpen && (
        <LocationForm
          isOpen={isCreateFormOpen}
          onClose={() => setIsCreateFormOpen(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Edit Location Modal */}
      {editingLocation && (
        <LocationForm
          isOpen={!!editingLocation}
          onClose={() => setEditingLocation(null)}
          onSuccess={handleFormSuccess}
          location={editingLocation}
        />
      )}
    </div>
  );
}