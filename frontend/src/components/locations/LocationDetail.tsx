import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Users, 
  Building, 
  Star,
  Calendar,
  Activity,
  Globe,
  Camera
} from 'lucide-react';
import { Location } from '@shared/types';
import { getAmenityDisplayName, getAmenityIcon, useLocationHours } from '../../hooks/useLocations';

interface LocationDetailProps {
  location: Location;
  isOpen: boolean;
  onClose: () => void;
}

export function LocationDetail({ location, isOpen, onClose }: LocationDetailProps) {
  const { data: hoursData } = useLocationHours(location._id);

  const renderContact = (contact: any, index: number) => {
    const Icon = contact.type === 'phone' ? Phone : 
                contact.type === 'email' ? Mail : 
                contact.type === 'whatsapp' ? Phone : Phone;

    return (
      <div key={index} className="flex items-center space-x-3 py-2">
        <Icon className="h-5 w-5 text-gray-400" />
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">{contact.value}</span>
            {contact.isPrimary && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Primary
              </span>
            )}
          </div>
          {contact.label && <p className="text-xs text-gray-500">{contact.label}</p>}
        </div>
      </div>
    );
  };

  const renderOperatingHours = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
      <div className="space-y-2">
        {days.map((day, index) => {
          const hours = location.operatingHours.find(h => h.day === day);
          return (
            <div key={day} className="flex items-center justify-between py-1">
              <span className="text-sm font-medium text-gray-900">{dayLabels[index]}</span>
              <div className="text-sm text-gray-600">
                {hours?.isOpen ? (
                  <span>
                    {hours.openTime} - {hours.closeTime}
                    {hours.isHoliday && <span className="text-orange-600 ml-2">(Holiday)</span>}
                  </span>
                ) : (
                  <span className="text-red-600">Closed</span>
                )}
              </div>
            </div>
          );
        })}
        {hoursData && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Activity className={`h-4 w-4 ${hoursData.isOpen ? 'text-green-600' : 'text-red-600'}`} />
              <span className="text-sm font-medium">
                Currently {hoursData.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Local time: {hoursData.currentTime} ({location.timezone})
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">{location.name}</h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {location.code}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      location.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {location.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {location.description && (
                    <p className="text-gray-600">{location.description}</p>
                  )}
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Address */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                        Address
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <address className="not-italic text-gray-700">
                          {location.address.unitNumber && <p>{location.address.unitNumber}</p>}
                          {location.address.floor && <p>{location.address.floor}</p>}
                          <p>{location.address.street}</p>
                          <p>{location.address.city}, {location.address.state} {location.address.zipCode}</p>
                          <p>{location.address.country}</p>
                          {location.address.landmark && (
                            <p className="text-sm text-gray-500 mt-2 italic">
                              Near {location.address.landmark}
                            </p>
                          )}
                        </address>
                        {location.address.coordinates && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                              Coordinates: {location.address.coordinates.latitude}, {location.address.coordinates.longitude}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <Phone className="h-5 w-5 mr-2 text-gray-400" />
                        Contact Information
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {location.contacts.map((contact, index) => renderContact(contact, index))}
                      </div>
                    </div>

                    {/* Operating Hours */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-gray-400" />
                        Operating Hours
                        <span className="ml-2 text-sm text-gray-500">({location.timezone})</span>
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {renderOperatingHours()}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Capacity & Physical Info */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <Building className="h-5 w-5 mr-2 text-gray-400" />
                        Facility Information
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          {location.totalCapacity && (
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">Total Capacity</span>
                              </div>
                              <p className="text-lg font-semibold text-gray-900">
                                {location.totalCapacity.toLocaleString()}
                              </p>
                            </div>
                          )}
                          {location.totalFloors && (
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <Building className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">Floors</span>
                              </div>
                              <p className="text-lg font-semibold text-gray-900">
                                {location.totalFloors}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Booking Rules */}
                        {location.defaultBookingRules && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Booking Rules</h5>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Min. booking: {location.defaultBookingRules.minimumBookingDuration} minutes</p>
                              <p>Max. booking: {location.defaultBookingRules.maximumBookingDuration} minutes</p>
                              <p>Advance booking: {location.defaultBookingRules.advanceBookingLimit} days</p>
                              <p>Same-day booking: {location.allowSameDayBooking ? 'Allowed' : 'Not allowed'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Amenities */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <Star className="h-5 w-5 mr-2 text-gray-400" />
                        Amenities ({location.amenities.length})
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {location.amenities.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {location.amenities.map((amenity) => (
                              <div key={amenity} className="flex items-center space-x-2">
                                <span className="text-sm">{getAmenityIcon(amenity)}</span>
                                <span className="text-sm text-gray-700">
                                  {getAmenityDisplayName(amenity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No amenities listed</p>
                        )}
                      </div>
                    </div>

                    {/* Management */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-gray-400" />
                        Management
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {location.managerId && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-900">Manager</p>
                            <p className="text-sm text-gray-600">
                              {location.managerId.firstName} {location.managerId.lastName}
                            </p>
                          </div>
                        )}
                        {location.staff && location.staff.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-2">Staff ({location.staff.length})</p>
                            <div className="space-y-1">
                              {location.staff.slice(0, 3).map((staff, index) => (
                                <p key={index} className="text-sm text-gray-600">
                                  {staff.firstName} {staff.lastName}
                                </p>
                              ))}
                              {location.staff.length > 3 && (
                                <p className="text-sm text-gray-500">
                                  +{location.staff.length - 3} more
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    {location.stats && (
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <Activity className="h-5 w-5 mr-2 text-gray-400" />
                          Statistics
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-4">
                            {location.stats.totalSpaces && (
                              <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">{location.stats.totalSpaces}</p>
                                <p className="text-sm text-gray-600">Total Spaces</p>
                              </div>
                            )}
                            {location.stats.currentOccupancy !== undefined && (
                              <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">{location.stats.currentOccupancy}%</p>
                                <p className="text-sm text-gray-600">Current Occupancy</p>
                              </div>
                            )}
                            {location.stats.totalBookingsToday !== undefined && (
                              <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">{location.stats.totalBookingsToday}</p>
                                <p className="text-sm text-gray-600">Bookings Today</p>
                              </div>
                            )}
                            {location.stats.lastMaintenanceDate && (
                              <div className="text-center">
                                <p className="text-sm font-medium text-gray-900">Last Maintenance</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(location.stats.lastMaintenanceDate).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Virtual Tour & Images */}
                {(location.virtualTourUrl || (location.images && location.images.length > 0)) && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                      <Camera className="h-5 w-5 mr-2 text-gray-400" />
                      Media
                    </h4>
                    <div className="space-y-4">
                      {location.virtualTourUrl && (
                        <div>
                          <a
                            href={location.virtualTourUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            View Virtual Tour
                          </a>
                        </div>
                      )}
                      {location.images && location.images.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Images ({location.images.length})</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {location.images.slice(0, 4).map((image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={`${location.name} - Image ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div>
                      Created by {location.createdBy.firstName} {location.createdBy.lastName} on{' '}
                      {new Date(location.createdAt).toLocaleDateString()}
                    </div>
                    {location.updatedAt !== location.createdAt && (
                      <div>
                        Last updated {new Date(location.updatedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}