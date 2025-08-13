import { useState, useMemo } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle, Lightbulb, Settings, Users, MapPin } from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useSpaces } from '../hooks/useSpaces';
import { 
  useBookingAvailabilityCheck, 
  useDayAvailability, 
  useSpaceAvailabilityStats
} from '../hooks/useBookingAvailability';
import { AvailabilityResponse, Slot, Conflict, AvError, Suggestion } from '../types/availability';

export default function AvailabilityTestPage() {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('11:00');
  const [attendeeCount, setAttendeeCount] = useState<number>(1);

  // Fetch spaces
  const { data: spacesData } = useSpaces({ limit: 100 });

  // Build availability request
  const availabilityRequest = useMemo(() => {
    if (!selectedSpaceId || !selectedDate || !startTime || !endTime) return null;
    
    const startDateTime = new Date(`${selectedDate}T${startTime}:00`);
    const endDateTime = new Date(`${selectedDate}T${endTime}:00`);
    
    return {
      spaceId: selectedSpaceId,
      startTime: startDateTime,
      endTime: endDateTime,
      attendeeCount,
      checkBusinessRules: true
    };
  }, [selectedSpaceId, selectedDate, startTime, endTime, attendeeCount]);

  // Hook calls
  const { 
    data: availabilityResult, 
    isLoading: availabilityLoading,
    error: availabilityError
  } = useBookingAvailabilityCheck(availabilityRequest) as {
    data: AvailabilityResponse | undefined;
    isLoading: boolean;
    error: any;
  };

  const { 
    data: daySlots 
  } = useDayAvailability(selectedSpaceId, selectedDate);

  const spaceStats = useSpaceAvailabilityStats(selectedSpaceId, selectedDate);

  // Safe field access with fallbacks
  const hasConflict = availabilityResult?.hasConflict ?? false;
  const conflicts: Conflict[] = availabilityResult?.conflicts ?? [];
  const errors: AvError[] = availabilityResult?.errors ?? [];
  const suggestions: Suggestion[] = availabilityResult?.suggestions ?? [];
  const slots: Slot[] = daySlots ?? [];

  // Generate time slots for dropdowns
  const timeSlots = useMemo(() => {
    const slots = [];
    const start = new Date();
    start.setHours(8, 0, 0, 0);
    const end = new Date();
    end.setHours(20, 0, 0, 0);
    
    while (start < end) {
      slots.push({
        value: format(start, 'HH:mm'),
        label: format(start, 'h:mm a')
      });
      start.setMinutes(start.getMinutes() + 30);
    }
    return slots;
  }, []);

  // Get selected space details
  const selectedSpace = spacesData?.spaces?.find(space => space._id === selectedSpaceId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  🚀 Production-Ready Availability System
                </h1>
                <p className="text-gray-600">
                  Enterprise-grade booking validation with bulletproof conflict detection
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Configuration */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Booking Configuration</h2>
                </div>

                {/* Space Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Space</label>
                  <select
                    value={selectedSpaceId}
                    onChange={(e) => setSelectedSpaceId(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select a space...</option>
                    {spacesData?.spaces?.map((space) => (
                      <option key={space._id} value={space._id}>
                        {space.name} - {space.type} (Cap: {space.capacity})
                      </option>
                    ))}
                  </select>

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

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    max={format(addDays(new Date(), 90), 'yyyy-MM-dd')}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {timeSlots.map((slot) => (
                        <option key={slot.value} value={slot.value}>{slot.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {timeSlots.map((slot) => (
                        <option key={slot.value} value={slot.value}>{slot.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Attendee Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attendee Count</label>
                  <input
                    type="number"
                    value={attendeeCount}
                    onChange={(e) => setAttendeeCount(parseInt(e.target.value) || 1)}
                    min="1"
                    max={selectedSpace?.capacity || 100}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Duration Display */}
                {startTime && endTime && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        Duration: {(() => {
                          const [startHour, startMin] = startTime.split(':').map(Number);
                          const [endHour, endMin] = endTime.split(':').map(Number);
                          const startMinutes = startHour * 60 + startMin;
                          const endMinutes = endHour * 60 + endMin;
                          const duration = endMinutes - startMinutes;
                          return `${Math.floor(duration / 60)}h ${duration % 60}m`;
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Space Statistics */}
              {selectedSpaceId && spaceStats && (
                <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Space Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Time Slots</span>
                      <span className="font-medium">{spaceStats.totalSlots}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Available Slots</span>
                      <span className="font-medium text-green-600">{spaceStats.availableSlots}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Booked Slots</span>
                      <span className="font-medium text-red-600">{spaceStats.bookedSlots}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Occupancy Rate</span>
                      <span className="font-medium">{spaceStats.occupancyRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${spaceStats.occupancyRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Results */}
            <div className="lg:col-span-2 space-y-6">
              {/* Validation Results */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <CheckCircle className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">🔍 Advanced Validation Results</h2>
                </div>

                {!selectedSpaceId || !selectedDate || !startTime || !endTime ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Configure your booking requirements to see validation results</p>
                  </div>
                ) : availabilityLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">🔄 Running comprehensive availability validation...</p>
                  </div>
                ) : availabilityError ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="text-red-800 font-medium">Validation Error</span>
                    </div>
                    <p className="mt-2 text-red-700">Failed to validate booking availability</p>
                  </div>
                ) : availabilityResult ? (
                  <div className="space-y-6">
                    {/* Overall Status */}
                    <div className={`p-4 rounded-lg border-2 ${
                      !hasConflict 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        {!hasConflict ? (
                          <>
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <div>
                              <h3 className="text-lg font-semibold text-green-900">✅ Booking Available</h3>
                              <p className="text-green-700">All validation checks passed successfully</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-6 w-6 text-red-600" />
                            <div>
                              <h3 className="text-lg font-semibold text-red-900">❌ Booking Conflicts Detected</h3>
                              <p className="text-red-700">
                                {conflicts.length} conflict(s) and {errors.length} error(s) found
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Detailed Conflicts */}
                    {conflicts.length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-3">⚠️ Booking Conflicts</h4>
                        <div className="space-y-3">
{conflicts.map((conflict: Conflict, index: number) => (
                            <div key={index} className="p-4 rounded-lg border bg-red-50 border-red-200">
                              <div className="flex items-start space-x-3">
                                <AlertCircle className="h-5 w-5 mt-0.5 text-red-600" />
                                <div className="flex-1">
                                  <p className="font-medium text-red-900">
                                    Conflict: {conflict.start} - {conflict.end}
                                  </p>
                                  {conflict.spaceId && (
                                    <p className="text-sm text-red-700 mt-1">Space: {conflict.spaceId}</p>
                                  )}
                                  {conflict.bookingId && (
                                    <p className="text-sm text-red-700 mt-1">Booking ID: {conflict.bookingId}</p>
                                  )}
                                  {conflict.reference && (
                                    <p className="text-sm text-red-700 mt-1">Reference: {conflict.reference}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Validation Errors */}
                    {errors.length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-3">🚫 Validation Errors</h4>
                        <div className="space-y-3">
{errors.map((error: AvError, index: number) => (
                            <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-start space-x-3">
                                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs px-2 py-1 bg-red-200 text-red-900 rounded-full font-medium">
                                      {error.code}
                                    </span>
                                  </div>
                                  <p className="mt-2 font-medium text-red-900">{error.message}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Alternative Suggestions */}
                    {suggestions.length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-3">💡 Alternative Time Slots</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
{suggestions.map((suggestion: Suggestion, index: number) => (
                            <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-blue-900">
                                    {formatInTimeZone(parseISO(suggestion.start), 'Asia/Kolkata', 'h:mm a')} - {formatInTimeZone(parseISO(suggestion.end), 'Asia/Kolkata', 'h:mm a')}
                                  </p>
                                </div>
                                <Lightbulb className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No validation results available</p>
                  </div>
                )}
              </div>

              {/* Day Schedule View */}
              {selectedSpaceId && slots.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Day Schedule Overview</h3>
                  <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-1">
{slots.map((slot: Slot, index: number) => (
                      <div
                        key={index}
                        className={`p-2 rounded text-xs text-center font-medium ${
                          slot.available
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                        title={`${formatInTimeZone(parseISO(slot.start), 'Asia/Kolkata', 'h:mm a')} - ${formatInTimeZone(parseISO(slot.end), 'Asia/Kolkata', 'h:mm a')} ${slot.available ? '(Available)' : '(Booked)'}`}
                      >
                        {formatInTimeZone(parseISO(slot.start), 'Asia/Kolkata', 'h:mm')}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-center space-x-6 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                      <span>Available</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                      <span>Booked</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}