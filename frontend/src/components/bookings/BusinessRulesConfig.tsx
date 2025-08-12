import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Settings, Clock, Calendar, Users, Save, RotateCcw } from 'lucide-react';
import { useUpdateBusinessRules } from '../../hooks/useBookingAvailability';
import { BusinessRules } from '../../services/bookingAvailability';

interface BusinessRulesFormData extends BusinessRules {
  // Form-friendly types
}

const DEFAULT_RULES: BusinessRules = {
  operatingHours: { start: '09:00', end: '18:00' },
  bufferTime: 15,
  advanceBookingLimits: { minimum: 1, maximum: 30 },
  durationLimits: { minimum: 60, maximum: 480 },
  sameDayBookingCutoff: '12:00',
  weekendBooking: false,
  peakHours: { start: '12:00', end: '14:00', multiplier: 1.5 }
};

interface BusinessRulesConfigProps {
  isOpen: boolean;
  onClose: () => void;
  currentRules?: Partial<BusinessRules>;
}

export function BusinessRulesConfig({ isOpen, onClose, currentRules }: BusinessRulesConfigProps) {
  const [savedRules, setSavedRules] = useState<BusinessRules>({ ...DEFAULT_RULES, ...currentRules });
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<BusinessRulesFormData>({
    defaultValues: savedRules
  });

  const updateBusinessRules = useUpdateBusinessRules();

  // Watch all form values for real-time preview
  const watchedValues = watch();

  const onSubmit = async (data: BusinessRulesFormData) => {
    try {
      await updateBusinessRules.mutateAsync(data);
      setSavedRules(data);
      onClose();
    } catch (error) {
      console.error('Failed to update business rules:', error);
    }
  };

  const resetToDefaults = () => {
    reset(DEFAULT_RULES);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white px-6 pt-6 pb-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Settings className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Business Rules Configuration</h3>
                    <p className="text-sm text-gray-600">Configure booking policies and restrictions</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Operating Hours & Time */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-4">
                      <Clock className="h-5 w-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900">Operating Hours</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <input
                          {...register('operatingHours.start', { required: 'Start time is required' })}
                          type="time"
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.operatingHours?.start && (
                          <p className="mt-1 text-sm text-red-600">{errors.operatingHours.start.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <input
                          {...register('operatingHours.end', { required: 'End time is required' })}
                          type="time"
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.operatingHours?.end && (
                          <p className="mt-1 text-sm text-red-600">{errors.operatingHours.end.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-4">
                      <Clock className="h-5 w-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900">Peak Hours (Optional)</h4>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <input
                          {...register('peakHours.start')}
                          type="time"
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <input
                          {...register('peakHours.end')}
                          type="time"
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Multiplier</label>
                        <input
                          {...register('peakHours.multiplier', { 
                            valueAsNumber: true,
                            min: { value: 1, message: 'Minimum multiplier is 1' },
                            max: { value: 5, message: 'Maximum multiplier is 5' }
                          })}
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-4">
                      <Calendar className="h-5 w-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900">Time Restrictions</h4>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buffer Time (minutes)</label>
                        <input
                          {...register('bufferTime', { 
                            valueAsNumber: true,
                            min: { value: 0, message: 'Buffer time cannot be negative' },
                            max: { value: 120, message: 'Buffer time cannot exceed 120 minutes' }
                          })}
                          type="number"
                          min="0"
                          max="120"
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">Time required between bookings</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Same-day Booking Cutoff</label>
                        <input
                          {...register('sameDayBookingCutoff', { required: 'Cutoff time is required' })}
                          type="time"
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">No same-day bookings after this time</p>
                      </div>

                      <div className="flex items-center">
                        <input
                          {...register('weekendBooking')}
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Allow weekend bookings
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Booking Limits */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-4">
                      <Users className="h-5 w-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900">Advance Booking Limits</h4>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Advance (hours)</label>
                        <input
                          {...register('advanceBookingLimits.minimum', { 
                            valueAsNumber: true,
                            min: { value: 0, message: 'Minimum advance cannot be negative' }
                          })}
                          type="number"
                          min="0"
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">Minimum hours ahead required</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Advance (days)</label>
                        <input
                          {...register('advanceBookingLimits.maximum', { 
                            valueAsNumber: true,
                            min: { value: 1, message: 'Maximum advance must be at least 1 day' }
                          })}
                          type="number"
                          min="1"
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">Maximum days ahead allowed</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-4">
                      <Clock className="h-5 w-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900">Duration Limits</h4>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Duration (minutes)</label>
                        <input
                          {...register('durationLimits.minimum', { 
                            valueAsNumber: true,
                            min: { value: 15, message: 'Minimum duration must be at least 15 minutes' }
                          })}
                          type="number"
                          min="15"
                          step="15"
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Duration (minutes)</label>
                        <input
                          {...register('durationLimits.maximum', { 
                            valueAsNumber: true,
                            min: { value: 30, message: 'Maximum duration must be at least 30 minutes' }
                          })}
                          type="number"
                          min="30"
                          step="15"
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3">📋 Current Configuration</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Operating Hours:</span>
                        <span className="text-blue-900 font-medium">
                          {watchedValues.operatingHours?.start} - {watchedValues.operatingHours?.end}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Buffer Time:</span>
                        <span className="text-blue-900 font-medium">{watchedValues.bufferTime} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Weekend Bookings:</span>
                        <span className="text-blue-900 font-medium">
                          {watchedValues.weekendBooking ? 'Allowed' : 'Not Allowed'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Duration Range:</span>
                        <span className="text-blue-900 font-medium">
                          {watchedValues.durationLimits?.minimum}min - {watchedValues.durationLimits?.maximum}min
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={updateBusinessRules.isPending}
                className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateBusinessRules.isPending ? 'Saving...' : 'Save Rules'}
              </button>
              
              <button
                type="button"
                onClick={resetToDefaults}
                className="mt-3 w-full inline-flex justify-center items-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
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

export default BusinessRulesConfig;