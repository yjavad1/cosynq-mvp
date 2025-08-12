import { Response } from 'express';
import { Space, SpaceType, SpaceStatus } from '../models/Space';
import { AuthRequest } from '../middleware/auth';
import Joi from 'joi';
import mongoose from 'mongoose';

const workingHoursSchema = Joi.object({
  day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
  isOpen: Joi.boolean().required(),
  openTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).when('isOpen', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  closeTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).when('isOpen', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const spaceRatesSchema = Joi.object({
  hourly: Joi.number().min(0).optional(),
  daily: Joi.number().min(0).optional(),
  weekly: Joi.number().min(0).optional(),
  monthly: Joi.number().min(0).optional(),
  currency: Joi.string().length(3).uppercase().default('USD')
});

const createSpaceSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().max(1000).allow('').optional(),
  type: Joi.string().valid('Hot Desk', 'Meeting Room', 'Private Office').required(),
  status: Joi.string().valid('Available', 'Occupied', 'Maintenance', 'Out of Service').default('Available'),
  capacity: Joi.number().integer().min(1).max(100).required(),
  area: Joi.number().min(0).optional(),
  floor: Joi.string().trim().max(10).allow('').optional(),
  room: Joi.string().trim().max(20).allow('').optional(),
  rates: spaceRatesSchema.required(),
  amenities: Joi.array().items(Joi.string().trim().max(50)).default([]),
  equipment: Joi.array().items(Joi.string().trim().max(50)).default([]),
  workingHours: Joi.array().items(workingHoursSchema).min(1).required(),
  isActive: Joi.boolean().default(true),
  minimumBookingDuration: Joi.number().integer().min(15).max(1440).default(60),
  maximumBookingDuration: Joi.number().integer().min(15).max(1440).default(480),
  advanceBookingLimit: Joi.number().integer().min(0).max(365).default(30),
  allowSameDayBooking: Joi.boolean().default(true),
  images: Joi.array().items(Joi.string().trim()).default([])
});

const updateSpaceSchema = createSpaceSchema.fork(
  ['name', 'type', 'capacity', 'rates', 'workingHours'],
  (schema) => schema.optional()
);

export const createSpace = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Creating space with data:', JSON.stringify(req.body, null, 2));
    
    const { error, value } = createSpaceSchema.validate(req.body);
    if (error) {
      console.error('Space validation error:', error.details);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Check if space with same name exists for this organization
    const existingSpace = await Space.findOne({
      organizationId: user._id,
      name: value.name
    });

    if (existingSpace) {
      return res.status(409).json({
        success: false,
        message: 'A space with this name already exists in your organization'
      });
    }

    // Validate working hours don't have duplicates
    const days = value.workingHours.map((wh: any) => wh.day);
    if (days.length !== new Set(days).size) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate days found in working hours'
      });
    }

    // Ensure at least one rate is provided
    const hasRate = value.rates.hourly || value.rates.daily || value.rates.weekly || value.rates.monthly;
    if (!hasRate) {
      return res.status(400).json({
        success: false,
        message: 'At least one rate (hourly, daily, weekly, or monthly) must be provided'
      });
    }

    const space = new Space({
      ...value,
      organizationId: user._id,
      createdBy: user._id,
      updatedBy: user._id
    });

    await space.save();

    const populatedSpace = await Space.findById(space._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Space created successfully',
      data: { space: populatedSpace }
    });
  } catch (error) {
    console.error('Create space error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getSpaces = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const type = req.query.type as SpaceType;
    const status = req.query.status as SpaceStatus;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const minCapacity = req.query.minCapacity ? parseInt(req.query.minCapacity as string) : undefined;
    const maxCapacity = req.query.maxCapacity ? parseInt(req.query.maxCapacity as string) : undefined;
    const amenities = req.query.amenities as string;

    // Build filter query
    const filter: any = { organizationId: user._id };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { floor: { $regex: search, $options: 'i' } },
        { room: { $regex: search, $options: 'i' } }
      ];
    }

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (isActive !== undefined) filter.isActive = isActive;
    if (minCapacity) filter.capacity = { ...filter.capacity, $gte: minCapacity };
    if (maxCapacity) filter.capacity = { ...filter.capacity, $lte: maxCapacity };
    
    if (amenities) {
      const amenityArray = amenities.split(',').map(a => a.trim());
      filter.amenities = { $in: amenityArray };
    }

    const skip = (page - 1) * limit;

    const [spaces, total] = await Promise.all([
      Space.find(filter)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Space.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        spaces,
        pagination: {
          currentPage: page,
          totalPages,
          totalSpaces: total,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get spaces error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getSpace = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid space ID'
      });
    }

    const space = await Space.findOne({
      _id: id,
      organizationId: user._id
    })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    res.json({
      success: true,
      data: { space }
    });
  } catch (error) {
    console.error('Get space error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateSpace = async (req: AuthRequest, res: Response) => {
  try {
    const { error, value } = updateSpaceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid space ID'
      });
    }

    // Check if updating name and it conflicts with existing space
    if (value.name) {
      const existingSpace = await Space.findOne({
        organizationId: user._id,
        name: value.name,
        _id: { $ne: id }
      });

      if (existingSpace) {
        return res.status(409).json({
          success: false,
          message: 'Another space with this name already exists in your organization'
        });
      }
    }

    // Validate working hours don't have duplicates if provided
    if (value.workingHours) {
      const days = value.workingHours.map((wh: any) => wh.day);
      if (days.length !== new Set(days).size) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate days found in working hours'
        });
      }
    }

    // Ensure at least one rate is provided if rates are being updated
    if (value.rates) {
      const hasRate = value.rates.hourly || value.rates.daily || value.rates.weekly || value.rates.monthly;
      if (!hasRate) {
        return res.status(400).json({
          success: false,
          message: 'At least one rate (hourly, daily, weekly, or monthly) must be provided'
        });
      }
    }

    const space = await Space.findOneAndUpdate(
      { _id: id, organizationId: user._id },
      { ...value, updatedBy: user._id },
      { new: true, runValidators: true }
    );

    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    const populatedSpace = await Space.findById(space._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Space updated successfully',
      data: { space: populatedSpace }
    });
  } catch (error) {
    console.error('Update space error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteSpace = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid space ID'
      });
    }

    // TODO: Add check for existing bookings before allowing deletion
    // For now, we'll allow deletion but this should be enhanced in the booking phase

    const space = await Space.findOneAndDelete({
      _id: id,
      organizationId: user._id
    });

    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    res.json({
      success: true,
      message: 'Space deleted successfully'
    });
  } catch (error) {
    console.error('Delete space error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getSpaceAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const spaceId = req.query.spaceId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    // Validation
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    // Build query
    const query: any = { 
      organizationId: user._id,
      isActive: true
    };

    if (spaceId) {
      if (!mongoose.Types.ObjectId.isValid(spaceId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid space ID'
        });
      }
      query._id = spaceId;
    }

    const spaces = await Space.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    // For each space, calculate availability for the date range
    const availability = spaces.map(space => {
      const schedule = [];
      const current = new Date(start);
      
      while (current <= end) {
        const dayName = current.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const workingHours = space.getWorkingHoursForDay(dayName);
        
        schedule.push({
          date: current.toISOString().split('T')[0],
          dayOfWeek: dayName,
          isAvailable: space.isAvailableAt(current),
          workingHours: workingHours ? {
            isOpen: workingHours.isOpen,
            openTime: workingHours.openTime,
            closeTime: workingHours.closeTime
          } : null,
          status: space.status
        });
        
        current.setDate(current.getDate() + 1);
      }

      return {
        space: {
          _id: space._id,
          name: space.name,
          type: space.type,
          capacity: space.capacity,
          status: space.status,
          rates: space.rates
        },
        availability: schedule
      };
    });

    res.json({
      success: true,
      data: {
        dateRange: {
          startDate: startDate,
          endDate: endDate
        },
        availability
      }
    });
  } catch (error) {
    console.error('Get space availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getSpaceStats = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const stats = await Space.aggregate([
      { $match: { organizationId: user._id } },
      {
        $facet: {
          totalSpaces: [{ $count: "count" }],
          spacesByType: [
            { $group: { _id: "$type", count: { $sum: 1 } } }
          ],
          spacesByStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } }
          ],
          totalCapacity: [
            { $group: { _id: null, total: { $sum: "$capacity" } } }
          ],
          averageRates: [
            {
              $group: {
                _id: null,
                avgHourly: { $avg: "$rates.hourly" },
                avgDaily: { $avg: "$rates.daily" }
              }
            }
          ]
        }
      }
    ]);

    const result = stats[0];

    res.json({
      success: true,
      data: {
        totalSpaces: result.totalSpaces[0]?.count || 0,
        spacesByType: result.spacesByType,
        spacesByStatus: result.spacesByStatus,
        totalCapacity: result.totalCapacity[0]?.total || 0,
        averageRates: result.averageRates[0] || { avgHourly: 0, avgDaily: 0 }
      }
    });
  } catch (error) {
    console.error('Get space stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};