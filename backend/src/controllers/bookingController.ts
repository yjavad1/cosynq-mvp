import { Response } from 'express';
import { Booking } from '../models/Booking';
import { Space } from '../models/Space';
import { Contact } from '../models/Contact';
import { AuthRequest } from '../middleware/auth';
import Joi from 'joi';
import mongoose from 'mongoose';
import { 
  validateBookingTime, 
  generateAvailableTimeSlots, 
  getCurrentTimeInTimezone,
  formatTimeValidationErrors,
  canModifyBooking,
  canCancelBooking,
  DEFAULT_TIME_CONFIG 
} from '../utils/timeValidation';

// Validation schemas
const createBookingSchema = Joi.object({
  spaceId: Joi.string().required(),
  contactId: Joi.string().allow('').optional(),
  startTime: Joi.date().min('now').required(),
  endTime: Joi.date().greater(Joi.ref('startTime')).required(),
  
  // Customer Information (for non-contact bookings)
  customerName: Joi.string().trim().max(100).allow('').optional(),
  customerEmail: Joi.string().email().allow('').optional(),
  customerPhone: Joi.string().trim().max(20).allow('').optional(),
  
  // Booking Details
  purpose: Joi.string().trim().max(200).allow('').optional(),
  attendeeCount: Joi.number().integer().min(1).max(100).required(),
  specialRequests: Joi.string().trim().max(1000).allow('').optional(),
  
  // Pricing
  totalAmount: Joi.number().min(0).required(),
  currency: Joi.string().length(3).uppercase().default('INR'),
  
  // Notes
  notes: Joi.string().trim().max(1000).allow('').optional()
});

const updateBookingSchema = Joi.object({
  startTime: Joi.date().min('now').optional(),
  endTime: Joi.date().when('startTime', {
    is: Joi.exist(),
    then: Joi.date().greater(Joi.ref('startTime')).required(),
    otherwise: Joi.date().optional()
  }),
  
  status: Joi.string().valid('Pending', 'Confirmed', 'Cancelled', 'Completed', 'No Show').optional(),
  
  // Customer Information updates
  customerName: Joi.string().trim().max(100).optional(),
  customerEmail: Joi.string().email().optional(),
  customerPhone: Joi.string().trim().max(20).allow('').optional(),
  
  // Booking Details updates
  purpose: Joi.string().trim().max(200).allow('').optional(),
  attendeeCount: Joi.number().integer().min(1).max(100).optional(),
  specialRequests: Joi.string().trim().max(1000).allow('').optional(),
  
  // Status updates
  paymentStatus: Joi.string().valid('Pending', 'Paid', 'Refunded', 'Failed').optional(),
  cancelReason: Joi.string().trim().max(500).allow('').optional(),
  notes: Joi.string().trim().max(1000).allow('').optional(),
  
  // Check-in/Check-out
  checkedIn: Joi.boolean().optional(),
  checkInTime: Joi.date().optional(),
  checkOutTime: Joi.date().optional()
});

const availabilityQuerySchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'string.pattern.base': 'Date must be in YYYY-MM-DD format'
  }),
  duration: Joi.number().integer().min(15).max(1440).default(60) // in minutes
});

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

// Get all bookings for the organization with filtering, pagination, and search
export const getBookings = async (req: AuthRequest, res: Response) => {
  try {
    if (!ensureAuthenticated(req, res)) return;
    
    const organizationId = req.user!._id;
    const {
      page = '1',
      limit = '10',
      search = '',
      spaceId,
      contactId,
      status,
      startDate,
      endDate,
      sortBy = 'startTime',
      sortOrder = 'desc'
    } = req.query;

    console.log('=== GET BOOKINGS REQUEST ===');
    console.log('Organization ID:', organizationId);
    console.log('Query params:', req.query);

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    let filter: any = { organizationId };

    // Space filter
    if (spaceId) {
      if (!mongoose.Types.ObjectId.isValid(spaceId as string)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid space ID format'
        });
      }
      filter.spaceId = spaceId;
    }

    // Contact filter
    if (contactId) {
      if (!mongoose.Types.ObjectId.isValid(contactId as string)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid contact ID format'
        });
      }
      filter.contactId = contactId;
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Date range filter - tolerant to both start/end and startTime/endTime fields
    let dateRangeFilter: any = {};
    if (startDate || endDate) {
      const fromDate = startDate ? new Date(startDate as string) : null;
      const toDate = endDate ? new Date(endDate as string) : null;
      
      if (fromDate && toDate) {
        // Range overlap query supporting both field naming conventions
        dateRangeFilter = {
          $or: [
            // Modern field names (start/end) - preferred
            { start: { $lt: toDate }, end: { $gt: fromDate } },
            // Legacy field names (startTime/endTime) - fallback
            { startTime: { $gte: fromDate, $lte: toDate } }
          ]
        };
      } else if (fromDate) {
        dateRangeFilter = {
          $or: [
            { start: { $gte: fromDate } },
            { startTime: { $gte: fromDate } }
          ]
        };
      } else if (toDate) {
        dateRangeFilter = {
          $or: [
            { end: { $lte: toDate } },
            { endTime: { $lte: toDate } }
          ]
        };
      }
    }

    // Search functionality
    let searchFilter: any = {};
    if (search) {
      searchFilter = {
        $or: [
          { customerName: new RegExp(search as string, 'i') },
          { customerEmail: new RegExp(search as string, 'i') },
          { purpose: new RegExp(search as string, 'i') },
          { bookingReference: new RegExp(search as string, 'i') }
        ]
      };
    }

    // Combine filters properly
    if (Object.keys(dateRangeFilter).length > 0 && Object.keys(searchFilter).length > 0) {
      filter = { ...filter, ...dateRangeFilter, ...searchFilter };
    } else if (Object.keys(dateRangeFilter).length > 0) {
      filter = { ...filter, ...dateRangeFilter };
    } else if (Object.keys(searchFilter).length > 0) {
      filter = { ...filter, ...searchFilter };
    }

    // Build sort object - tolerant to both field naming conventions
    const sortObj: any = {};
    if (sortBy === 'startTime') {
      // Sort by both start and startTime fields to handle mixed data
      sortObj.start = sortOrder === 'desc' ? -1 : 1;
      sortObj.startTime = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortObj[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
    }

    console.log('Filter applied:', JSON.stringify(filter, null, 2));

    // Execute query with populate
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('spaceId', 'name type capacity location')
        .populate('contactId', 'firstName lastName email company')
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    console.log(`Found ${bookings.length} bookings out of ${total} total`);

    // Normalize response fields to ensure both startTime/endTime and start/end are available
    const normalizedBookings = bookings.map((booking: any) => ({
      ...booking,
      // Ensure both field naming conventions are available
      startTime: booking.startTime || booking.start,
      endTime: booking.endTime || booking.end,
      start: booking.start || booking.startTime,
      end: booking.end || booking.endTime
    }));

    res.json({
      success: true,
      data: {
        bookings: normalizedBookings,
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
    console.error('Error in getBookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings',
      error: error.message
    });
  }
};

// Get a single booking by ID
export const getBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!ensureAuthenticated(req, res)) return;
    const organizationId = req.user!._id;

    console.log('=== GET BOOKING REQUEST ===');
    console.log('Booking ID:', id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    const booking = await Booking.findOne({ _id: id, organizationId })
      .populate('spaceId', 'name type capacity location address rates amenities')
      .populate('contactId', 'firstName lastName email phone company contextState')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    console.log('Booking found:', booking.bookingReference);

    res.json({
      success: true,
      data: { booking }
    });

  } catch (error: any) {
    console.error('Error in getBooking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve booking',
      error: error.message
    });
  }
};

// Create a new booking
export const createBooking = async (req: AuthRequest, res: Response) => {
  console.log('=== BOOKING CONTROLLER ENTRY ===');
  
  try {
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request headers:', req.headers);
    console.log('Has req.body:', !!req.body);
    console.log('Has req.user:', !!req.user);
    console.log('=== CREATE BOOKING REQUEST ===');
    console.log('Request body raw:', req.body);
    console.log('Request body stringified:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user?._id);
    console.log('User object:', req.user);

    // Tolerant mapping for legacy keys (safety net)
    if (!req.body.startTime && req.body.start) {
      console.log('🔄 Mapping legacy field: start -> startTime');
      req.body.startTime = req.body.start;
    }
    if (!req.body.endTime && req.body.end) {
      console.log('🔄 Mapping legacy field: end -> endTime');
      req.body.endTime = req.body.end;
    }

    const { error, value } = createBookingSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      console.error('Booking validation error:', error.details);
      console.error('Failed validation for:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    console.log('Validated booking data:', JSON.stringify(value, null, 2));

    // Business logic validation: either contactId OR customer details required
    const hasContact = value.contactId && value.contactId.trim() !== '';
    const hasCustomerDetails = value.customerName && value.customerName.trim() !== '' && 
                              value.customerEmail && value.customerEmail.trim() !== '';

    if (!hasContact && !hasCustomerDetails) {
      console.error('Neither contact nor customer details provided');
      return res.status(400).json({
        success: false,
        message: 'Either contactId or customer details (name and email) must be provided',
        errors: [{
          field: 'customer',
          message: 'Either select a contact or provide customer name and email'
        }]
      });
    }

    if (!ensureAuthenticated(req, res)) return;
    const organizationId = req.user!._id;
    const userId = req.user!._id;

    // Validate space exists and belongs to organization
    const space = await Space.findOne({
      _id: value.spaceId,
      organizationId
    }).populate('locationId', 'operatingHours timezone allowSameDayBooking name');

    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found or does not belong to your organization'
      });
    }

    const location = space.locationId as any; // Type assertion for populated location

    // Enhanced Time Validation
    console.log('=== ENHANCED TIME VALIDATION ===');
    const timeValidation = validateBookingTime(
      value.startTime,
      value.endTime,
      location,
      {
        minimumAdvanceMinutes: DEFAULT_TIME_CONFIG.minimumAdvanceMinutes,
        maximumAdvanceDays: space.advanceBookingLimit || DEFAULT_TIME_CONFIG.maximumAdvanceDays,
        allowPastBookings: false,
        respectOperatingHours: true
      }
    );

    console.log('Time validation result:', timeValidation);

    if (!timeValidation.isValid) {
      const formattedError = formatTimeValidationErrors(timeValidation);
      console.error('Time validation failed:', formattedError);
      
      return res.status(400).json({
        success: false,
        message: formattedError.message,
        timeValidation: {
          errors: formattedError.details,
          warnings: formattedError.warnings,
          timeUntilBooking: timeValidation.timeUntilBooking,
          timezone: location?.timezone || 'Asia/Kolkata',
          businessRules: {
            minimumAdvanceMinutes: DEFAULT_TIME_CONFIG.minimumAdvanceMinutes,
            maximumAdvanceDays: space.advanceBookingLimit || DEFAULT_TIME_CONFIG.maximumAdvanceDays,
            allowSameDayBooking: location?.allowSameDayBooking ?? space.allowSameDayBooking,
            respectOperatingHours: true
          }
        }
      });
    }

    // Log successful time validation with warnings
    if (timeValidation.warnings.length > 0) {
      console.warn('Time validation warnings:', timeValidation.warnings);
    }

    // Validate contact if provided
    if (hasContact) {
      console.log('Validating contact:', value.contactId);
      const contact = await Contact.findOne({
        _id: value.contactId.toString(),
        organizationId
      });

      if (!contact) {
        console.error('Contact not found:', value.contactId);
        return res.status(404).json({
          success: false,
          message: 'Contact not found or does not belong to your organization'
        });
      }
      console.log('Contact validated:', contact.firstName, contact.lastName);
    }

    // Check booking duration constraints
    const bookingDuration = Math.round((value.endTime.getTime() - value.startTime.getTime()) / (1000 * 60)); // in minutes

    if (bookingDuration < space.minimumBookingDuration) {
      return res.status(400).json({
        success: false,
        message: `Minimum booking duration is ${space.minimumBookingDuration} minutes`
      });
    }

    if (bookingDuration > space.maximumBookingDuration) {
      return res.status(400).json({
        success: false,
        message: `Maximum booking duration is ${space.maximumBookingDuration} minutes`
      });
    }

    // Check attendee count against space capacity (only if capacity is set and not null for unlimited)
    if (space.capacity !== null && value.attendeeCount > space.capacity) {
      return res.status(400).json({
        success: false,
        message: `Space capacity is ${space.capacity} people, but ${value.attendeeCount} attendees requested`
      });
    }

    // Check for conflicting bookings
    const conflictingBookings = await Booking.find({
      spaceId: value.spaceId,
      status: { $in: ['Pending', 'Confirmed'] },
      $or: [
        {
          // New booking starts during existing booking
          startTime: { $lt: value.endTime },
          endTime: { $gt: value.startTime }
        }
      ]
    });

    if (conflictingBookings.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Space is not available for the requested time slot',
        conflictingBookings: conflictingBookings.map(booking => ({
          id: booking._id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          reference: booking.bookingReference
        }))
      });
    }

    // Check advance booking rules
    const now = new Date();
    const hoursUntilBooking = (value.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const daysUntilBooking = hoursUntilBooking / 24;

    if (daysUntilBooking > space.advanceBookingLimit) {
      return res.status(400).json({
        success: false,
        message: `Bookings can only be made up to ${space.advanceBookingLimit} days in advance`
      });
    }

    // Check same-day booking rules
    const isToday = value.startTime.toDateString() === now.toDateString();
    if (isToday && !space.allowSameDayBooking) {
      return res.status(400).json({
        success: false,
        message: 'Same-day bookings are not allowed for this space'
      });
    }

    // Generate unique booking reference
    const bookingReference = 'BK' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const finalData = {
      ...value,
      bookingReference,
      organizationId,
      paymentStatus: 'Pending',
      checkedIn: false,
      createdBy: userId,
      updatedBy: userId
    };

    console.log('Creating booking with data:', JSON.stringify(finalData, null, 2));

    const booking = new Booking(finalData);
    await booking.save();

    console.log('✅ BOOKING_CREATED:', JSON.stringify({
      action: 'booking_created',
      bookingRef: booking.bookingReference,
      _id: booking._id.toString(),
      spaceId: booking.spaceId.toString(),
      start: booking.startTime.toISOString(),
      end: booking.endTime.toISOString(),
      orgId: booking.organizationId.toString()
    }));

    // Populate the created booking for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('spaceId', 'name type capacity location')
      .populate('contactId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    // Normalize response fields to ensure both field naming conventions are available
    const normalizedBooking = populatedBooking ? {
      ...populatedBooking.toObject(),
      // Ensure both field naming conventions are available
      startTime: populatedBooking.startTime,
      endTime: populatedBooking.endTime,
      start: populatedBooking.startTime,
      end: populatedBooking.endTime
    } : booking;

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking: normalizedBooking }
    });

  } catch (error: any) {
    console.error('=== BOOKING CREATION ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    console.error('Error stack:', error?.stack);
    console.error('Full error object:', error);
    
    // MongoDB duplicate key error
    if (error.code === 11000) {
      console.error('Duplicate key error:', error.keyValue);
      return res.status(409).json({
        success: false,
        message: 'Booking reference already exists. Please try again.'
      });
    }
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      console.error('Mongoose validation error:', error.errors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    // Mongoose cast error (invalid ObjectId)
    if (error.name === 'CastError') {
      console.error('Cast error:', error.path, error.value);
      return res.status(400).json({
        success: false,
        message: `Invalid ${error.path}: ${error.value}`
      });
    }

    // General server error
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message || 'Unknown error',
      errorName: error.name || 'UnknownError'
    });
  }
};

// Update an existing booking
export const updateBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!ensureAuthenticated(req, res)) return;
    const organizationId = req.user!._id;
    const userId = req.user!._id;

    console.log('=== UPDATE BOOKING REQUEST ===');
    console.log('Booking ID:', id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    const { error, value } = updateBookingSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      console.error('Validation error:', error.details);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Check if booking exists
    const existingBooking = await Booking.findOne({ _id: id, organizationId });
    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking can be modified using enhanced time validation
    if (value.startTime || value.endTime) {
      const space = await Space.findById(existingBooking.spaceId).populate('locationId', 'timezone');
      const location = space?.locationId as any;
      const timezone = location?.timezone || 'Asia/Kolkata';
      
      const modificationCheck = canModifyBooking(existingBooking.startTime, timezone, 4);
      
      if (!modificationCheck.canModify) {
        return res.status(400).json({
          success: false,
          message: modificationCheck.reason,
          timeValidation: {
            canModify: false,
            hoursRemaining: modificationCheck.hoursRemaining,
            timezone: timezone,
            minimumHoursRequired: 4
          }
        });
      }

      // If changing times, check for conflicts
      const newStartTime = value.startTime || existingBooking.startTime;
      const newEndTime = value.endTime || existingBooking.endTime;

      const conflictingBookings = await Booking.find({
        _id: { $ne: id },
        spaceId: existingBooking.spaceId,
        status: { $in: ['Pending', 'Confirmed'] },
        $or: [
          {
            startTime: { $lt: newEndTime },
            endTime: { $gt: newStartTime }
          }
        ]
      });

      if (conflictingBookings.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Space is not available for the updated time slot',
          conflictingBookings: conflictingBookings.map(booking => ({
            id: booking._id,
            startTime: booking.startTime,
            endTime: booking.endTime,
            reference: booking.bookingReference
          }))
        });
      }
    }

    const updateData = {
      ...value,
      updatedBy: userId
    };

    console.log('Updating booking with data:', JSON.stringify(updateData, null, 2));

    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: id, organizationId },
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    )
    .populate('spaceId', 'name type capacity location')
    .populate('contactId', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName')
    .populate('updatedBy', 'firstName lastName');

    console.log('Booking updated successfully');

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: { booking: updatedBooking }
    });

  } catch (error: any) {
    console.error('Error in updateBooking:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      error: error.message
    });
  }
};

// Cancel/Delete a booking
export const deleteBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!ensureAuthenticated(req, res)) return;
    const organizationId = req.user!._id;
    const userId = req.user!._id;

    console.log('=== DELETE BOOKING REQUEST ===');
    console.log('Booking ID:', id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    // Check if booking exists
    const existingBooking = await Booking.findOne({ _id: id, organizationId });
    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking can be cancelled using enhanced time validation
    const space = await Space.findById(existingBooking.spaceId).populate('locationId', 'timezone');
    const location = space?.locationId as any;
    const timezone = location?.timezone || 'Asia/Kolkata';
    
    const cancellationCheck = canCancelBooking(existingBooking.startTime, timezone, 2);
    
    if (!cancellationCheck.canCancel) {
      return res.status(400).json({
        success: false,
        message: cancellationCheck.reason,
        timeValidation: {
          canCancel: false,
          hoursRemaining: cancellationCheck.hoursRemaining,
          timezone: timezone,
          minimumHoursRequired: 2
        }
      });
    }

    // Update status to Cancelled instead of deleting
    const cancelledBooking = await Booking.findOneAndUpdate(
      { _id: id, organizationId },
      { 
        status: 'Cancelled',
        updatedBy: userId,
        cancelReason: req.body.cancelReason || 'Cancelled by user'
      },
      { new: true }
    );

    console.log('Booking cancelled successfully');

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking: cancelledBooking }
    });

  } catch (error: any) {
    console.error('Error in deleteBooking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
};

// Check space availability for a specific date with enhanced time validation
export const checkSpaceAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { spaceId } = req.params;
    if (!ensureAuthenticated(req, res)) return;
    const organizationId = req.user!._id;

    console.log('=== CHECK SPACE AVAILABILITY REQUEST ===');
    console.log('Space ID:', spaceId);
    console.log('Query params:', req.query);
    console.log('Organization ID:', organizationId);

    if (!mongoose.Types.ObjectId.isValid(spaceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid space ID format'
      });
    }

    const { error, value } = availabilityQuerySchema.validate(req.query);

    if (error) {
      console.error('Availability validation error:', error.details);
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Convert and validate date
    const targetDate = new Date(value.date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // Validate space exists and belongs to organization
    const space = await Space.findOne({
      _id: spaceId,
      organizationId
    }).populate('locationId', 'operatingHours timezone allowSameDayBooking name');

    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found or does not belong to your organization'
      });
    }

    const location = space.locationId as any; // Type assertion for populated location
    const timezone = location?.timezone || 'Asia/Kolkata';
    
    // Get current time in location's timezone
    const now = getCurrentTimeInTimezone(timezone);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    // Enhanced time validation: Check if date is in the past
    if (targetDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check availability for past dates',
        timeValidation: {
          requestedDate: targetDate.toISOString().split('T')[0],
          currentDate: now.toISOString().split('T')[0],
          timezone: timezone,
          reason: 'Past date not allowed'
        }
      });
    }

    // Same-day booking validation
    const isToday = targetDate.toDateString() === today.toDateString();
    if (isToday && location && !location.allowSameDayBooking) {
      return res.status(400).json({
        success: false,
        message: 'Same-day bookings are not allowed for this location',
        timeValidation: {
          requestedDate: targetDate.toISOString().split('T')[0],
          isToday: true,
          allowSameDayBooking: false,
          reason: 'Same-day booking policy restriction'
        }
      });
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all existing bookings for this space on the target date
    const existingBookings = await Booking.find({
      spaceId,
      status: { $in: ['Pending', 'Confirmed'] },
      startTime: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ startTime: 1 });

    // Convert existing bookings format for time slot generation
    const existingBookingSlots = existingBookings.map(booking => ({
      startTime: booking.startTime,
      endTime: booking.endTime
    }));

    // Generate available time slots using enhanced time validation
    const availableSlots = generateAvailableTimeSlots(
      targetDate,
      value.duration,
      location,
      existingBookingSlots
    );

    // Filter slots that pass business rule validation
    const validatedSlots = availableSlots.map(slot => {
      const validation = validateBookingTime(
        slot.startTime,
        slot.endTime,
        location,
        { 
          minimumAdvanceMinutes: DEFAULT_TIME_CONFIG.minimumAdvanceMinutes,
          respectOperatingHours: true 
        }
      );

      return {
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        duration: value.duration,
        isAvailable: slot.isAvailable && validation.isValid,
        validationErrors: validation.errors,
        validationWarnings: validation.warnings,
        timeUntilBooking: validation.timeUntilBooking
      };
    });

    // Separate available and unavailable slots
    const availableValidSlots = validatedSlots.filter(slot => slot.isAvailable);
    const unavailableSlots = validatedSlots.filter(slot => !slot.isAvailable);

    console.log(`Found ${availableValidSlots.length} available slots for ${targetDate.toDateString()}`);

    // Enhanced response with time validation details
    res.json({
      success: true,
      data: {
        spaceId: space._id,
        date: targetDate.toISOString().split('T')[0],
        duration: value.duration,
        isAvailable: availableValidSlots.length > 0,
        
        // Available time slots (only future, valid ones)
        availableSlots: availableValidSlots,
        
        // Unavailable slots for reference
        unavailableSlots: unavailableSlots.slice(0, 5), // Limit to prevent large responses
        
        // Existing bookings causing conflicts
        conflictingBookings: existingBookings.map(booking => ({
          bookingId: booking._id.toString(),
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          status: booking.status,
          customerName: booking.customerName
        })),
        
        // Time validation context
        timeValidation: {
          timezone: timezone,
          currentTime: now.toISOString(),
          isToday: isToday,
          allowSameDayBooking: location?.allowSameDayBooking ?? true,
          minimumAdvanceMinutes: DEFAULT_TIME_CONFIG.minimumAdvanceMinutes,
          onlyFutureSlots: true
        },
        
        // Space and location information
        space: {
          id: space._id,
          name: space.name,
          capacity: space.capacity,
          minimumBookingDuration: space.minimumBookingDuration,
          maximumBookingDuration: space.maximumBookingDuration
        },
        
        location: location ? {
          id: location._id,
          name: location.name,
          timezone: location.timezone,
          allowSameDayBooking: location.allowSameDayBooking
        } : null,
        
        // Summary statistics
        summary: {
          totalSlotsGenerated: validatedSlots.length,
          availableSlots: availableValidSlots.length,
          conflictingSlots: unavailableSlots.length,
          existingBookings: existingBookings.length
        }
      }
    });

  } catch (error: any) {
    console.error('Error in checkSpaceAvailability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check space availability',
      error: error.message
    });
  }
};

// Get booking statistics
export const getBookingStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!ensureAuthenticated(req, res)) return;
    const organizationId = req.user!._id;

    console.log('=== GET BOOKING STATS REQUEST ===');
    console.log('Organization ID:', organizationId);

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const nextWeekStart = new Date(thisWeekStart);
    nextWeekStart.setDate(thisWeekStart.getDate() + 7);

    const [
      totalBookings,
      todayBookings,
      thisWeekBookings,
      bookingsByStatus,
      bookingsBySpace,
      recentBookings
    ] = await Promise.all([
      // Total bookings
      Booking.countDocuments({ organizationId }),
      
      // Today's bookings
      Booking.countDocuments({ 
        organizationId,
        startTime: { $gte: today, $lt: tomorrow }
      }),
      
      // This week's bookings
      Booking.countDocuments({ 
        organizationId,
        startTime: { $gte: thisWeekStart, $lt: nextWeekStart }
      }),
      
      // Bookings by status
      Booking.aggregate([
        { $match: { organizationId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Bookings by space
      Booking.aggregate([
        { $match: { organizationId } },
        { $group: { _id: '$spaceId', count: { $sum: 1 } } },
        { $lookup: { from: 'spaces', localField: '_id', foreignField: '_id', as: 'space' } },
        { $unwind: '$space' },
        { $project: { _id: 1, count: 1, spaceName: '$space.name', spaceType: '$space.type' } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Recent bookings
      Booking.find({ organizationId })
        .populate('spaceId', 'name type')
        .populate('contactId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('bookingReference startTime endTime status customerName createdAt')
    ]);

    const stats = {
      totalBookings,
      todayBookings,
      thisWeekBookings,
      bookingsByStatus: bookingsByStatus.map(item => ({
        status: item._id,
        count: item.count
      })),
      bookingsBySpace,
      recentBookings
    };

    console.log('Booking stats calculated');

    res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('Error in getBookingStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve booking statistics',
      error: error.message
    });
  }
};