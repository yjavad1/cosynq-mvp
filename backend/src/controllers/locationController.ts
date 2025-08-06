import { Response } from 'express';
import { Location, ILocation, AmenityType, DayOfWeek } from '../models/Location';
import { AuthRequest } from '../middleware/auth';
import Joi from 'joi';
import mongoose from 'mongoose';

// Validation schemas
const operatingHoursSchema = Joi.object({
  day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
  isOpen: Joi.boolean().required(),
  openTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).when('isOpen', { is: true, then: Joi.required() }),
  closeTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).when('isOpen', { is: true, then: Joi.required() }),
  isHoliday: Joi.boolean().optional(),
  notes: Joi.string().max(200).trim().allow('').optional()
});

const locationContactSchema = Joi.object({
  type: Joi.string().valid('phone', 'email', 'whatsapp', 'emergency').required(),
  value: Joi.string().trim().max(100).required(),
  isPrimary: Joi.boolean().optional(),
  label: Joi.string().trim().max(50).allow('').optional()
});

const locationAddressSchema = Joi.object({
  street: Joi.string().trim().max(200).required(),
  city: Joi.string().trim().max(100).required(),
  state: Joi.string().trim().max(100).required(),
  zipCode: Joi.string().trim().max(20).required(),
  country: Joi.string().trim().max(100).default('India'),
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180)
  }).optional(),
  landmark: Joi.string().trim().max(200).allow('').optional(),
  floor: Joi.string().trim().max(50).allow('').optional(),
  unitNumber: Joi.string().trim().max(50).allow('').optional()
});

const createLocationSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().max(500).allow('').optional(),
  code: Joi.string().trim().uppercase().max(20).pattern(/^[A-Z0-9_]+$/).required(),
  address: locationAddressSchema.required(),
  contacts: Joi.array().items(locationContactSchema).min(1).required(),
  operatingHours: Joi.array().items(operatingHoursSchema).length(7).required(),
  timezone: Joi.string().default('Asia/Kolkata'),
  amenities: Joi.array().items(Joi.string().valid(
    'WiFi', 'AC', 'Parking', 'Coffee', 'Security', 'Reception', 
    'Kitchen', 'Printer', 'Scanner', 'Whiteboard', 'Projector', 
    'Conference_Room', 'Phone_Booth', 'Lounge', 'Gym', 'Shower', 
    'Bike_Storage', 'Mail_Service', 'Cleaning_Service', 'Catering', 
    'Event_Space', 'Terrace', 'Garden', 'Handicap_Accessible'
  )).optional(),
  totalFloors: Joi.number().integer().min(1).max(200).optional(),
  totalCapacity: Joi.number().integer().min(1).max(10000).optional(),
  isActive: Joi.boolean().default(true),
  allowSameDayBooking: Joi.boolean().default(true),
  defaultBookingRules: Joi.object({
    minimumBookingDuration: Joi.number().integer().min(15).default(60),
    maximumBookingDuration: Joi.number().integer().min(15).default(480),
    advanceBookingLimit: Joi.number().integer().min(1).default(30),
    cancellationPolicy: Joi.string().trim().max(500).allow('').optional()
  }).optional(),
  images: Joi.array().items(Joi.string().trim().max(500)).optional(),
  virtualTourUrl: Joi.string().trim().max(500).allow('').optional(),
  managerId: Joi.string().allow('').optional(),
  staff: Joi.array().items(Joi.string()).optional()
});

const updateLocationSchema = createLocationSchema.fork(
  ['name', 'code', 'address', 'contacts', 'operatingHours'], 
  (schema) => schema.optional()
);

// Helper function to ensure user is authenticated
const ensureAuthenticated = (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return false;
  }
  return true;
};

// Get all locations for the organization with filtering, pagination, and search
export const getLocations = async (req: AuthRequest, res: Response) => {
  try {
    if (!ensureAuthenticated(req, res)) return;
    
    const organizationId = req.user!._id;
    const {
      page = '1',
      limit = '10',
      search = '',
      isActive,
      city,
      state,
      amenities,
      minCapacity,
      maxCapacity
    } = req.query;

    console.log('=== GET LOCATIONS REQUEST ===');
    console.log('Organization ID:', organizationId);
    console.log('Query params:', req.query);

    // Build filter
    const filter: any = { organizationId };
    
    if (search && typeof search === 'string' && search.trim()) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.state': { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (city) {
      filter['address.city'] = city;
    }

    if (state) {
      filter['address.state'] = state;
    }

    if (amenities) {
      const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
      filter.amenities = { $in: amenitiesArray };
    }

    if (minCapacity || maxCapacity) {
      filter.totalCapacity = {};
      if (minCapacity) filter.totalCapacity.$gte = parseInt(minCapacity as string);
      if (maxCapacity) filter.totalCapacity.$lte = parseInt(maxCapacity as string);
    }

    console.log('Filter:', JSON.stringify(filter, null, 2));

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const [locations, total] = await Promise.all([
      Location.find(filter)
        .populate('createdBy', 'firstName lastName')
        .populate('managerId', 'firstName lastName')
        .populate('staff', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Location.countDocuments(filter)
    ]);

    console.log('Found locations:', locations.length);
    console.log('Total count:', total);

    const totalPages = Math.ceil(total / limitNum);
    
    res.json({
      success: true,
      data: {
        locations,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });
  } catch (error: any) {
    console.error('Error in getLocations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locations',
      error: error.message
    });
  }
};

// Get a single location by ID
export const getLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!ensureAuthenticated(req, res)) return;
    const organizationId = req.user!._id;

    console.log('=== GET LOCATION REQUEST ===');
    console.log('Location ID:', id);
    console.log('Organization ID:', organizationId);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID'
      });
    }

    const location = await Location.findOne({ _id: id, organizationId })
      .populate('createdBy', 'firstName lastName')
      .populate('managerId', 'firstName lastName')
      .populate('staff', 'firstName lastName');

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    console.log('Found location:', location.name);
    res.json({ success: true, data: location });
  } catch (error: any) {
    console.error('Error in getLocation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location',
      error: error.message
    });
  }
};

// Create a new location
export const createLocation = async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== CREATE LOCATION REQUEST ===');
    const { error, value } = createLocationSchema.validate(req.body);
    if (error) {
      console.error('Validation error details:', error.details);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    if (!ensureAuthenticated(req, res)) return;
    const organizationId = req.user!._id;
    const userId = req.user!._id;

    console.log('Organization ID:', organizationId);
    console.log('Location data:', JSON.stringify(value, null, 2));

    // Check if location code already exists for this organization
    const existingLocation = await Location.findOne({
      organizationId,
      code: value.code
    });

    if (existingLocation) {
      return res.status(409).json({
        success: false,
        message: 'Location with this code already exists in your organization'
      });
    }

    // Ensure at least one primary contact
    const contacts = value.contacts || [];
    const hasPrimary = contacts.some((contact: any) => contact.isPrimary);
    if (!hasPrimary && contacts.length > 0) {
      contacts[0].isPrimary = true;
    }

    const location = new Location({
      ...value,
      organizationId,
      createdBy: userId,
      updatedBy: userId,
      contacts
    });

    await location.save();
    await location.populate('createdBy', 'firstName lastName');
    
    console.log('Location created successfully:', location._id);
    res.status(201).json({ success: true, data: location });
  } catch (error: any) {
    console.error('Error in createLocation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create location',
      error: error.message
    });
  }
};

// Update an existing location
export const updateLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!ensureAuthenticated(req, res)) return;
    const organizationId = req.user!._id;
    const userId = req.user!._id;

    console.log('=== UPDATE LOCATION REQUEST ===');
    console.log('Location ID:', id);
    console.log('Organization ID:', organizationId);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID'
      });
    }

    const { error, value } = updateLocationSchema.validate(req.body);
    if (error) {
      console.error('Validation error details:', error.details);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Check if location exists and belongs to this organization
    const existingLocation = await Location.findOne({ _id: id, organizationId });
    if (!existingLocation) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Check if code is being changed and if new code already exists
    if (value.code && value.code !== existingLocation.code) {
      const codeExists = await Location.findOne({
        organizationId,
        code: value.code,
        _id: { $ne: id }
      });

      if (codeExists) {
        return res.status(409).json({
          success: false,
          message: 'Location with this code already exists in your organization'
        });
      }
    }

    // Ensure at least one primary contact if contacts are provided
    if (value.contacts && value.contacts.length > 0) {
      const hasPrimary = value.contacts.some((contact: any) => contact.isPrimary);
      if (!hasPrimary) {
        value.contacts[0].isPrimary = true;
      }
    }

    const location = await Location.findOneAndUpdate(
      { _id: id, organizationId },
      { ...value, updatedBy: userId, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName')
     .populate('managerId', 'firstName lastName')
     .populate('staff', 'firstName lastName');

    console.log('Location updated successfully:', location!._id);
    res.json({ success: true, data: location });
  } catch (error: any) {
    console.error('Error in updateLocation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};

// Delete a location
export const deleteLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!ensureAuthenticated(req, res)) return;
    const organizationId = req.user!._id;

    console.log('=== DELETE LOCATION REQUEST ===');
    console.log('Location ID:', id);
    console.log('Organization ID:', organizationId);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID'
      });
    }

    const location = await Location.findOneAndDelete({ _id: id, organizationId });
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    console.log('Location deleted successfully:', location.name);
    res.json({ success: true, message: 'Location deleted successfully' });
  } catch (error: any) {
    console.error('Error in deleteLocation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete location',
      error: error.message
    });
  }
};

// Get location statistics
export const getLocationStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!ensureAuthenticated(req, res)) return;
    const organizationId = req.user!._id;

    console.log('=== GET LOCATION STATS REQUEST ===');
    console.log('Organization ID:', organizationId);

    const totalLocations = await Location.countDocuments({ organizationId });
    const activeLocations = await Location.countDocuments({ organizationId, isActive: true });
    const inactiveLocations = totalLocations - activeLocations;

    // Aggregate by city
    const locationsByCity = await Location.aggregate([
      { $match: { organizationId } },
      { $group: { _id: '$address.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Aggregate amenities
    const amenityStats = await Location.aggregate([
      { $match: { organizationId } },
      { $unwind: '$amenities' },
      { $group: { _id: '$amenities', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Calculate average capacity
    const capacityStats = await Location.aggregate([
      { $match: { organizationId, totalCapacity: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgCapacity: { $avg: '$totalCapacity' }, totalCapacity: { $sum: '$totalCapacity' } } }
    ]);

    const stats = {
      totalLocations,
      activeLocations,
      inactiveLocations,
      averageCapacity: capacityStats[0]?.avgCapacity || 0,
      totalCapacity: capacityStats[0]?.totalCapacity || 0,
      locationsByCity: locationsByCity.map(item => ({ city: item._id, count: item.count })),
      popularAmenities: amenityStats.map(item => ({ amenity: item._id, count: item.count }))
    };

    console.log('Location stats calculated:', stats);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error in getLocationStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location statistics',
      error: error.message
    });
  }
};

// Check location hours for a specific date/time
export const checkLocationHours = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!ensureAuthenticated(req, res)) return;
    const organizationId = req.user!._id;

    console.log('=== CHECK LOCATION HOURS REQUEST ===');
    console.log('Location ID:', id);
    console.log('Organization ID:', organizationId);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID'
      });
    }

    const location = await Location.findOne({ _id: id, organizationId });
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    const now = new Date();
    const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()] as DayOfWeek;
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    const todayHours = location.operatingHours.find(h => h.day === currentDay);
    const isOpen = todayHours?.isOpen && !todayHours.isHoliday && 
                   todayHours.openTime && todayHours.closeTime &&
                   currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;

    const response = {
      isOpen: !!isOpen,
      currentTime: now.toLocaleTimeString('en-US', { 
        timeZone: location.timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }),
      todayHours: todayHours || null,
      allHours: location.operatingHours
    };

    console.log('Location hours response:', response);
    res.json({ success: true, data: response });
  } catch (error: any) {
    console.error('Error in checkLocationHours:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check location hours',
      error: error.message
    });
  }
};