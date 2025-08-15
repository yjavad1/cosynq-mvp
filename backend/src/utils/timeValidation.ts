import { ILocation, DayOfWeek } from '../models/Location';

/**
 * Time validation utilities for booking system
 * Handles timezone-aware calculations and business rule validation
 */

export interface TimeValidationConfig {
  minimumAdvanceMinutes: number; // Default: 30 minutes
  maximumAdvanceDays: number; // Default: 90 days
  allowPastBookings: boolean; // Default: false
  respectOperatingHours: boolean; // Default: true
}

export interface TimeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  timeUntilBooking?: {
    minutes: number;
    hours: number;
    days: number;
  };
}

export interface BusinessHoursInfo {
  isWithinHours: boolean;
  locationOpen: boolean;
  dayOperatingHours: {
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
    notes?: string;
  };
}

/**
 * Default time validation configuration
 */
export const DEFAULT_TIME_CONFIG: TimeValidationConfig = {
  minimumAdvanceMinutes: 30,
  maximumAdvanceDays: 90,
  allowPastBookings: false,
  respectOperatingHours: true
};

/**
 * Convert timezone string to a more readable format
 */
export function getTimezoneInfo(timezone: string): { offset: string; name: string } {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    
    const parts = formatter.formatToParts(now);
    const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || timezone;
    
    // Calculate offset
    const utcDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const targetDate = new Date(utcDate.toLocaleString("en-US", { timeZone: timezone }));
    const offsetMs = targetDate.getTime() - utcDate.getTime();
    const offsetHours = offsetMs / (1000 * 60 * 60);
    const offsetSign = offsetHours >= 0 ? '+' : '-';
    const offsetFormatted = `${offsetSign}${Math.abs(offsetHours).toFixed(1)}h`;
    
    return {
      offset: offsetFormatted,
      name: timeZoneName
    };
  } catch (error) {
    return {
      offset: '+0h',
      name: timezone
    };
  }
}

/**
 * Get current time in a specific timezone
 */
export function getCurrentTimeInTimezone(timezone: string = 'Asia/Kolkata'): Date {
  try {
    const now = new Date();
    const timeInTimezone = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    return timeInTimezone;
  } catch (error) {
    console.warn(`Invalid timezone: ${timezone}, falling back to UTC`);
    return new Date();
  }
}

/**
 * Convert date to specific timezone
 */
export function convertDateToTimezone(date: Date, timezone: string = 'Asia/Kolkata'): Date {
  try {
    return new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  } catch (error) {
    console.warn(`Invalid timezone: ${timezone}, returning original date`);
    return date;
  }
}

/**
 * Get day of week from date in specific timezone
 */
export function getDayOfWeekInTimezone(date: Date, timezone: string = 'Asia/Kolkata'): DayOfWeek {
  try {
    const dateInTimezone = convertDateToTimezone(date, timezone);
    const dayIndex = dateInTimezone.getDay();
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayIndex];
  } catch (error) {
    const dayIndex = date.getDay();
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayIndex];
  }
}

/**
 * Check if booking time falls within location's operating hours
 */
export function checkBusinessHours(
  startTime: Date,
  endTime: Date,
  location?: ILocation
): BusinessHoursInfo {
  if (!location) {
    return {
      isWithinHours: true, // No restrictions if no location provided
      locationOpen: true,
      dayOperatingHours: { isOpen: true }
    };
  }

  try {
    const timezone = location.timezone || 'Asia/Kolkata';
    const startInTimezone = convertDateToTimezone(startTime, timezone);
    const endInTimezone = convertDateToTimezone(endTime, timezone);
    
    // Get day of week for the booking start time
    const dayOfWeek = getDayOfWeekInTimezone(startTime, timezone);
    const operatingHours = location.getOperatingHoursForDay(dayOfWeek);
    
    if (!operatingHours || !operatingHours.isOpen) {
      return {
        isWithinHours: false,
        locationOpen: false,
        dayOperatingHours: {
          isOpen: false,
          notes: operatingHours?.notes || 'Location is closed on this day'
        }
      };
    }

    // Convert operating hours to dates for comparison
    const startHour = parseInt(operatingHours.openTime!.split(':')[0]);
    const startMinute = parseInt(operatingHours.openTime!.split(':')[1]);
    const endHour = parseInt(operatingHours.closeTime!.split(':')[0]);
    const endMinute = parseInt(operatingHours.closeTime!.split(':')[1]);

    const operatingStart = new Date(startInTimezone);
    operatingStart.setHours(startHour, startMinute, 0, 0);
    
    const operatingEnd = new Date(startInTimezone);
    operatingEnd.setHours(endHour, endMinute, 0, 0);

    // Handle overnight operating hours (e.g., 22:00 to 06:00)
    if (operatingEnd <= operatingStart) {
      operatingEnd.setDate(operatingEnd.getDate() + 1);
    }

    const bookingStartTime = startInTimezone.getHours() * 60 + startInTimezone.getMinutes();
    const bookingEndTime = endInTimezone.getHours() * 60 + endInTimezone.getMinutes();
    const operatingStartTime = startHour * 60 + startMinute;
    const operatingEndTime = endHour * 60 + endMinute;

    const isWithinHours = bookingStartTime >= operatingStartTime && bookingEndTime <= operatingEndTime;

    return {
      isWithinHours,
      locationOpen: true,
      dayOperatingHours: {
        isOpen: true,
        openTime: operatingHours.openTime,
        closeTime: operatingHours.closeTime,
        notes: operatingHours.notes
      }
    };
  } catch (error) {
    console.warn('Error checking business hours:', error);
    return {
      isWithinHours: true, // Default to allowing if error occurs
      locationOpen: true,
      dayOperatingHours: { isOpen: true }
    };
  }
}

/**
 * Validate booking times against business rules and time constraints
 */
export function validateBookingTime(
  startTime: Date,
  endTime: Date,
  location?: ILocation,
  config: Partial<TimeValidationConfig> = {}
): TimeValidationResult {
  const finalConfig = { ...DEFAULT_TIME_CONFIG, ...config };
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get current time in location's timezone or default
  const timezone = location?.timezone || 'Asia/Kolkata';
  const now = getCurrentTimeInTimezone(timezone);
  
  // Basic validation: start time before end time
  if (startTime >= endTime) {
    errors.push('Start time must be before end time');
  }

  // Calculate time until booking
  const timeDiff = startTime.getTime() - now.getTime();
  const minutesUntilBooking = Math.floor(timeDiff / (1000 * 60));
  const hoursUntilBooking = timeDiff / (1000 * 60 * 60);
  const daysUntilBooking = hoursUntilBooking / 24;

  const timeUntilBooking = {
    minutes: minutesUntilBooking,
    hours: Math.floor(hoursUntilBooking),
    days: Math.floor(daysUntilBooking)
  };

  // 1. Check if booking is in the past
  if (!finalConfig.allowPastBookings && startTime <= now) {
    errors.push('Bookings cannot be made for past dates and times');
  }

  // 2. Check minimum advance booking time (30 minutes default)
  if (minutesUntilBooking < finalConfig.minimumAdvanceMinutes && startTime > now) {
    errors.push(`Bookings must be made at least ${finalConfig.minimumAdvanceMinutes} minutes in advance`);
  }

  // 3. Check maximum advance booking limit
  if (daysUntilBooking > finalConfig.maximumAdvanceDays) {
    errors.push(`Bookings can only be made up to ${finalConfig.maximumAdvanceDays} days in advance`);
  }

  // 4. Check same-day booking rules
  const isToday = startTime.toDateString() === now.toDateString();
  if (isToday && location && !location.allowSameDayBooking) {
    errors.push('Same-day bookings are not allowed for this location');
  }

  // 5. Check business/operating hours
  if (finalConfig.respectOperatingHours && location) {
    const businessHours = checkBusinessHours(startTime, endTime, location);
    
    if (!businessHours.locationOpen) {
      errors.push(`Location is closed on ${getDayOfWeekInTimezone(startTime, timezone)}s`);
    } else if (!businessHours.isWithinHours) {
      const { openTime, closeTime } = businessHours.dayOperatingHours;
      errors.push(`Booking time must be within operating hours: ${openTime} - ${closeTime}`);
    }
  }

  // 6. Add helpful warnings
  if (minutesUntilBooking < 120 && minutesUntilBooking >= finalConfig.minimumAdvanceMinutes) {
    warnings.push('This is a short-notice booking. Please ensure all arrangements are in place.');
  }

  if (daysUntilBooking > 30) {
    warnings.push('This booking is far in advance. Please confirm availability closer to the date.');
  }

  // Weekend booking warning
  const dayOfWeek = getDayOfWeekInTimezone(startTime, timezone);
  if (dayOfWeek === 'saturday' || dayOfWeek === 'sunday') {
    warnings.push('This is a weekend booking. Please verify weekend rates and availability.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    timeUntilBooking
  };
}

/**
 * Generate available time slots for a specific date, respecting operating hours
 */
export function generateAvailableTimeSlots(
  targetDate: Date,
  duration: number, // in minutes
  location?: ILocation,
  existingBookings: Array<{ startTime: Date; endTime: Date }> = []
): Array<{ startTime: Date; endTime: Date; isAvailable: boolean }> {
  const timezone = location?.timezone || 'Asia/Kolkata';
  const dayOfWeek = getDayOfWeekInTimezone(targetDate, timezone);
  const slots: Array<{ startTime: Date; endTime: Date; isAvailable: boolean }> = [];
  
  // Get operating hours for the day
  let operatingStart: Date;
  let operatingEnd: Date;
  
  if (location) {
    const operatingHours = location.getOperatingHoursForDay(dayOfWeek);
    
    if (!operatingHours || !operatingHours.isOpen) {
      return []; // No slots if location is closed
    }
    
    const [startHour, startMinute] = operatingHours.openTime!.split(':').map(Number);
    const [endHour, endMinute] = operatingHours.closeTime!.split(':').map(Number);
    
    operatingStart = new Date(targetDate);
    operatingStart.setHours(startHour, startMinute, 0, 0);
    
    operatingEnd = new Date(targetDate);
    operatingEnd.setHours(endHour, endMinute, 0, 0);
  } else {
    // Default operating hours: 9 AM to 6 PM
    operatingStart = new Date(targetDate);
    operatingStart.setHours(9, 0, 0, 0);
    
    operatingEnd = new Date(targetDate);
    operatingEnd.setHours(18, 0, 0, 0);
  }

  // Current time check - only show future slots for today
  const now = getCurrentTimeInTimezone(timezone);
  const isToday = targetDate.toDateString() === now.toDateString();
  
  if (isToday && operatingStart < now) {
    // Round up to next 30-minute slot
    const currentMinutes = now.getMinutes();
    const nextSlotMinutes = Math.ceil(currentMinutes / 30) * 30;
    operatingStart = new Date(now);
    operatingStart.setMinutes(nextSlotMinutes, 0, 0);
    
    // If we've rolled over to the next hour
    if (nextSlotMinutes >= 60) {
      operatingStart.setHours(operatingStart.getHours() + 1);
      operatingStart.setMinutes(0, 0, 0);
    }
  }

  // Generate 30-minute slots
  let currentSlotStart = new Date(operatingStart);
  
  while (currentSlotStart.getTime() + (duration * 60 * 1000) <= operatingEnd.getTime()) {
    const currentSlotEnd = new Date(currentSlotStart.getTime() + (duration * 60 * 1000));
    
    // Check if this slot conflicts with any existing booking
    const hasConflict = existingBookings.some(booking => {
      return (currentSlotStart < booking.endTime) && (currentSlotEnd > booking.startTime);
    });
    
    slots.push({
      startTime: new Date(currentSlotStart),
      endTime: new Date(currentSlotEnd),
      isAvailable: !hasConflict
    });
    
    // Move to next 30-minute slot
    currentSlotStart = new Date(currentSlotStart.getTime() + (30 * 60 * 1000));
  }

  return slots;
}

/**
 * Format time validation errors for API responses
 */
export function formatTimeValidationErrors(result: TimeValidationResult): {
  message: string;
  details: string[];
  warnings?: string[];
} {
  if (result.isValid) {
    return {
      message: 'Time validation passed',
      details: [],
      warnings: result.warnings.length > 0 ? result.warnings : undefined
    };
  }

  const primaryError = result.errors[0] || 'Invalid booking time';
  
  return {
    message: primaryError,
    details: result.errors,
    warnings: result.warnings.length > 0 ? result.warnings : undefined
  };
}

/**
 * Check if a booking can be modified based on time constraints
 */
export function canModifyBooking(
  currentStartTime: Date,
  timezone: string = 'Asia/Kolkata',
  minimumHoursBeforeModification: number = 4
): { canModify: boolean; reason?: string; hoursRemaining?: number } {
  const now = getCurrentTimeInTimezone(timezone);
  const hoursUntilBooking = (currentStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilBooking < minimumHoursBeforeModification) {
    return {
      canModify: false,
      reason: `Bookings cannot be modified less than ${minimumHoursBeforeModification} hours before start time`,
      hoursRemaining: Math.max(0, hoursUntilBooking)
    };
  }
  
  return {
    canModify: true,
    hoursRemaining: hoursUntilBooking
  };
}

/**
 * Check if a booking can be cancelled based on time constraints
 */
export function canCancelBooking(
  currentStartTime: Date,
  timezone: string = 'Asia/Kolkata',
  minimumHoursBeforeCancellation: number = 2
): { canCancel: boolean; reason?: string; hoursRemaining?: number } {
  const now = getCurrentTimeInTimezone(timezone);
  const hoursUntilBooking = (currentStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilBooking < minimumHoursBeforeCancellation) {
    return {
      canCancel: false,
      reason: `Bookings cannot be cancelled less than ${minimumHoursBeforeCancellation} hours before start time`,
      hoursRemaining: Math.max(0, hoursUntilBooking)
    };
  }
  
  return {
    canCancel: true,
    hoursRemaining: hoursUntilBooking
  };
}