import { AvailabilityService } from '../services/availabilityService';
import { Space } from '../models/Space';
import { Booking } from '../models/Booking';
import { ResourceUnit } from '../models/ResourceUnit';
import mongoose from 'mongoose';

// Mock the models
jest.mock('../models/Space');
jest.mock('../models/Booking');
jest.mock('../models/ResourceUnit');

const MockedSpace = Space as jest.Mocked<typeof Space>;
const MockedBooking = Booking as jest.Mocked<typeof Booking>;
const MockedResourceUnit = ResourceUnit as jest.Mocked<typeof ResourceUnit>;

describe('AvailabilityService', () => {
  let availabilityService: AvailabilityService;
  const mockOrganizationId = '507f1f77bcf86cd799439011';
  const mockSpaceId = '507f1f77bcf86cd799439012';
  const startTime = new Date('2024-01-01T10:00:00Z');
  const endTime = new Date('2024-01-01T11:00:00Z');

  beforeEach(() => {
    availabilityService = new AvailabilityService();
    jest.clearAllMocks();
  });

  describe('checkCapacity', () => {
    it('should return available=true for unlimited capacity spaces', async () => {
      // Mock space with unlimited capacity
      MockedSpace.findOne = jest.fn().mockResolvedValue({
        _id: mockSpaceId,
        capacity: null, // unlimited
        hasPooledUnits: false
      });

      const result = await availabilityService.checkCapacity(
        mockSpaceId,
        startTime,
        endTime,
        mockOrganizationId
      );

      expect(result.available).toBe(true);
      expect(result.details?.capacity).toBe(null);
    });

    it('should enforce capacity limit for spaces without pooled units', async () => {
      // Mock space with capacity=3, no pooled units
      MockedSpace.findOne = jest.fn().mockResolvedValue({
        _id: mockSpaceId,
        capacity: 3,
        hasPooledUnits: false
      });

      // Mock 2 overlapping bookings
      MockedBooking.find = jest.fn().mockResolvedValue([
        { _id: '1', spaceId: mockSpaceId },
        { _id: '2', spaceId: mockSpaceId }
      ]);

      const result = await availabilityService.checkCapacity(
        mockSpaceId,
        startTime,
        endTime,
        mockOrganizationId
      );

      expect(result.available).toBe(true);
      expect(result.details?.capacity).toBe(3);
      expect(result.details?.overlapping).toBe(2);
    });

    it('should return OVER_CAPACITY when capacity limit is reached', async () => {
      // Mock space with capacity=3, no pooled units
      MockedSpace.findOne = jest.fn().mockResolvedValue({
        _id: mockSpaceId,
        capacity: 3,
        hasPooledUnits: false
      });

      // Mock 3 overlapping bookings (at capacity)
      MockedBooking.find = jest.fn().mockResolvedValue([
        { _id: '1', spaceId: mockSpaceId },
        { _id: '2', spaceId: mockSpaceId },
        { _id: '3', spaceId: mockSpaceId }
      ]);

      const result = await availabilityService.checkCapacity(
        mockSpaceId,
        startTime,
        endTime,
        mockOrganizationId
      );

      expect(result.available).toBe(false);
      expect(result.reason).toBe('OVER_CAPACITY');
      expect(result.details?.capacity).toBe(3);
      expect(result.details?.overlapping).toBe(3);
    });

    it('should handle pooled units correctly', async () => {
      // Mock space with pooled units
      MockedSpace.findOne = jest.fn().mockResolvedValue({
        _id: mockSpaceId,
        capacity: 3,
        hasPooledUnits: true
      });

      // Mock available resource units
      MockedResourceUnit.find = jest.fn().mockResolvedValue([
        { _id: 'unit1', spaceId: mockSpaceId, status: 'Active' },
        { _id: 'unit2', spaceId: mockSpaceId, status: 'Active' },
        { _id: 'unit3', spaceId: mockSpaceId, status: 'Active' }
      ]);

      // Mock 2 overlapping bookings using 2 units
      MockedBooking.find = jest.fn().mockResolvedValue([
        { _id: '1', spaceId: mockSpaceId, resourceUnitId: 'unit1' },
        { _id: '2', spaceId: mockSpaceId, resourceUnitId: 'unit2' }
      ]);

      const result = await availabilityService.checkCapacity(
        mockSpaceId,
        startTime,
        endTime,
        mockOrganizationId
      );

      expect(result.available).toBe(true);
      expect(result.details?.availableUnitId).toBe('unit3');
      expect(result.details?.overlapping).toBe(2);
    });

    it('should return OVER_CAPACITY when all pooled units are occupied', async () => {
      // Mock space with pooled units
      MockedSpace.findOne = jest.fn().mockResolvedValue({
        _id: mockSpaceId,
        capacity: 2,
        hasPooledUnits: true
      });

      // Mock available resource units
      MockedResourceUnit.find = jest.fn().mockResolvedValue([
        { _id: 'unit1', spaceId: mockSpaceId, status: 'Active' },
        { _id: 'unit2', spaceId: mockSpaceId, status: 'Active' }
      ]);

      // Mock 2 overlapping bookings using all units
      MockedBooking.find = jest.fn().mockResolvedValue([
        { _id: '1', spaceId: mockSpaceId, resourceUnitId: 'unit1' },
        { _id: '2', spaceId: mockSpaceId, resourceUnitId: 'unit2' }
      ]);

      const result = await availabilityService.checkCapacity(
        mockSpaceId,
        startTime,
        endTime,
        mockOrganizationId
      );

      expect(result.available).toBe(false);
      expect(result.reason).toBe('OVER_CAPACITY');
      expect(result.details?.overlapping).toBe(2);
    });

    it('should handle single-unit spaces (default behavior)', async () => {
      // Mock single-unit space
      MockedSpace.findOne = jest.fn().mockResolvedValue({
        _id: mockSpaceId,
        capacity: 1,
        hasPooledUnits: false
      });

      // Mock no overlapping bookings
      MockedBooking.find = jest.fn().mockResolvedValue([]);

      const result = await availabilityService.checkCapacity(
        mockSpaceId,
        startTime,
        endTime,
        mockOrganizationId
      );

      expect(result.available).toBe(true);
      expect(result.details?.capacity).toBe(1);
      expect(result.details?.overlapping).toBe(0);
    });

    it('should handle single-unit spaces with conflict', async () => {
      // Mock single-unit space
      MockedSpace.findOne = jest.fn().mockResolvedValue({
        _id: mockSpaceId,
        capacity: 1,
        hasPooledUnits: false
      });

      // Mock one overlapping booking
      MockedBooking.find = jest.fn().mockResolvedValue([
        { _id: '1', spaceId: mockSpaceId }
      ]);

      const result = await availabilityService.checkCapacity(
        mockSpaceId,
        startTime,
        endTime,
        mockOrganizationId
      );

      expect(result.available).toBe(false);
      expect(result.reason).toBe('OVER_CAPACITY');
      expect(result.details?.capacity).toBe(1);
      expect(result.details?.overlapping).toBe(1);
    });
  });

  describe('generateResourceUnits', () => {
    it('should create missing resource units', async () => {
      // Mock existing units (2 out of 5)
      MockedResourceUnit.find = jest.fn().mockResolvedValue([
        { _id: 'unit1', label: 'Cabin #1' },
        { _id: 'unit2', label: 'Cabin #2' }
      ]);

      MockedResourceUnit.insertMany = jest.fn().mockResolvedValue([]);

      await availabilityService.generateResourceUnits(
        mockSpaceId,
        mockOrganizationId,
        5,
        'Cabin'
      );

      expect(MockedResourceUnit.insertMany).toHaveBeenCalledWith([
        {
          organizationId: expect.any(mongoose.Types.ObjectId),
          spaceId: expect.any(mongoose.Types.ObjectId),
          label: 'Cabin #3',
          status: 'Active'
        },
        {
          organizationId: expect.any(mongoose.Types.ObjectId),
          spaceId: expect.any(mongoose.Types.ObjectId),
          label: 'Cabin #4',
          status: 'Active'
        },
        {
          organizationId: expect.any(mongoose.Types.ObjectId),
          spaceId: expect.any(mongoose.Types.ObjectId),
          label: 'Cabin #5',
          status: 'Active'
        }
      ]);
    });

    it('should be idempotent - not create duplicates', async () => {
      // Mock all units already exist
      MockedResourceUnit.find = jest.fn().mockResolvedValue([
        { _id: 'unit1', label: 'Unit #1' },
        { _id: 'unit2', label: 'Unit #2' },
        { _id: 'unit3', label: 'Unit #3' }
      ]);

      MockedResourceUnit.insertMany = jest.fn();

      await availabilityService.generateResourceUnits(
        mockSpaceId,
        mockOrganizationId,
        3,
        'Unit'
      );

      expect(MockedResourceUnit.insertMany).not.toHaveBeenCalled();
    });
  });
});