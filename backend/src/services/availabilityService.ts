import { Booking } from '../models/Booking';
import { Space } from '../models/Space';
import { ResourceUnit } from '../models/ResourceUnit';
import { Types } from 'mongoose';

export interface CapacityCheckResult {
  available: boolean;
  reason?: string;
  details?: {
    capacity: number | null;
    overlapping: number;
    availableUnitId?: string;
  };
}

export class AvailabilityService {
  /**
   * Check if a space has capacity for a new booking in the given time range
   */
  async checkCapacity(
    spaceId: string,
    startTime: Date,
    endTime: Date,
    organizationId: string,
    excludeBookingId?: string
  ): Promise<CapacityCheckResult> {
    // Find the space
    const space = await Space.findOne({
      _id: spaceId,
      organizationId
    });

    if (!space) {
      return {
        available: false,
        reason: 'Space not found'
      };
    }

    // If capacity is null (unlimited), always available
    if (space.capacity === null) {
      return {
        available: true,
        details: {
          capacity: null,
          overlapping: 0
        }
      };
    }

    // Get overlapping active bookings
    const overlappingBookings = await this.getOverlappingBookings(
      spaceId,
      startTime,
      endTime,
      organizationId,
      excludeBookingId
    );

    // For capacity > 1 and hasPooledUnits=false (pooled capacity without explicit units)
    if (space.capacity > 1 && !space.hasPooledUnits) {
      const available = overlappingBookings.length < space.capacity;
      
      return {
        available,
        reason: available ? undefined : 'OVER_CAPACITY',
        details: {
          capacity: space.capacity,
          overlapping: overlappingBookings.length
        }
      };
    }

    // For hasPooledUnits=true
    if (space.hasPooledUnits) {
      return this.checkPooledUnitsCapacity(
        spaceId,
        startTime,
        endTime,
        organizationId,
        overlappingBookings,
        space.capacity
      );
    }

    // Default single-unit behavior (capacity=1, no pooled units)
    // Keep existing overlap rule [start, end) for single-unit spaces
    const available = overlappingBookings.length === 0;
    
    return {
      available,
      reason: available ? undefined : 'OVER_CAPACITY',
      details: {
        capacity: space.capacity,
        overlapping: overlappingBookings.length
      }
    };
  }

  /**
   * Check capacity for spaces with pooled units
   */
  private async checkPooledUnitsCapacity(
    spaceId: string,
    startTime: Date,
    endTime: Date,
    organizationId: string,
    overlappingBookings: any[],
    capacity: number
  ): Promise<CapacityCheckResult> {
    // Get all active resource units for this space
    const resourceUnits = await ResourceUnit.find({
      spaceId,
      organizationId,
      status: 'Active'
    });

    if (resourceUnits.length === 0) {
      return {
        available: false,
        reason: 'OVER_CAPACITY',
        details: {
          capacity,
          overlapping: overlappingBookings.length
        }
      };
    }

    // Get resource unit IDs that are already booked in the overlapping time range
    const bookedUnitIds = new Set(
      overlappingBookings
        .map(booking => booking.resourceUnitId?.toString())
        .filter(Boolean)
    );

    // Find any ResourceUnit not used by an overlapping active booking
    const availableUnit = resourceUnits.find(
      unit => !bookedUnitIds.has(unit._id.toString())
    );

    if (availableUnit) {
      return {
        available: true,
        details: {
          capacity,
          overlapping: overlappingBookings.length,
          availableUnitId: availableUnit._id.toString()
        }
      };
    }

    return {
      available: false,
      reason: 'OVER_CAPACITY',
      details: {
        capacity,
        overlapping: overlappingBookings.length
      }
    };
  }

  /**
   * Get overlapping active bookings for a time range
   */
  private async getOverlappingBookings(
    spaceId: string,
    startTime: Date,
    endTime: Date,
    organizationId: string,
    excludeBookingId?: string
  ) {
    const query: any = {
      spaceId,
      organizationId,
      status: { $in: ['Pending', 'Confirmed'] },
      // Overlap detection: booking overlaps if it starts before our end and ends after our start
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    return Booking.find(query);
  }

  /**
   * Assign a resource unit to a booking for spaces with pooled units
   */
  async assignResourceUnit(
    spaceId: string,
    startTime: Date,
    endTime: Date,
    organizationId: string
  ): Promise<string | null> {
    const capacityResult = await this.checkCapacity(
      spaceId,
      startTime,
      endTime,
      organizationId
    );

    if (capacityResult.available && capacityResult.details?.availableUnitId) {
      return capacityResult.details.availableUnitId;
    }

    return null;
  }

  /**
   * Generate resource units for a space
   */
  async generateResourceUnits(
    spaceId: string,
    organizationId: string,
    count: number,
    labelPrefix: string = 'Unit'
  ): Promise<void> {
    // Check how many units already exist
    const existingUnits = await ResourceUnit.find({
      spaceId,
      organizationId
    });

    const existingCount = existingUnits.length;
    const unitsToCreate = Math.max(0, count - existingCount);

    if (unitsToCreate === 0) {
      return; // Idempotent: don't duplicate if already exists
    }

    // Create missing units
    const newUnits = [];
    for (let i = existingCount + 1; i <= count; i++) {
      newUnits.push({
        organizationId: new Types.ObjectId(organizationId),
        spaceId: new Types.ObjectId(spaceId),
        label: `${labelPrefix} #${i}`,
        status: 'Active'
      });
    }

    if (newUnits.length > 0) {
      await ResourceUnit.insertMany(newUnits);
    }
  }
}

export const availabilityService = new AvailabilityService();