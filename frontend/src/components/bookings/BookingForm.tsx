import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { format, addDays } from 'date-fns';
import { X, Calendar, Clock, Users, MapPin, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { useContacts } from '../../hooks/useContacts';
import { useSpaces, useSpace } from '../../hooks/useSpaces';
import { useCreateBooking, useUpdateBooking, useSpaceAvailability } from '../../hooks/useBookings';
// import { useBookingAvailabilityCheck, formatConflictMessage } from '../../hooks/useBookingAvailability';
// import { ConflictResult } from '../../services/bookingAvailability';
import { CreateBookingData, BookingData } from '../../services/bookingApi';

interface BookingFormProps {
  locationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefilledSpaceId?: string;
  prefilledDate?: Date;
  // Edit mode props
  isEditing?: boolean;
  existingBooking?: BookingData;
}

interface BookingFormData {
  contactId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  spaceId: string;
  resourceUnitId?: string;
  date: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  purpose?: string;
  specialRequests?: string;
  notes?: string;
}

// Enhanced Availability Display Component - Temporarily disabled
// function EnhancedAvailabilityDisplay({ availability }: { availability: ConflictResult }) {
//   return (
//     <div className="space-y-3">
//       {/* Implementation temporarily commented out for deployment */}
//     </div>
//   );
// }

export function BookingForm({ 
  locationId: _locationId, // Available but not currently used for filtering
  isOpen, 
  onClose, 
  onSuccess, 
  prefilledSpaceId, 
  prefilledDate,
  isEditing = false,
  existingBooking
}: BookingFormProps) {
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [availabilityChecking, setAvailabilityChecking] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string>('');

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset
  } = useForm<BookingFormData>({
    defaultValues: isEditing && existingBooking ? {
      contactId: (typeof existingBooking.contactId === 'object' ? existingBooking.contactId?._id : existingBooking.contactId) || '',
      customerName: existingBooking.customerName || '',
      customerEmail: existingBooking.customerEmail || '',
      customerPhone: existingBooking.customerPhone || '',
      spaceId: (typeof existingBooking.spaceId === 'object' ? existingBooking.spaceId?._id : existingBooking.spaceId) || '',
      date: format(new Date(existingBooking.startTime), 'yyyy-MM-dd'),
      startTime: format(new Date(existingBooking.startTime), 'HH:mm'),
      endTime: format(new Date(existingBooking.endTime), 'HH:mm'),
      attendeeCount: existingBooking.attendeeCount,
      purpose: existingBooking.purpose || '',
      specialRequests: existingBooking.specialRequests || '',
      notes: existingBooking.notes || ''
    } : {
      spaceId: prefilledSpaceId || '',
      date: prefilledDate ? format(prefilledDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      attendeeCount: 1,
      purpose: '',
      specialRequests: '',
      notes: ''
    }
  });

  // Watch form values for real-time validation
  const watchedValues = watch(['spaceId', 'resourceUnitId', 'date', 'startTime', 'endTime']);
  const [spaceId, , date, startTime, endTime] = watchedValues;

  // Data fetching
  const { data: contactsData, isLoading: contactsLoading } = useContacts({
    search: contactSearch,
    limit: 50
  });

  const { data: spacesData } = useSpaces({
    // Filter spaces by location if needed (spaces are already location-scoped in API)
    limit: 100
  });

  // Fetch individual space data for fresh pooled units and capacity info
  const { data: freshSpaceData } = useSpace(spaceId);

  // Enhanced availability checking with validation
  // const availabilityRequest = useMemo(() => {
  //   if (!spaceId || !date || !startTime || !endTime) return null;
    
  //   const startDateTime = new Date(`${date}T${startTime}:00`);
  //   const endDateTime = new Date(`${date}T${endTime}:00`);
    
  //   return {
  //     spaceId,
  //     startTime: startDateTime,
  //     endTime: endDateTime,
  //     excludeBookingId: isEditing ? existingBooking?._id : undefined,
  //     checkBusinessRules: true
  //   };
  // }, [spaceId, date, startTime, endTime, isEditing, existingBooking?._id]);

  // const { 
  //   data: enhancedAvailability, 
  //   isLoading: enhancedAvailabilityLoading 
  // } = useBookingAvailabilityCheck(availabilityRequest);

  // Fallback to legacy availability check
  const { 
    data: availabilityData, 
    isLoading: availabilityLoading 
  } = useSpaceAvailability(
    spaceId,
    date && spaceId ? date : undefined,
    startTime && endTime ? calculateDuration(startTime, endTime) : undefined
  );

  // Mutations
  const createBookingMutation = useCreateBooking();
  const updateBookingMutation = useUpdateBooking();

  // Handle edit mode initialization
  useEffect(() => {
    if (isEditing && existingBooking && isOpen) {
      // Set selected contact if editing and booking has a contact
      if (existingBooking.contactId && typeof existingBooking.contactId === 'object') {
        setSelectedContact(existingBooking.contactId);
      }
    }
  }, [isEditing, existingBooking, isOpen]);

  // Reset resourceUnitId when spaceId changes
  useEffect(() => {
    if (spaceId) {
      setValue('resourceUnitId', undefined);
    }
  }, [spaceId, setValue]);

  // Generate time slots (30-minute intervals from 8 AM to 8 PM)
  const timeSlots = useMemo(() => {
    const slots = [];
    const start = new Date();
    start.setHours(8, 0, 0, 0);
    const end = new Date();
    end.setHours(20, 0, 0, 0);
    
    while (start < end) {
      slots.push(format(start, 'HH:mm'));
      start.setMinutes(start.getMinutes() + 30);
    }
    return slots;
  }, []);

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!contactsData?.contacts) return [];
    if (!contactSearch.trim()) return contactsData.contacts;
    
    return contactsData.contacts.filter(contact =>
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(contactSearch.toLowerCase()) ||
      contact.company?.toLowerCase().includes(contactSearch.toLowerCase()) ||
      contact.email.toLowerCase().includes(contactSearch.toLowerCase())
    );
  }, [contactsData?.contacts, contactSearch]);

  // Calculate duration in minutes
  function calculateDuration(start: string, end: string): number {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes;
  }

  // Validate time selection
  useEffect(() => {
    if (startTime && endTime) {
      const duration = calculateDuration(startTime, endTime);
      if (duration <= 0) {
        setAvailabilityError('End time must be after start time');
      } else if (duration < 30) {
        setAvailabilityError('Minimum booking duration is 30 minutes');
      } else if (duration > 480) {
        setAvailabilityError('Maximum booking duration is 8 hours');
      } else {
        setAvailabilityError('');
      }
    }
  }, [startTime, endTime]);

  // Check availability when form values change
  useEffect(() => {
    if (spaceId && date && startTime && endTime && !availabilityError) {
      setAvailabilityChecking(true);
      // Availability checking is handled by the query hook
      setTimeout(() => setAvailabilityChecking(false), 1000);
    }
  }, [spaceId, date, startTime, endTime, availabilityError]);

  // Handle contact selection
  const handleContactSelect = (contact: any) => {
    setSelectedContact(contact);
    setValue('contactId', contact._id);
    setValue('customerName', `${contact.firstName} ${contact.lastName}`);
    setValue('customerEmail', contact.email);
    setValue('customerPhone', contact.phone || '');
    setContactSearch('');
  };

  // Handle form submission
  const onSubmit = async (data: BookingFormData) => {
    try {
      // Enhanced validation before submission
      // const availabilityCheck = enhancedAvailability as ConflictResult | undefined;
      // if (availabilityCheck?.hasConflict) {
      //   const conflictMessages = formatConflictMessage(availabilityCheck);
      //   setAvailabilityError(conflictMessages[0] || 'Selected time slot is not available');
      //   return;
      // } else 
      if (!availabilityData?.isAvailable) {
        setAvailabilityError('Selected time slot is not available');
        return;
      }

      // Prepare booking data
      const startDateTime = new Date(`${data.date}T${data.startTime}:00`);
      const endDateTime = new Date(`${data.date}T${data.endTime}:00`);

      // Prepare booking data - handle contact vs customer data properly
      const hasContact = data.contactId && data.contactId.trim() !== '';
      
      const bookingData: CreateBookingData = {
        spaceId: data.spaceId,
        contactId: hasContact ? data.contactId : undefined,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        // Only include customer details if no contact is selected
        customerName: !hasContact ? data.customerName : undefined,
        customerEmail: !hasContact ? data.customerEmail : undefined,
        customerPhone: !hasContact ? data.customerPhone : undefined,
        attendeeCount: data.attendeeCount,
        purpose: data.purpose || undefined,
        specialRequests: data.specialRequests || undefined,
        notes: data.notes || undefined,
        totalAmount: 0, // Calculate based on space rates
        currency: 'USD'
      };

      if (isEditing && existingBooking) {
        // Update existing booking
        await updateBookingMutation.mutateAsync({
          id: existingBooking._id,
          bookingData: bookingData as any // UpdateBookingData has similar structure
        });
      } else {
        // Create new booking
        await createBookingMutation.mutateAsync(bookingData);
      }

      // Reset form and close
      reset();
      setSelectedContact(null);
      setContactSearch('');
      onSuccess();
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  // Get selected space details - use fresh data if available, fallback to list data
  const selectedSpace = freshSpaceData || spacesData?.spaces?.find(space => space._id === spaceId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {isEditing ? 'Edit Booking' : 'Create New Booking'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {isEditing ? 'Update booking details' : 'Schedule a space reservation'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Basic Information */}
                <div className="space-y-6">
                  {/* Contact Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Selection
                    </label>
                    
                    {selectedContact ? (
                      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {selectedContact.firstName} {selectedContact.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{selectedContact.company}</p>
                            <p className="text-sm text-gray-600">{selectedContact.email}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedContact(null);
                              setValue('contactId', '');
                              setValue('customerName', '');
                              setValue('customerEmail', '');
                              setValue('customerPhone', '');
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search contacts..."
                            value={contactSearch}
                            onChange={(e) => setContactSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {contactSearch.length > 0 && (
                          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                            {contactsLoading ? (
                              <div className="p-4 text-center text-gray-500">Searching...</div>
                            ) : filteredContacts.length > 0 ? (
                              filteredContacts.map((contact) => (
                                <button
                                  key={contact._id}
                                  type="button"
                                  onClick={() => handleContactSelect(contact)}
                                  className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                >
                                  <p className="font-medium text-gray-900">
                                    {contact.firstName} {contact.lastName}
                                  </p>
                                  <p className="text-sm text-gray-600">{contact.company}</p>
                                  <p className="text-sm text-gray-500">{contact.email}</p>
                                </button>
                              ))
                            ) : (
                              <div className="p-4 text-center text-gray-500">No contacts found</div>
                            )}
                          </div>
                        )}

                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-2">
                            Search for an existing contact or enter customer details below
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Customer Information (when no contact selected) */}
                  {!selectedContact && (
                    <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">Customer Information</h4>
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Required</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Since no contact was selected, please enter customer details for this booking.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name *</label>
                          <input
                            {...register('customerName', { required: 'Customer name is required' })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Full name"
                          />
                          {errors.customerName && (
                            <p className="mt-1 text-sm text-red-600">{errors.customerName.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email *</label>
                          <input
                            {...register('customerEmail', { 
                              required: 'Email is required',
                              pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Invalid email address'
                              }
                            })}
                            type="email"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="email@example.com"
                          />
                          {errors.customerEmail && (
                            <p className="mt-1 text-sm text-red-600">{errors.customerEmail.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                          {...register('customerPhone')}
                          type="tel"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                  )}

                  {/* Space Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Space *</label>
                    <select
                      {...register('spaceId', { required: 'Space selection is required' })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select a space...</option>
                      {spacesData?.spaces?.map((space) => (
                        <option key={space._id} value={space._id}>
                          {space.name} - {space.type} (Capacity: {space.capacity})
                        </option>
                      ))}
                    </select>
                    {errors.spaceId && (
                      <p className="mt-1 text-sm text-red-600">{errors.spaceId.message}</p>
                    )}
                    
                    {selectedSpace && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{selectedSpace.type}</span>
                          <span>•</span>
                          <Users className="h-4 w-4" />
                          <span>Capacity: {selectedSpace.capacity}</span>
                          {selectedSpace.capacity && selectedSpace.capacity > 1 && (
                            <span className="text-blue-600 font-medium">• Multi-capacity space</span>
                          )}
                        </div>
                        {selectedSpace.description && (
                          <p className="mt-1 text-sm text-gray-600">{selectedSpace.description}</p>
                        )}
                      </div>
                    )}

                    {/* Resource Unit Selection */}
                    {selectedSpace?.hasPooledUnits && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Unit *
                        </label>
                        <select
                          {...register('resourceUnitId', { 
                            required: selectedSpace?.hasPooledUnits ? 'Unit selection is required' : false 
                          })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="">Select a unit...</option>
                          {selectedSpace.resourceUnits?.filter(unit => unit.isActive).map((unit) => (
                            <option key={unit._id} value={unit._id}>
                              {unit.name} ({unit.unitNumber})
                            </option>
                          ))}
                        </select>
                        {errors.resourceUnitId && (
                          <p className="mt-1 text-sm text-red-600">{errors.resourceUnitId.message}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Attendee Count */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Number of Attendees *</label>
                    <input
                      {...register('attendeeCount', { 
                        required: 'Attendee count is required',
                        min: { value: 1, message: 'At least 1 attendee required' },
                        max: { value: selectedSpace?.capacity || 100, message: `Cannot exceed space capacity of ${selectedSpace?.capacity || 100}` }
                      })}
                      type="number"
                      min="1"
                      max={selectedSpace?.capacity || 100}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.attendeeCount && (
                      <p className="mt-1 text-sm text-red-600">{errors.attendeeCount.message}</p>
                    )}
                  </div>
                </div>

                {/* Right Column - Date & Time */}
                <div className="space-y-6">
                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date *</label>
                    <input
                      {...register('date', { required: 'Date is required' })}
                      type="date"
                      min={format(new Date(), 'yyyy-MM-dd')}
                      max={format(addDays(new Date(), 90), 'yyyy-MM-dd')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                    )}
                  </div>

                  {/* Time Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Time *</label>
                      <select
                        {...register('startTime', { required: 'Start time is required' })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        {timeSlots.map((time) => (
                          <option key={time} value={time}>
                            {format(new Date(`2024-01-01T${time}:00`), 'h:mm a')}
                          </option>
                        ))}
                      </select>
                      {errors.startTime && (
                        <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Time *</label>
                      <select
                        {...register('endTime', { required: 'End time is required' })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        {timeSlots.map((time) => (
                          <option key={time} value={time}>
                            {format(new Date(`2024-01-01T${time}:00`), 'h:mm a')}
                          </option>
                        ))}
                      </select>
                      {errors.endTime && (
                        <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Duration Display */}
                  {startTime && endTime && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Duration: {Math.floor(calculateDuration(startTime, endTime) / 60)}h {calculateDuration(startTime, endTime) % 60}m
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Availability Status */}
                  {spaceId && date && startTime && endTime && (
                    <div className="space-y-3">
                      {/* Primary Availability Check */}
                      <div className="p-4 border rounded-lg">
                        {availabilityLoading || availabilityChecking ? (
                          <div className="flex items-center space-x-2 text-gray-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                            <span className="text-sm">Checking availability...</span>
                          </div>
                        ) : availabilityError ? (
                          <div className="flex items-center space-x-2 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">{availabilityError}</span>
                          </div>
                        ) : availabilityData?.isAvailable ? (
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Time slot is available</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">Time slot is not available</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Purpose & Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purpose</label>
                    <input
                      {...register('purpose')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Meeting, presentation, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Special Requests</label>
                    <textarea
                      {...register('specialRequests')}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Any special setup requirements..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Internal Notes</label>
                    <textarea
                      {...register('notes')}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Private notes for your team..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={
                  isSubmitting || 
                  !availabilityData?.isAvailable || 
                  !!availabilityError ||
                  availabilityLoading
                }
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Booking' : 'Create Booking')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BookingForm;