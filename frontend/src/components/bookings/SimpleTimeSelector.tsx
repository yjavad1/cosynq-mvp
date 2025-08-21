import { useCallback, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface SimpleTimeSelectorProps {
  spaceId: string | null;
  date: string | null;
  duration?: number;
  selectedStartTime?: string;
  selectedEndTime?: string;
  onTimeSlotSelect: (startTime: string, endTime: string) => void;
  onValidationChange: (isValid: boolean, error?: string, warnings?: string[]) => void;
  className?: string;
}

export function SimpleTimeSelector({
  spaceId,
  date,
  selectedStartTime = '',
  selectedEndTime = '',
  onTimeSlotSelect,
  onValidationChange,
  className = ''
}: SimpleTimeSelectorProps) {

  // Simple validation function
  const validateTimes = useCallback((startTime: string, endTime: string) => {
    if (!startTime || !endTime) {
      return { isValid: false, error: 'Please select both start and end times' };
    }

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (startMinutes >= endMinutes) {
      return { isValid: false, error: 'End time must be after start time' };
    }
    
    const duration = endMinutes - startMinutes;
    if (duration < 30) {
      return { isValid: false, error: 'Minimum booking duration is 30 minutes' };
    }

    return { isValid: true };
  }, []);

  // Validate whenever times change
  useEffect(() => {
    const validation = validateTimes(selectedStartTime, selectedEndTime);
    console.log('🕐 SimpleTimeSelector validation:', {
      selectedStartTime,
      selectedEndTime,
      isValid: validation.isValid,
      error: validation.error
    });
    onValidationChange(validation.isValid, validation.error);
  }, [selectedStartTime, selectedEndTime, validateTimes, onValidationChange]);

  const handleStartTimeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = event.target.value;
    onTimeSlotSelect(newStartTime, selectedEndTime);
  }, [onTimeSlotSelect, selectedEndTime]);

  const handleEndTimeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newEndTime = event.target.value;
    onTimeSlotSelect(selectedStartTime, newEndTime);
  }, [onTimeSlotSelect, selectedStartTime]);

  const validation = validateTimes(selectedStartTime, selectedEndTime);

  if (!spaceId || !date) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <div className="text-center text-gray-500">
          <Clock className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Please select a space and date first</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Time Selection *
        </label>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
            <input
              type="time"
              value={selectedStartTime}
              onChange={handleStartTimeChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
            <input
              type="time"
              value={selectedEndTime}
              onChange={handleEndTimeChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Validation Status */}
      {(selectedStartTime || selectedEndTime) && (
        <div className="flex items-center space-x-2">
          {validation.isValid ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">Time selection is valid</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600">{validation.error}</span>
            </>
          )}
        </div>
      )}

      {/* Duration Display */}
      {validation.isValid && selectedStartTime && selectedEndTime && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Duration: {(() => {
                const [startHour, startMin] = selectedStartTime.split(':').map(Number);
                const [endHour, endMin] = selectedEndTime.split(':').map(Number);
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;
                const duration = endMinutes - startMinutes;
                const hours = Math.floor(duration / 60);
                const minutes = duration % 60;
                return `${hours}h ${minutes}m`;
              })()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SimpleTimeSelector;