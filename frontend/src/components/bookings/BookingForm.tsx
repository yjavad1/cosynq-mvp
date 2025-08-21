import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { format, addDays } from 'date-fns';
import { X, Calendar, Clock, Users, MapPin, AlertCircle, Search } from 'lucide-react';
import { useContacts } from '../../hooks/useContacts';
import { useSpaces } from '../../hooks/useSpaces';
import { useCreateBooking } from '../../hooks/useBookings';
import { CreateBookingData } from '../../services/bookingApi';
import SimpleTimeSelector from './SimpleTimeSelector';

interface BookingFormProps {
  locationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefilledSpaceId?: string;
  prefilledDate?: Date;
}

interface BookingFormData {
  contactId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  spaceId: string;
  date: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  purpose?: string;
  specialRequests?: string;
  notes?: string;
}

export function BookingForm({ 
  locationId: _locationId, // Available but not currently used for filtering
  isOpen, 
  onClose, 
  onSuccess, 
  prefilledSpaceId, 
  prefilledDate 
}: BookingFormProps) {
  // Track re-renders
  console.log('🔄 BookingForm render');
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [timeSlotValid, setTimeSlotValid] = useState(false);
  const [timeSlotError, setTimeSlotError] = useState<string>('');
  const [timeSlotWarnings, setTimeSlotWarnings] = useState<string[]>([]);

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset
  } = useForm<BookingFormData>({
    defaultValues: {
      spaceId: prefilledSpaceId || '',
      date: prefilledDate ? format(prefilledDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      startTime: '',
      endTime: '',
      attendeeCount: 1,
      purpose: '',
      specialRequests: '',
      notes: ''
    }
  });

  // Watch form values for real-time validation
  const watchFields = useMemo(() => ['spaceId', 'date', 'startTime', 'endTime'] as const, []);
  const watchedValues = watch(watchFields);
  const [spaceId, date, startTime, endTime] = watchedValues;

  // Data fetching
  const { data: contactsData, isLoading: contactsLoading } = useContacts({
    search: contactSearch,
    limit: 50
  });

  const spacesParams = useMemo(() => ({
    limit: 100
  }), []);

  const { data: spacesData } = useSpaces(spacesParams);

  // *** FILTER SPACES BY LOCATION AND ACTIVE STATUS ***
  const filteredSpaces = useMemo(() => {
    if (!spacesData?.spaces) return [];
    
    return spacesData.spaces.filter((space: any) => {
      // Only show active spaces
      if (!space.isActive) return false;
      
      // If locationId is provided, filter by location
      if (_locationId && space.locationId !== _locationId) return false;
      
      return true;
    });
  }, [spacesData?.spaces, _locationId]);

  // Debug removed to prevent infinite re-renders

  // Mutations
  const createBookingMutation = useCreateBooking();

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!contactsData?.contacts) return [];
    if (!contactSearch.trim()) return contactsData.contacts;
    
    return contactsData.contacts.filter((contact: any) =>
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(contactSearch.toLowerCase()) ||
      contact.company?.toLowerCase().includes(contactSearch.toLowerCase()) ||
      contact.email.toLowerCase().includes(contactSearch.toLowerCase())
    );
  }, [contactsData?.contacts, contactSearch]);

  // Calculate duration in minutes for display
  function calculateDuration(start: string, end: string): number {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes;
  }

  // Handle time slot selection from SimpleTimeSelector
  const handleTimeSlotSelect = useCallback((selectedStartTime: string, selectedEndTime: string) => {
    setValue('startTime', selectedStartTime);
    setValue('endTime', selectedEndTime);
  }, [setValue]);

  // Handle time slot validation changes
  const handleTimeSlotValidation = useCallback((isValid: boolean, error?: string, warnings?: string[]) => {
    setTimeSlotValid(isValid);
    setTimeSlotError(error || '');
    setTimeSlotWarnings(warnings || []);
  }, []);

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
    console.log('=== BOOKING FORM SUBMISSION STARTED ===');
    console.log('Form data received:', data);
    console.log('Current timeSlotValid:', timeSlotValid);
    
    try {
      // Validate time slot selection before submission
      if (!data.startTime || !data.endTime) {
        console.log('❌ Basic validation failed:', {
          timeSlotValid,
          startTime: data.startTime,
          endTime: data.endTime
        });
        setTimeSlotError('Please select both start and end times');
        return;
      }

      if (!timeSlotValid) {
        console.log('❌ Time slot validation failed:', {
          timeSlotValid,
          startTime: data.startTime,
          endTime: data.endTime
        });
        setTimeSlotError('Please select a valid time slot');
        return;
      }

      console.log('✅ Time slot validation passed');

      // Prepare booking data - create dates properly
      const startDateTime = new Date(`${data.date}T${data.startTime}:00`);
      const endDateTime = new Date(`${data.date}T${data.endTime}:00`);

      console.log('DateTime conversion:', {
        originalDate: data.date,
        originalStartTime: data.startTime,
        originalEndTime: data.endTime,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        startDateTimeLocal: startDateTime.toString(),
        endDateTimeLocal: endDateTime.toString(),
        isStartTimeInFuture: startDateTime > new Date(),
        isEndTimeAfterStart: endDateTime > startDateTime,
        durationMinutes: (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60)
      });

      // Prepare booking data - handle contact vs customer data properly
      const hasContact = data.contactId && data.contactId.trim() !== '';
      
      console.log('Customer/Contact validation:', {
        hasContact,
        contactId: data.contactId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        selectedContact
      });

      // Validate required customer data if no contact
      if (!hasContact) {
        if (!data.customerName || data.customerName.trim() === '') {
          console.log('❌ Missing customer name');
          setTimeSlotError('Customer name is required when no contact is selected');
          return;
        }
        if (!data.customerEmail || data.customerEmail.trim() === '') {
          console.log('❌ Missing customer email');
          setTimeSlotError('Customer email is required when no contact is selected');
          return;
        }
      }
      
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
        currency: 'INR'
      };

      console.log('📤 Prepared booking data:', bookingData);
      console.log('🔄 Calling createBookingMutation...');

      const result = await createBookingMutation.mutateAsync(bookingData);
      
      console.log('✅ Booking creation successful:', result);

      // Reset form and close
      reset();
      setSelectedContact(null);
      setContactSearch('');
      setTimeSlotValid(false);
      setTimeSlotError('');
      setTimeSlotWarnings([]);
      onSuccess();
      
      console.log('✅ Form reset and success callback called');
    } catch (error) {
      console.error('❌ Error creating booking:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  };

  // Get selected space details
  const selectedSpace = useMemo(() => {
    return filteredSpaces.find((space: any) => space._id === spaceId);
  }, [filteredSpaces, spaceId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={(e) => {
            console.log('🚀 Form submit event triggered!');
            handleSubmit(onSubmit)(e);
          }}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Create New Booking</h3>
                    <p className="text-sm text-gray-600">Schedule a space reservation</p>
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
                              filteredContacts.map((contact: any) => (
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
                      disabled={filteredSpaces.length === 0}
                    >
                      <option value="">
                        {filteredSpaces.length === 0 
                          ? "No spaces available for this location" 
                          : "Select a space..."
                        }
                      </option>
                      {filteredSpaces.map((space: any) => (
                        <option key={space._id} value={space._id}>
                          {space.name} - {space.type} (Capacity: {space.capacity})
                        </option>
                      ))}
                    </select>
                    {errors.spaceId && (
                      <p className="mt-1 text-sm text-red-600">{errors.spaceId.message}</p>
                    )}
                    
                    {/* Warning when no spaces are available */}
                    {filteredSpaces.length === 0 && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-yellow-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">
                            No active spaces found for this location. Please add spaces in Space Configuration.
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {selectedSpace && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{selectedSpace.type}</span>
                          <span>•</span>
                          <Users className="h-4 w-4" />
                          <span>Capacity: {selectedSpace.capacity}</span>
                        </div>
                        {selectedSpace.description && (
                          <p className="mt-1 text-sm text-gray-600">{selectedSpace.description}</p>
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
                  <SimpleTimeSelector
                    spaceId={spaceId}
                    date={date}
                    selectedStartTime={startTime}
                    selectedEndTime={endTime}
                    onTimeSlotSelect={handleTimeSlotSelect}
                    onValidationChange={handleTimeSlotValidation}
                  />

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


                  {/* Time Slot Validation Status */}
                  {timeSlotError && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center space-x-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{timeSlotError}</span>
                      </div>
                    </div>
                  )}

                  {timeSlotWarnings.length > 0 && (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      {timeSlotWarnings.map((warning, index) => (
                        <div key={index} className="flex items-center space-x-2 text-yellow-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">{warning}</span>
                        </div>
                      ))}
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
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Booking'}
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