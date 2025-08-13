import { bookingApiService, BookingData, BookingStatus } from './bookingApi';
import { format, parseISO, isAfter, isBefore, addMinutes, differenceInMinutes, startOfDay, endOfDay, isToday } from 'date-fns';
import { AvailabilityResponse, Slot } from '../types/availability';

// Business Rule Configuration
export interface BusinessRules {
  operatingHours: {
    start: string; // "09:00"
    end: string;   // "18:00"
  };
  bufferTime: number; // minutes between bookings
  advanceBookingLimits: {
    minimum: number; // hours ahead minimum
    maximum: number; // days ahead maximum
  };
  durationLimits: {
    minimum: number; // minutes
    maximum: number; // minutes
  };
  sameDayBookingCutoff: string; // "12:00" - no same-day bookings after this time
  weekendBooking: boolean;
  peakHours?: {
    start: string;
    end: string;
    multiplier: number; // pricing multiplier
  };
}

// Default business rules (configurable per location/space type)
const DEFAULT_BUSINESS_RULES: BusinessRules = {
  operatingHours: { start: '09:00', end: '18:00' },
  bufferTime: 15, // 15 minutes between bookings
  advanceBookingLimits: { minimum: 1, maximum: 30 }, // 1 hour to 30 days
  durationLimits: { minimum: 60, maximum: 480 }, // 1 hour to 8 hours
  sameDayBookingCutoff: '12:00',
  weekendBooking: false,
  peakHours: { start: '12:00', end: '14:00', multiplier: 1.5 }
};

// Conflict Detection Result
export interface ConflictResult {
  hasConflict: boolean;
  conflicts: ConflictDetail[];
  suggestions: TimeSlot[];
  errors: ValidationError[];
}

export interface ConflictDetail {
  type: 'overlap' | 'buffer' | 'business_rule';
  conflictingBooking?: BookingData;
  message: string;
  severity: 'error' | 'warning';
  suggestedAction?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  details?: any;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
  reason?: string;
  price?: number;
  isPeak?: boolean;
}

// Availability Request
export interface AvailabilityRequest {
  spaceId: string;
  startTime: Date | string;
  endTime: Date | string;
  excludeBookingId?: string; // For editing existing bookings
  attendeeCount?: number;
  checkBusinessRules?: boolean;
}

// Bulk Availability Request
export interface BulkAvailabilityRequest {
  spaceIds: string[];
  date: Date | string;
  duration?: number; // minutes, if looking for specific duration slots
  businessRules?: Partial<BusinessRules>;
}

export class BookingAvailabilityService {
  private businessRules: BusinessRules;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  constructor(businessRules: Partial<BusinessRules> = {}) {
    this.businessRules = { ...DEFAULT_BUSINESS_RULES, ...businessRules };
  }

  /**
   * Check if a time slot is available with comprehensive validation
   */
  async checkAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
    console.log('🔍 Checking availability:', request);
    
    const startTime = typeof request.startTime === 'string' ? parseISO(request.startTime) : request.startTime;
    const endTime = typeof request.endTime === 'string' ? parseISO(request.endTime) : request.endTime;
    
    const result: AvailabilityResponse = {
      hasConflict: false,
      conflicts: [],
      suggestions: [],
      errors: [],
      slots: []
    };

    try {
      // 1. Basic validation
      this.validateBasicRequirements(request, result);
      
      // 2. Business rules validation
      if (request.checkBusinessRules !== false) {
        await this.validateBusinessRules(startTime, endTime, result);
      }
      
      // 3. Conflict detection
      await this.detectConflicts(request, startTime, endTime, result);
      
      // 4. Generate suggestions if conflicts exist
      if (result.hasConflict && result.conflicts.length > 0) {
        result.suggestions = await this.generateAlternativeSlots(request, startTime, endTime);
      }

      result.hasConflict = result.conflicts.length > 0 || result.errors.length > 0;
      
    } catch (error) {
      console.error('❌ Availability check failed:', error);
      result.errors.push({
        code: 'AVAILABILITY_CHECK_FAILED',
        message: 'Failed to check availability. Please try again.'
      });
      result.hasConflict = true;
    }

    console.log('✅ Availability result:', result);
    return result;
  }

  /**
   * Get available time slots for a specific day
   */
  async getDayAvailability(spaceId: string, date: Date | string): Promise<Slot[]> {
    const targetDate = typeof date === 'string' ? parseISO(date) : date;
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);
    
    console.log(`📅 Getting day availability for ${spaceId} on ${format(targetDate, 'yyyy-MM-dd')}`);
    
    // Get all bookings for the day
    const existingBookings = await this.getExistingBookings(spaceId, dayStart, dayEnd);
    
    // Generate time slots (every 30 minutes within operating hours)
    const slots: Slot[] = [];
    const operatingStart = this.parseTimeToDate(targetDate, this.businessRules.operatingHours.start);
    const operatingEnd = this.parseTimeToDate(targetDate, this.businessRules.operatingHours.end);
    
    let currentTime = operatingStart;
    while (isBefore(currentTime, operatingEnd)) {
      const slotEnd = addMinutes(currentTime, 30); // 30-minute slots
      
      const isAvailable = !this.hasTimeConflict(currentTime, slotEnd, existingBookings);
      
      slots.push({
        start: currentTime.toISOString(),
        end: slotEnd.toISOString(),
        available: isAvailable,
        reason: isAvailable ? undefined : 'Booking conflict'
      });
      
      currentTime = slotEnd;
    }
    
    return slots;
  }

  /**
   * Bulk availability check for multiple spaces
   */
  async getBulkAvailability(request: BulkAvailabilityRequest): Promise<Map<string, Slot[]>> {
    const result = new Map<string, Slot[]>();
    
    // Process spaces in parallel for better performance
    const promises = request.spaceIds.map(async (spaceId) => {
      const slots = await this.getDayAvailability(spaceId, request.date);
      return { spaceId, slots };
    });
    
    const results = await Promise.all(promises);
    results.forEach(({ spaceId, slots }) => {
      result.set(spaceId, slots);
    });
    
    return result;
  }

  /**
   * Real-time availability check (optimized for frequent calls)
   */
  async checkRealTimeAvailability(request: AvailabilityRequest): Promise<boolean> {
    const cacheKey = `realtime_${request.spaceId}_${request.startTime}_${request.endTime}`;
    const cached = this.getCachedResult(cacheKey);
    
    if (cached) {
      return !cached.hasConflict;
    }
    
    // Quick conflict check without suggestions
    const result = await this.checkAvailability({
      ...request,
      checkBusinessRules: false // Skip time-consuming business rule checks for real-time
    });
    
    this.setCachedResult(cacheKey, result);
    return !result.hasConflict;
  }

  /**
   * Validate basic booking requirements
   */
  private validateBasicRequirements(request: AvailabilityRequest, result: AvailabilityResponse): void {
    const startTime = typeof request.startTime === 'string' ? parseISO(request.startTime) : request.startTime;
    const endTime = typeof request.endTime === 'string' ? parseISO(request.endTime) : request.endTime;
    
    // Time validation
    if (!startTime || !endTime) {
      result.errors.push({
        code: 'MISSING_TIME',
        message: 'Both start and end times are required'
      });
      return;
    }
    
    if (!isAfter(endTime, startTime)) {
      result.errors.push({
        code: 'INVALID_TIME_RANGE',
        message: 'End time must be after start time'
      });
    }
    
    // Duration validation
    const duration = differenceInMinutes(endTime, startTime);
    if (duration < this.businessRules.durationLimits.minimum) {
      result.errors.push({
        code: 'DURATION_TOO_SHORT',
        message: `Minimum booking duration is ${this.businessRules.durationLimits.minimum} minutes`
      });
    }
    
    if (duration > this.businessRules.durationLimits.maximum) {
      result.errors.push({
        code: 'DURATION_TOO_LONG',
        message: `Maximum booking duration is ${this.businessRules.durationLimits.maximum} minutes`
      });
    }
    
    // Space ID validation
    if (!request.spaceId) {
      result.errors.push({
        code: 'MISSING_SPACE_ID',
        message: 'Space ID is required'
      });
    }
  }

  /**
   * Validate business rules
   */
  private async validateBusinessRules(
    startTime: Date, 
    endTime: Date, 
    result: AvailabilityResponse
  ): Promise<void> {
    // Operating hours validation
    if (!this.isWithinOperatingHours(startTime, endTime)) {
      result.conflicts.push({
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        reference: `Operating hours: ${this.businessRules.operatingHours.start} - ${this.businessRules.operatingHours.end}`
      });
    }
    
    // Weekend booking validation
    if (!this.businessRules.weekendBooking && this.isWeekend(startTime)) {
      result.conflicts.push({
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        reference: 'Weekend bookings not allowed'
      });
    }
    
    // Advance booking validation
    const now = new Date();
    const hoursUntilBooking = differenceInMinutes(startTime, now) / 60;
    
    if (hoursUntilBooking < this.businessRules.advanceBookingLimits.minimum) {
      result.conflicts.push({
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        reference: `Advance booking required: ${this.businessRules.advanceBookingLimits.minimum} hours`
      });
    }
    
    const daysUntilBooking = hoursUntilBooking / 24;
    if (daysUntilBooking > this.businessRules.advanceBookingLimits.maximum) {
      result.conflicts.push({
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        reference: `Maximum advance booking: ${this.businessRules.advanceBookingLimits.maximum} days`
      });
    }
    
    // Same-day booking cutoff
    if (isToday(startTime)) {
      const cutoffTime = this.parseTimeToDate(startTime, this.businessRules.sameDayBookingCutoff);
      if (isAfter(now, cutoffTime)) {
        result.conflicts.push({
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          reference: `Same-day cutoff: ${this.businessRules.sameDayBookingCutoff}`
        });
      }
    }
  }

  /**
   * Detect booking conflicts with existing reservations
   */
  private async detectConflicts(
    request: AvailabilityRequest, 
    startTime: Date, 
    endTime: Date, 
    result: AvailabilityResponse
  ): Promise<void> {
    const existingBookings = await this.getExistingBookings(
      request.spaceId, 
      startTime, 
      endTime, 
      request.excludeBookingId
    );
    
    for (const booking of existingBookings) {
      const bookingStart = parseISO(booking.startTime);
      const bookingEnd = parseISO(booking.endTime);
      
      // Check for direct overlap
      if (this.hasTimeOverlap(startTime, endTime, bookingStart, bookingEnd)) {
        result.conflicts.push({
          bookingId: booking._id,
          start: bookingStart.toISOString(),
          end: bookingEnd.toISOString(),
          spaceId: typeof booking.spaceId === 'string' ? booking.spaceId : booking.spaceId._id,
          reference: `Existing booking conflict`
        });
      }
      
      // Check for buffer time violation
      else if (this.violatesBufferTime(startTime, endTime, bookingStart, bookingEnd)) {
        result.conflicts.push({
          bookingId: booking._id,
          start: bookingStart.toISOString(),
          end: bookingEnd.toISOString(),
          spaceId: typeof booking.spaceId === 'string' ? booking.spaceId : booking.spaceId._id,
          reference: `Buffer time violation: ${this.businessRules.bufferTime} min required`
        });
      }
    }
  }

  /**
   * Generate alternative time slot suggestions
   */
  private async generateAlternativeSlots(
    request: AvailabilityRequest, 
    originalStart: Date, 
    originalEnd: Date
  ): Promise<Slot[]> {
    const duration = differenceInMinutes(originalEnd, originalStart);
    const suggestions: Slot[] = [];
    const daySlots = await this.getDayAvailability(request.spaceId, originalStart);
    
    // Find consecutive available slots that match the duration
    for (let i = 0; i < daySlots.length; i++) {
      if (!daySlots[i].available) continue;
      
      let consecutiveSlots = [daySlots[i]];
      let totalDuration = 30; // Each slot is 30 minutes
      
      // Look for consecutive available slots
      for (let j = i + 1; j < daySlots.length && totalDuration < duration; j++) {
        if (!daySlots[j].available) break;
        consecutiveSlots.push(daySlots[j]);
        totalDuration += 30;
      }
      
      // If we have enough consecutive slots, add as suggestion
      if (totalDuration >= duration) {
        const startTime = new Date(consecutiveSlots[0].start);
        suggestions.push({
          start: startTime.toISOString(),
          end: addMinutes(startTime, duration).toISOString(),
          available: true
        });
      }
      
      // Limit suggestions to avoid overwhelming user
      if (suggestions.length >= 5) break;
    }
    
    return suggestions;
  }

  /**
   * Get existing bookings for conflict detection
   */
  private async getExistingBookings(
    spaceId: string, 
    startTime: Date, 
    endTime: Date, 
    excludeBookingId?: string
  ): Promise<BookingData[]> {
    try {
      const response = await bookingApiService.getBookings({
        spaceId,
        startDate: format(startOfDay(startTime), 'yyyy-MM-dd'),
        endDate: format(endOfDay(endTime), 'yyyy-MM-dd'),
        status: 'Confirmed' as BookingStatus // Only check confirmed bookings
      });
      
      let bookings = response.data.data?.bookings || [];
      
      // Filter out the booking being edited
      if (excludeBookingId) {
        bookings = bookings.filter(b => b._id !== excludeBookingId);
      }
      
      return bookings;
    } catch (error) {
      console.error('Failed to fetch existing bookings:', error);
      throw new Error('Unable to check for booking conflicts');
    }
  }

  /**
   * Check if two time ranges overlap
   */
  private hasTimeOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return isBefore(start1, end2) && isAfter(end1, start2);
  }

  /**
   * Check if any existing bookings conflict with the time range
   */
  private hasTimeConflict(startTime: Date, endTime: Date, existingBookings: BookingData[]): boolean {
    return existingBookings.some(booking => {
      const bookingStart = parseISO(booking.startTime);
      const bookingEnd = parseISO(booking.endTime);
      return this.hasTimeOverlap(startTime, endTime, bookingStart, bookingEnd);
    });
  }

  /**
   * Check if proposed time violates buffer time requirements
   */
  private violatesBufferTime(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    const bufferMinutes = this.businessRules.bufferTime;
    
    // Check if proposed booking ends too close to existing booking start
    const minutesToExistingStart = differenceInMinutes(start2, end1);
    if (minutesToExistingStart > 0 && minutesToExistingStart < bufferMinutes) {
      return true;
    }
    
    // Check if proposed booking starts too close to existing booking end
    const minutesFromExistingEnd = differenceInMinutes(start1, end2);
    if (minutesFromExistingEnd > 0 && minutesFromExistingEnd < bufferMinutes) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if time is within operating hours
   */
  private isWithinOperatingHours(startTime: Date, endTime: Date): boolean {
    const dayStart = this.parseTimeToDate(startTime, this.businessRules.operatingHours.start);
    const dayEnd = this.parseTimeToDate(startTime, this.businessRules.operatingHours.end);
    
    return !isBefore(startTime, dayStart) && !isAfter(endTime, dayEnd);
  }


  /**
   * Check if date is weekend
   */
  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  /**
   * Parse time string to Date object for specific date
   */
  private parseTimeToDate(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  /**
   * Cache management
   */
  private getCachedResult(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedResult(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    
    // Clean up old cache entries
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Update business rules
   */
  updateBusinessRules(rules: Partial<BusinessRules>): void {
    this.businessRules = { ...this.businessRules, ...rules };
    this.cache.clear(); // Clear cache when rules change
  }
}

// Export default instance
export const bookingAvailabilityService = new BookingAvailabilityService();