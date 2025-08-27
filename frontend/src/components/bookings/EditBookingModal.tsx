import { useState, useMemo, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format, addDays, parseISO } from 'date-fns';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  AlertCircle, 
  Save,
  DollarSign,
  Trash2
} from 'lucide-react';
import { useSpaces } from '../../hooks/useSpaces';
import { BookingData, UpdateBookingData, BookingStatus } from '../../services/bookingApi';
import SimpleTimeSelector from './SimpleTimeSelector';

interface EditBookingModalProps {
  isOpen: boolean;
  booking: BookingData | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (bookingData: UpdateBookingData) => Promise<void>;
  onDelete: (cancelReason?: string) => Promise<void>;
  onClearError: () => void;
}

interface EditBookingFormData {
  date: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  purpose?: string;
  specialRequests?: string;
  notes?: string;
  status: BookingStatus;
}

export function EditBookingModal({
  isOpen,
  booking,
  isLoading,
  error,
  onClose,
  onSave,
  onDelete,
  onClearError
}: EditBookingModalProps) {
  const [timeSlotValid, setTimeSlotValid] = useState(false);
  const [timeSlotError, setTimeSlotError] = useState<string>('');
  const [timeSlotWarnings, setTimeSlotWarnings] = useState<string[]>([]);
  const [hasTimeChanges, setHasTimeChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  // Form setup with booking data
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset
  } = useForm<EditBookingFormData>({
    defaultValues: {
      date: '',
      startTime: '',
      endTime: '',
      attendeeCount: 1,
      purpose: '',
      specialRequests: '',
      notes: '',
      status: 'Pending'
    }
  });

  // Watch form values for validation and pricing warnings
  const watchFields = useMemo(() => ['date', 'startTime', 'endTime', 'attendeeCount'] as const, []);
  const watchedValues = watch(watchFields);
  const [date, startTime, endTime, attendeeCount] = watchedValues;

  // Get spaces data for space info display
  const spacesParams = useMemo(() => ({ limit: 100 }), []);
  const { data: spacesData } = useSpaces(spacesParams);

  // Find the current space
  const currentSpace = useMemo(() => {
    if (!spacesData?.spaces || !booking?.spaceId) return null;
    return spacesData.spaces.find((space: any) => space._id === booking.spaceId);
  }, [spacesData?.spaces, booking?.spaceId]);

  // Reset form when booking changes
  useEffect(() => {
    if (booking && isOpen) {
      const startDate = parseISO(booking.startTime);
      const bookingDate = format(startDate, 'yyyy-MM-dd');
      const bookingStartTime = format(startDate, 'HH:mm');
      const bookingEndTime = format(parseISO(booking.endTime), 'HH:mm');

      reset({
        date: bookingDate,
        startTime: bookingStartTime,
        endTime: bookingEndTime,
        attendeeCount: booking.attendeeCount,
        purpose: booking.purpose || '',
        specialRequests: booking.specialRequests || '',
        notes: booking.notes || '',
        status: booking.status
      });

      // Reset validation state
      setTimeSlotValid(true);
      setTimeSlotError('');
      setTimeSlotWarnings([]);
      setHasTimeChanges(false);
    }
  }, [booking, isOpen, reset]);

  // Check for time changes to show pricing warning
  useEffect(() => {
    if (!booking) return;

    const originalStartTime = format(parseISO(booking.startTime), 'HH:mm');
    const originalEndTime = format(parseISO(booking.endTime), 'HH:mm');
    const originalDate = format(parseISO(booking.startTime), 'yyyy-MM-dd');

    const hasChanges = 
      date !== originalDate || 
      startTime !== originalStartTime || 
      endTime !== originalEndTime;

    setHasTimeChanges(hasChanges);
  }, [booking, date, startTime, endTime]);

  // Clear error when modal opens or fields change
  useEffect(() => {
    if (error && isDirty) {
      onClearError();
    }
  }, [error, isDirty, onClearError]);

  // Handle time slot selection from SimpleTimeSelector
  const handleTimeSlotSelect = useCallback((selectedStartTime: string, selectedEndTime: string) => {
    setValue('startTime', selectedStartTime);
    setValue('endTime', selectedEndTime);
  }, [setValue]);

  // Handle time slot validation changes
  const handleTimeSlotValidation = useCallback((isValid: boolean, validationError?: string, warnings?: string[]) => {
    setTimeSlotValid(isValid);
    setTimeSlotError(validationError || '');
    setTimeSlotWarnings(warnings || []);
  }, []);

  // Calculate duration for display
  function calculateDuration(start: string, end: string): number {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes;
  }

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (!booking) {
      console.error('No booking data available for deletion');
      return;
    }

    try {
      await onDelete(deleteReason || 'Cancelled by user');
      setShowDeleteConfirm(false);
      setDeleteReason('');
      // Modal will be closed automatically by the useEditBooking hook after successful deletion
    } catch (error) {
      console.error('❌ Error deleting booking:', error);
      // Error handling is managed by the parent component
      // Keep modal open on error so user can see the error and retry
    }
  }, [booking, deleteReason, onDelete]);

  // Handle form submission
  const onSubmit = async (data: EditBookingFormData) => {
    if (!booking) {
      console.error('No booking data available for editing');
      return;
    }

    console.log('=== EDIT BOOKING FORM SUBMISSION STARTED ===');
    console.log('Form data received:', data);
    console.log('Current timeSlotValid:', timeSlotValid);

    try {
      // Validate time slot selection
      if (!data.startTime || !data.endTime) {
        setTimeSlotError('Please select both start and end times');
        return;
      }

      if (!timeSlotValid) {
        setTimeSlotError('Please select a valid time slot');
        return;
      }

      // Prepare updated booking data
      const startDateTime = new Date(`${data.date}T${data.startTime}:00`);
      const endDateTime = new Date(`${data.date}T${data.endTime}:00`);

      console.log('DateTime conversion:', {
        originalDate: data.date,
        originalStartTime: data.startTime,
        originalEndTime: data.endTime,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString()
      });

      const updateData: UpdateBookingData = {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        attendeeCount: data.attendeeCount,
        purpose: data.purpose || undefined,
        specialRequests: data.specialRequests || undefined,
        notes: data.notes || undefined,
        status: data.status
      };

      console.log('📤 Prepared update data:', updateData);

      await onSave(updateData);

      console.log('✅ Booking update successful, closing modal');
      onClose();
    } catch (error) {
      console.error('❌ Error updating booking:', error);
      // Error handling is managed by the parent component
    }
  };

  if (!isOpen || !booking) return null;

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
                    <h3 className="text-lg font-medium text-gray-900">Edit Booking</h3>
                    <p className="text-sm text-gray-600">
                      {booking.bookingReference} • {currentSpace?.name || 'Unknown Space'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 transition-colors"
                  disabled={isLoading}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {/* Pricing Change Warning */}
              {hasTimeChanges && (
                <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2 text-yellow-600">
                    <DollarSign className="h-4 w-4" />
                    <div className="text-sm">
                      <p className="font-medium">Pricing may change</p>
                      <p>Time or date changes may affect the total booking amount.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Booking Info */}
                <div className="space-y-6">
                  {/* Customer Information Display */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      {booking.contact ? (
                        <>
                          <p><strong>Contact:</strong> {booking.contact.firstName} {booking.contact.lastName}</p>
                          <p><strong>Email:</strong> {booking.contact.email}</p>
                        </>
                      ) : (
                        <>
                          <p><strong>Customer:</strong> {booking.customerName || 'N/A'}</p>
                          <p><strong>Email:</strong> {booking.customerEmail || 'N/A'}</p>
                          <p><strong>Phone:</strong> {booking.customerPhone || 'N/A'}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Space Information Display */}
                  {currentSpace && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Space Information</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{currentSpace.type}</span>
                        <span>•</span>
                        <Users className="h-4 w-4" />
                        <span>Capacity: {currentSpace.capacity}</span>
                      </div>
                      {currentSpace.description && (
                        <p className="mt-1 text-sm text-gray-600">{currentSpace.description}</p>
                      )}
                    </div>
                  )}

                  {/* Attendee Count */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Number of Attendees *</label>
                    <input
                      {...register('attendeeCount', { 
                        required: 'Attendee count is required',
                        min: { value: 1, message: 'At least 1 attendee required' },
                        max: { 
                          value: currentSpace?.capacity || 100, 
                          message: `Cannot exceed space capacity of ${currentSpace?.capacity || 100}` 
                        }
                      })}
                      type="number"
                      min="1"
                      max={currentSpace?.capacity || 100}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    {errors.attendeeCount && (
                      <p className="mt-1 text-sm text-red-600">{errors.attendeeCount.message}</p>
                    )}
                  </div>

                  {/* Booking Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      {...register('status')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Completed">Completed</option>
                      <option value="No Show">No Show</option>
                    </select>
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
                      disabled={isLoading}
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                    )}
                  </div>

                  {/* Time Selection */}
                  {booking.spaceId && (
                    <SimpleTimeSelector
                      spaceId={booking.spaceId}
                      date={date}
                      selectedStartTime={startTime}
                      selectedEndTime={endTime}
                      onTimeSlotSelect={handleTimeSlotSelect}
                      onValidationChange={handleTimeSlotValidation}
                      // Note: Current booking conflicts should be handled by backend validation
                    />
                  )}

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
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Special Requests</label>
                    <textarea
                      {...register('specialRequests')}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Any special setup requirements..."
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Internal Notes</label>
                    <textarea
                      {...register('notes')}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Private notes for your team..."
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading || !timeSlotValid}
                className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Booking
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-red-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:mr-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Booking
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Cancel Booking
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to cancel this booking? This action cannot be undone.
                    </p>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Cancellation reason (optional)
                      </label>
                      <input
                        type="text"
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                        placeholder="e.g., Customer request, scheduling conflict..."
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Cancelling...
                    </>
                  ) : (
                    'Yes, Cancel Booking'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteReason('');
                  }}
                  disabled={isLoading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  No, Keep Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditBookingModal;