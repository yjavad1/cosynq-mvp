import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, RefreshCw, Calendar } from 'lucide-react';
import { useTimeSlots, useTimeSlotSuggestions } from '../../hooks/useTimeSlots';

interface TimeSlotSelectorProps {
  spaceId: string | null;
  date: string | null;
  duration?: number;
  selectedStartTime?: string;
  selectedEndTime?: string;
  onTimeSlotSelect: (startTime: string, endTime: string) => void;
  onValidationChange: (isValid: boolean, error?: string, warnings?: string[]) => void;
  className?: string;
}

export function TimeSlotSelector({
  spaceId,
  date,
  duration = 60,
  selectedStartTime,
  selectedEndTime,
  onTimeSlotSelect,
  onValidationChange,
  className = ''
}: TimeSlotSelectorProps) {
  const [selectedSlotValue, setSelectedSlotValue] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch available time slots
  const {
    timeSlotOptions,
    isLoading,
    isError,
    error,
    validateTimeSlot,
    refreshSlots,
    canBookToday,
    nextAvailableSlot,
    timezone,
    summary
  } = useTimeSlots(spaceId, date, duration);

  // Get time slot suggestions
  const { suggestions, hasSuggestions } = useTimeSlotSuggestions(
    spaceId, 
    date, 
    duration, 
    selectedStartTime
  );

  // Update selected slot when props change
  useEffect(() => {
    if (selectedStartTime && selectedEndTime) {
      const value = `${selectedStartTime}-${selectedEndTime}`;
      setSelectedSlotValue(value);
      
      // Validate the selection
      const validation = validateTimeSlot(selectedStartTime, selectedEndTime);
      onValidationChange(validation.isValid, validation.error, validation.warnings);
    } else {
      setSelectedSlotValue('');
      onValidationChange(false, 'Please select a time slot');
    }
  }, [selectedStartTime, selectedEndTime, validateTimeSlot, onValidationChange]);

  // Handle slot selection
  const handleSlotSelect = (slotValue: string) => {
    if (!slotValue) {
      setSelectedSlotValue('');
      onTimeSlotSelect('', '');
      return;
    }

    const [startTime, endTime] = slotValue.split('-');
    setSelectedSlotValue(slotValue);
    onTimeSlotSelect(startTime, endTime);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (startTime: string, endTime: string) => {
    const value = `${startTime}-${endTime}`;
    handleSlotSelect(value);
    setShowSuggestions(false);
  };

  // Quick select next available slot
  const handleQuickSelect = () => {
    if (nextAvailableSlot) {
      const startTime = new Date(nextAvailableSlot.startTime).toTimeString().slice(0, 5);
      const endTime = new Date(nextAvailableSlot.endTime).toTimeString().slice(0, 5);
      handleSuggestionSelect(startTime, endTime);
    }
  };

  if (!spaceId || !date) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <div className="text-center text-gray-500">
          <Calendar className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Please select a space and date first</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-sm">Loading available time slots...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`p-4 bg-red-50 rounded-lg border border-red-200 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="text-sm font-medium">Error loading time slots</p>
              <p className="text-xs">{error}</p>
            </div>
          </div>
          <button
            onClick={refreshSlots}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-red-700 hover:bg-red-100 rounded-md transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  if (timeSlotOptions.length === 0) {
    return (
      <div className={`p-4 bg-yellow-50 rounded-lg border border-yellow-200 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
          <p className="text-sm font-medium text-yellow-800 mb-1">No Available Time Slots</p>
          <p className="text-xs text-yellow-700 mb-3">
            {!canBookToday 
              ? 'Same-day bookings are not allowed for this location'
              : 'All time slots are booked for this date'
            }
          </p>
          <button
            onClick={refreshSlots}
            className="inline-flex items-center space-x-1 px-3 py-1 text-sm text-yellow-700 hover:bg-yellow-100 rounded-md transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Check Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Time Slot Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Available Time Slots *
        </label>
        
        <select
          value={selectedSlotValue}
          onChange={(e) => handleSlotSelect(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
        >
          <option value="">Select an available time slot...</option>
          {timeSlotOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {selectedSlotValue && (
          <div className="mt-2">
            {validateTimeSlot(selectedStartTime || '', selectedEndTime || '').isValid ? (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Time slot confirmed</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {nextAvailableSlot && (
          <button
            type="button"
            onClick={handleQuickSelect}
            className="inline-flex items-center space-x-1 px-3 py-1 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
          >
            <Clock className="w-4 h-4" />
            <span>Next Available</span>
          </button>
        )}
        
        {hasSuggestions && (
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="inline-flex items-center space-x-1 px-3 py-1 text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <span>Suggestions</span>
            <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">
              {suggestions.length}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={refreshSlots}
          className="inline-flex items-center space-x-1 px-3 py-1 text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Suggestions Panel */}
      {showSuggestions && hasSuggestions && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Suggested Time Slots</h4>
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion.startTime, suggestion.endTime)}
                className="w-full text-left px-3 py-2 text-sm bg-white hover:bg-blue-100 rounded border border-blue-200 hover:border-blue-300 transition-colors"
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Availability Summary */}
      {summary && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Available:</span>
              <span className="ml-2 font-medium text-green-600">{summary.availableSlots}</span>
            </div>
            <div>
              <span className="text-gray-600">Booked:</span>
              <span className="ml-2 font-medium text-red-600">{summary.existingBookings}</span>
            </div>
          </div>
          {timezone && (
            <div className="mt-2 text-xs text-gray-500">
              Times shown in {timezone}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TimeSlotSelector;