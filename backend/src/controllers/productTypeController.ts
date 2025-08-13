import { Response } from 'express';
import { ProductType, IProductType, ProductTypeCategory } from '../models/ProductType';
import { Location } from '../models/Location';
import { Space } from '../models/Space';
import { AuthRequest } from '../middleware/auth';
import Joi from 'joi';
import mongoose from 'mongoose';

// Validation schemas
const pricingTierSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  duration: Joi.number().integer().min(1).max(10080).optional(),
  price: Joi.number().min(0).required(),
  currency: Joi.string().length(3).uppercase().default('USD'),
  description: Joi.string().trim().max(200).allow('').optional(),
  conditions: Joi.string().trim().max(300).allow('').optional()
});

const pricingRuleSchema = Joi.object({
  type: Joi.string().valid('hourly', 'daily', 'weekly', 'monthly', 'tiered', 'membership').required(),
  basePrice: Joi.number().min(0).when('type', {
    is: Joi.valid('hourly', 'daily', 'weekly', 'monthly'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  currency: Joi.string().length(3).uppercase().default('USD'),
  tiers: Joi.array().items(pricingTierSchema).when('type', {
    is: 'tiered',
    then: Joi.array().items(pricingTierSchema).min(1).required(),
    otherwise: Joi.optional()
  }),
  minimumDuration: Joi.number().integer().min(15).default(60),
  maximumDuration: Joi.number().integer().min(15).max(43200).optional(),
  advanceBookingRequired: Joi.number().integer().min(0).max(8760).default(0),
  cancellationPolicy: Joi.object({
    hoursBeforeStart: Joi.number().integer().min(0).max(168).default(2),
    refundPercentage: Joi.number().min(0).max(100).default(100),
    description: Joi.string().trim().max(300).allow('').optional()
  }).optional(),
  memberDiscounts: Joi.array().items(Joi.object({
    membershipType: Joi.string().trim().required(),
    discountPercentage: Joi.number().min(0).max(100).required(),
    description: Joi.string().trim().max(200).allow('').optional()
  })).optional()
});

const capacityConfigSchema = Joi.object({
  minCapacity: Joi.number().integer().min(1).max(1000).required(),
  maxCapacity: Joi.number().integer().min(1).max(1000).required(),
  optimalCapacity: Joi.number().integer().min(1).max(1000).required(),
  standingCapacity: Joi.number().integer().min(1).max(2000).optional(),
  wheelchairAccessible: Joi.boolean().default(true)
}).custom((value, helpers) => {
  if (value.minCapacity > value.optimalCapacity || value.optimalCapacity > value.maxCapacity) {
    return helpers.error('any.invalid', { message: 'Capacity values must be in order: min ≤ optimal ≤ max' });
  }
  return value;
});

const autoGenerationConfigSchema = Joi.object({
  enabled: Joi.boolean().default(true),
  naming: Joi.object({
    prefix: Joi.string().trim().uppercase().max(10).required(),
    startNumber: Joi.number().integer().min(1).default(1),
    digits: Joi.number().integer().min(1).max(5).default(3)
  }).required(),
  distribution: Joi.object({
    byFloor: Joi.boolean().default(false),
    perFloor: Joi.number().integer().min(1).max(100).optional(),
    preferredFloors: Joi.array().items(Joi.number().integer().min(1).max(200)).optional()
  }).optional()
});

const createProductTypeSchema = Joi.object({
  locationId: Joi.string().required(),
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().max(500).allow('').optional(),
  category: Joi.string().valid(
    'Private_Office', 'Manager_Cabin', 'Team_Cabin', 'Meeting_Room',
    'Phone_Booth', 'Hot_Desk', 'Dedicated_Desk', 'Conference_Room',
    'Event_Space', 'Training_Room', 'Interview_Room', 'Focus_Pod',
    'Lounge_Area', 'Virtual_Office'
  ).required(),
  code: Joi.string().trim().uppercase().max(20).pattern(/^[A-Z0-9_]+$/).required(),
  capacity: capacityConfigSchema.required(),
  floorSpace: Joi.number().min(1).max(10000).optional(),
  dimensions: Joi.object({
    length: Joi.number().min(1).max(1000).optional(),
    width: Joi.number().min(1).max(1000).optional(),
    height: Joi.number().min(6).max(50).optional(),
    unit: Joi.string().valid('feet', 'meters').default('feet')
  }).optional(),
  pricing: pricingRuleSchema.required(),
  amenities: Joi.object({
    included: Joi.array().items(Joi.string().trim().max(50)).optional(),
    optional: Joi.array().items(Joi.object({
      name: Joi.string().trim().max(50).required(),
      price: Joi.number().min(0).required(),
      currency: Joi.string().length(3).default('USD'),
      description: Joi.string().trim().max(200).allow('').optional()
    })).optional(),
    required: Joi.array().items(Joi.string().trim().max(50)).optional()
  }).optional(),
  features: Joi.array().items(Joi.string().trim().max(100)).optional(),
  isActive: Joi.boolean().default(true),
  accessLevel: Joi.string().valid('public', 'members_only', 'premium_members', 'private', 'by_invitation').default('members_only'),
  operatingHours: Joi.object({
    useLocationDefault: Joi.boolean().default(true),
    customHours: Joi.array().items(Joi.object({
      day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
      startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      isAvailable: Joi.boolean().required()
    })).optional()
  }).optional(),
  autoGeneration: autoGenerationConfigSchema.required(),
  images: Joi.array().items(Joi.string().trim().max(500)).optional(),
  displayOrder: Joi.number().integer().min(0).max(1000).default(0),
  isHighlight: Joi.boolean().default(false),
  marketingDescription: Joi.string().trim().max(1000).allow('').optional(),
  tags: Joi.array().items(Joi.string().trim().max(30)).optional(),
  isTemplate: Joi.boolean().default(false),
  // Space generation parameters
  generateSpaces: Joi.boolean().default(false),
  spacesToGenerate: Joi.number().integer().min(1).max(100).when('generateSpaces', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const updateProductTypeSchema = createProductTypeSchema.fork(
  ['locationId', 'name', 'category', 'code', 'capacity', 'pricing', 'autoGeneration'],
  (schema) => schema.optional()
);

// Helper function to ensure user is authenticated (standalone function like locationController)
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

class ProductTypeController {
  // Get all product types for a location with filtering and pagination
  async getProductTypes(req: AuthRequest, res: Response) {
    try {
      if (!ensureAuthenticated(req, res)) return;
      const organizationId = req.user!._id;
      const {
        locationId,
        page = '1',
        limit = '10',
        search = '',
        category,
        isActive,
        accessLevel,
        minCapacity,
        maxCapacity,
        sortBy = 'displayOrder',
        sortOrder = 'asc'
      } = req.query;

      console.log('=== GET PRODUCT TYPES REQUEST ===');
      console.log('Organization ID:', organizationId);
      console.log('Query params:', req.query);

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build filter object
      let filter: any = { organizationId };

      if (locationId) {
        if (!mongoose.Types.ObjectId.isValid(locationId as string)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid location ID format'
          });
        }
        filter.locationId = new mongoose.Types.ObjectId(locationId as string);
      }

      // Apply filters
      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }

      if (category) {
        filter.category = category;
      }

      if (accessLevel) {
        filter.accessLevel = accessLevel;
      }

      if (minCapacity) {
        filter['capacity.minCapacity'] = { $gte: parseInt(minCapacity as string) };
      }

      if (maxCapacity) {
        filter['capacity.maxCapacity'] = { $lte: parseInt(maxCapacity as string) };
      }

      // Search functionality
      if (search) {
        filter.$or = [
          { name: new RegExp(search as string, 'i') },
          { description: new RegExp(search as string, 'i') },
          { code: new RegExp(search as string, 'i') },
          { category: new RegExp(search as string, 'i') },
          { marketingDescription: new RegExp(search as string, 'i') }
        ];
      }

      // Build sort object
      const sortObj: any = {};
      sortObj[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      console.log('Filter applied:', JSON.stringify(filter, null, 2));

      // Execute query with populate
      const productTypes = await ProductType.find(filter)
        .populate('locationId', 'name code address.city')
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum);

      const total = await ProductType.countDocuments(filter);

      console.log(`Found ${productTypes.length} product types out of ${total} total`);

      res.json({
        success: true,
        data: {
          productTypes,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        }
      });

    } catch (error: any) {
      console.error('Error in getProductTypes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve product types',
        error: error.message
      });
    }
  }

  // Get a single product type by ID
  async getProductType(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!ensureAuthenticated(req, res)) return;
      const organizationId = req.user!._id;

      console.log('=== GET PRODUCT TYPE REQUEST ===');
      console.log('Product Type ID:', id);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product type ID format'
        });
      }

      const productType = await ProductType.findOne({ _id: id, organizationId })
        .populate('locationId', 'name code address.city timezone')
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName');

      if (!productType) {
        return res.status(404).json({
          success: false,
          message: 'Product type not found'
        });
      }

      // Get count of generated spaces
      const generatedSpacesCount = await Space.countDocuments({
        organizationId,
        productTypeId: productType._id,
        autoGenerated: true
      });

      console.log('Product type found:', productType.name, 'with', generatedSpacesCount, 'generated spaces');

      res.json({
        success: true,
        data: { 
          productType,
          generatedSpacesCount
        }
      });

    } catch (error: any) {
      console.error('Error in getProductType:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve product type',
        error: error.message
      });
    }
  }

  // Create a new product type (with optional space generation)
  async createProductType(req: AuthRequest, res: Response) {
    try {
      console.log('=== CREATE PRODUCT TYPE REQUEST ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));

      const { error, value } = createProductTypeSchema.validate(req.body, {
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

      if (!ensureAuthenticated(req, res)) return;
      const organizationId = req.user!._id;
      const userId = req.user!._id;

      // Validate locationId exists and belongs to organization
      const location = await Location.findOne({
        _id: value.locationId,
        organizationId
      });

      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found or does not belong to your organization'
        });
      }

      // Check for duplicate product type code within the location
      const existingProductType = await ProductType.findOne({
        organizationId,
        locationId: value.locationId,
        code: value.code
      });

      if (existingProductType) {
        return res.status(409).json({
          success: false,
          message: `Product type code '${value.code}' already exists in this location`
        });
      }

      // Extract space generation parameters
      const { generateSpaces, spacesToGenerate, ...productTypeData } = value;

      const finalData = {
        ...productTypeData,
        organizationId,
        createdBy: userId,
        updatedBy: userId
      };

      console.log('Creating product type with data:', JSON.stringify(finalData, null, 2));

      const productType = new ProductType(finalData);
      await productType.save();

      console.log('Product type created successfully:', productType._id);

      // Generate spaces if requested
      let generatedSpaces = [];
      if (generateSpaces && spacesToGenerate) {
        console.log(`Generating ${spacesToGenerate} spaces for product type ${productType.name}`);
        generatedSpaces = await this.generateSpacesForProductType(
          productType,
          spacesToGenerate,
          userId,
          location
        );
        console.log(`Generated ${generatedSpaces.length} spaces`);

        // Update stats
        productType.stats = {
          ...productType.stats,
          totalSpacesGenerated: generatedSpaces.length
        };
        await productType.save();
      }

      // Populate the created product type for response
      const populatedProductType = await ProductType.findById(productType._id)
        .populate('locationId', 'name code address.city')
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName');

      res.status(201).json({
        success: true,
        message: 'Product type created successfully',
        data: { 
          productType: populatedProductType,
          generatedSpaces: generateSpaces ? generatedSpaces : undefined,
          generatedSpacesCount: generatedSpaces.length
        }
      });

    } catch (error: any) {
      console.error('Error in createProductType:', error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        const value = error.keyValue[field];
        return res.status(409).json({
          success: false,
          message: `Product type with ${field} '${value}' already exists in this location`
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create product type',
        error: error.message
      });
    }
  }

  // Helper method to generate spaces for a product type
  private async generateSpacesForProductType(
    productType: IProductType,
    count: number,
    userId: mongoose.Types.ObjectId,
    _location: any
  ): Promise<any[]> {
    const spaces = [];
    const { naming } = productType.autoGeneration;
    
    // Get the highest existing sequence for this product type
    const lastSpace = await Space.findOne({
      organizationId: productType.organizationId,
      'generationSource.productTypeId': productType._id
    }).sort({ 'generationSource.sequence': -1 });

    let startSequence = naming.startNumber;
    if (lastSpace && lastSpace.generationSource) {
      startSequence = lastSpace.generationSource.sequence + 1;
    }

    for (let i = 0; i < count; i++) {
      const sequence = startSequence + i;
      const spaceName = productType.generateSpaceName(sequence);

      const spaceData = {
        organizationId: productType.organizationId,
        locationId: productType.locationId,
        productTypeId: productType._id,
        name: spaceName,
        description: `Auto-generated ${productType.name}`,
        type: this.mapCategoryToSpaceType(productType.category),
        spaceCode: spaceName,
        capacity: productType.capacity.optimalCapacity,
        area: productType.floorSpace || undefined,
        rates: {
          hourly: productType.pricing.basePrice || 0,
          currency: productType.pricing.currency
        },
        amenities: productType.amenities?.included || [],
        useProductTypePricing: true,
        inheritProductTypeAmenities: true,
        useProductTypeHours: true,
        useProductTypeBookingRules: true,
        workingHours: this.getDefaultWorkingHours(),
        minimumBookingDuration: productType.pricing.minimumDuration || 60,
        maximumBookingDuration: productType.pricing.maximumDuration || 480,
        autoGenerated: true,
        generationSource: {
          productTypeId: productType._id,
          generatedAt: new Date(),
          sequence
        },
        createdBy: userId,
        updatedBy: userId
      };

      const space = new Space(spaceData);
      await space.save();
      spaces.push(space);
    }

    return spaces;
  }

  // Helper method to map ProductType category to Space type
  private mapCategoryToSpaceType(category: ProductTypeCategory): string {
    const mapping: { [key in ProductTypeCategory]: string } = {
      'Private_Office': 'Private Office',
      'Manager_Cabin': 'Private Office',
      'Team_Cabin': 'Private Office',
      'Meeting_Room': 'Meeting Room',
      'Conference_Room': 'Meeting Room',
      'Training_Room': 'Meeting Room',
      'Interview_Room': 'Meeting Room',
      'Phone_Booth': 'Meeting Room',
      'Focus_Pod': 'Meeting Room',
      'Event_Space': 'Meeting Room',
      'Hot_Desk': 'Hot Desk',
      'Dedicated_Desk': 'Hot Desk',
      'Lounge_Area': 'Hot Desk',
      'Virtual_Office': 'Private Office'
    };
    return mapping[category] || 'Hot Desk';
  }

  // Helper method to get default working hours
  private getDefaultWorkingHours() {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.map(day => ({
      day,
      isOpen: ['saturday', 'sunday'].includes(day) ? false : true,
      openTime: '09:00',
      closeTime: '18:00'
    }));
  }

  // Update an existing product type
  async updateProductType(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!ensureAuthenticated(req, res)) return;
      const organizationId = req.user!._id;
      const userId = req.user!._id;

      console.log('=== UPDATE PRODUCT TYPE REQUEST ===');
      console.log('Product Type ID:', id);
      console.log('Request body:', JSON.stringify(req.body, null, 2));

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product type ID format'
        });
      }

      const { error, value } = updateProductTypeSchema.validate(req.body, {
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

      // Check if product type exists
      const existingProductType = await ProductType.findOne({ _id: id, organizationId });
      if (!existingProductType) {
        return res.status(404).json({
          success: false,
          message: 'Product type not found'
        });
      }

      // Validate locationId if provided
      if (value.locationId) {
        const location = await Location.findOne({
          _id: value.locationId,
          organizationId
        });

        if (!location) {
          return res.status(404).json({
            success: false,
            message: 'Location not found or does not belong to your organization'
          });
        }
      }

      // Check for duplicate code if code is being updated
      if (value.code && value.code !== existingProductType.code) {
        const duplicateProductType = await ProductType.findOne({
          organizationId,
          locationId: value.locationId || existingProductType.locationId,
          code: value.code,
          _id: { $ne: id }
        });

        if (duplicateProductType) {
          return res.status(409).json({
            success: false,
            message: `Product type code '${value.code}' already exists in this location`
          });
        }
      }

      const updateData = {
        ...value,
        updatedBy: userId
      };

      console.log('Updating product type with data:', JSON.stringify(updateData, null, 2));

      const updatedProductType = await ProductType.findOneAndUpdate(
        { _id: id, organizationId },
        updateData,
        { 
          new: true, 
          runValidators: true 
        }
      )
      .populate('locationId', 'name code address.city')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

      console.log('Product type updated successfully');

      // Sync changes to related spaces if needed
      if (value.capacity || value.pricing || value.amenities) {
        console.log('Syncing changes to related spaces...');
        await this.syncProductTypeChangesToSpaces(updatedProductType!);
      }

      res.json({
        success: true,
        message: 'Product type updated successfully',
        data: { productType: updatedProductType }
      });

    } catch (error: any) {
      console.error('Error in updateProductType:', error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        const value = error.keyValue[field];
        return res.status(409).json({
          success: false,
          message: `Product type with ${field} '${value}' already exists in this location`
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update product type',
        error: error.message
      });
    }
  }

  // Helper method to sync product type changes to related spaces
  private async syncProductTypeChangesToSpaces(productType: IProductType) {
    try {
      const relatedSpaces = await Space.find({
        organizationId: productType.organizationId,
        productTypeId: productType._id,
        $or: [
          { useProductTypePricing: true },
          { inheritProductTypeAmenities: true },
          { useProductTypeBookingRules: true }
        ]
      });

      console.log(`Found ${relatedSpaces.length} spaces to sync with product type changes`);

      for (const space of relatedSpaces) {
        await space.syncWithProductType();
      }

      console.log('Sync completed');
    } catch (error) {
      console.error('Error syncing product type changes to spaces:', error);
    }
  }

  // Delete a product type
  async deleteProductType(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!ensureAuthenticated(req, res)) return;
      const organizationId = req.user!._id;

      console.log('=== DELETE PRODUCT TYPE REQUEST ===');
      console.log('Product Type ID:', id);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product type ID format'
        });
      }

      // Check if product type exists
      const existingProductType = await ProductType.findOne({ _id: id, organizationId });
      if (!existingProductType) {
        return res.status(404).json({
          success: false,
          message: 'Product type not found'
        });
      }

      // Check for dependent spaces
      const dependentSpaces = await Space.countDocuments({
        organizationId,
        productTypeId: id
      });

      if (dependentSpaces > 0) {
        return res.status(409).json({
          success: false,
          message: `Cannot delete product type. It has ${dependentSpaces} associated spaces. Delete the spaces first.`
        });
      }

      await ProductType.findOneAndDelete({ _id: id, organizationId });

      console.log('Product type deleted successfully');

      res.json({
        success: true,
        message: 'Product type deleted successfully'
      });

    } catch (error: any) {
      console.error('Error in deleteProductType:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product type',
        error: error.message
      });
    }
  }

  // Generate additional spaces for a product type
  async generateSpaces(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { count } = req.body;
      if (!ensureAuthenticated(req, res)) return;
      const organizationId = req.user!._id;
      const userId = req.user!._id;

      console.log('=== GENERATE SPACES REQUEST ===');
      console.log('Product Type ID:', id);
      console.log('Spaces to generate:', count);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product type ID format'
        });
      }

      if (!count || count < 1 || count > 100) {
        return res.status(400).json({
          success: false,
          message: 'Count must be between 1 and 100'
        });
      }

      const productType = await ProductType.findOne({ _id: id, organizationId })
        .populate('locationId');

      if (!productType) {
        return res.status(404).json({
          success: false,
          message: 'Product type not found'
        });
      }

      if (!productType.autoGeneration.enabled) {
        return res.status(400).json({
          success: false,
          message: 'Auto-generation is disabled for this product type'
        });
      }

      const generatedSpaces = await this.generateSpacesForProductType(
        productType,
        count,
        userId,
        productType.locationId
      );

      // Update stats
      const currentStats = productType.stats || {};
      productType.stats = {
        ...currentStats,
        totalSpacesGenerated: (currentStats.totalSpacesGenerated || 0) + generatedSpaces.length
      };
      await productType.save();

      console.log(`Generated ${generatedSpaces.length} spaces successfully`);

      res.json({
        success: true,
        message: `Generated ${generatedSpaces.length} spaces successfully`,
        data: {
          generatedSpaces: generatedSpaces.map(space => ({
            id: space._id,
            name: space.name,
            spaceCode: space.spaceCode,
            capacity: space.capacity
          })),
          count: generatedSpaces.length
        }
      });

    } catch (error: any) {
      console.error('Error in generateSpaces:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate spaces',
        error: error.message
      });
    }
  }

  // Get product type statistics
  async getProductTypeStats(req: AuthRequest, res: Response) {
    try {
      if (!ensureAuthenticated(req, res)) return;
      const organizationId = req.user!._id;
      const { locationId } = req.query;

      console.log('=== GET PRODUCT TYPE STATS REQUEST ===');
      console.log('Organization ID:', organizationId);
      console.log('Location ID:', locationId);

      let filter: any = { organizationId };
      if (locationId) {
        if (!mongoose.Types.ObjectId.isValid(locationId as string)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid location ID format'
          });
        }
        filter.locationId = locationId;
      }

      const totalProductTypes = await ProductType.countDocuments(filter);
      const activeProductTypes = await ProductType.countDocuments({ ...filter, isActive: true });
      const inactiveProductTypes = totalProductTypes - activeProductTypes;

      // Aggregate by category
      const productTypesByCategory = await ProductType.aggregate([
        { $match: filter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Aggregate by access level
      const productTypesByAccess = await ProductType.aggregate([
        { $match: filter },
        { $group: { _id: '$accessLevel', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Get capacity distribution
      const capacityStats = await ProductType.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            avgMinCapacity: { $avg: '$capacity.minCapacity' },
            avgMaxCapacity: { $avg: '$capacity.maxCapacity' },
            totalCapacity: { $sum: '$capacity.maxCapacity' }
          }
        }
      ]);

      // Recent product types
      const recentProductTypes = await ProductType.find(filter)
        .select('name category capacity.optimalCapacity createdAt')
        .populate('locationId', 'name code')
        .sort({ createdAt: -1 })
        .limit(5);

      // Total generated spaces
      const totalGeneratedSpaces = await Space.countDocuments({
        organizationId,
        autoGenerated: true,
        ...(locationId && { locationId })
      });

      const stats = {
        totalProductTypes,
        activeProductTypes,
        inactiveProductTypes,
        totalGeneratedSpaces,
        productTypesByCategory: productTypesByCategory.map(item => ({
          category: item._id,
          count: item.count
        })),
        productTypesByAccess: productTypesByAccess.map(item => ({
          accessLevel: item._id,
          count: item.count
        })),
        capacityStats: capacityStats[0] || {
          avgMinCapacity: 0,
          avgMaxCapacity: 0,
          totalCapacity: 0
        },
        recentProductTypes
      };

      console.log('Product type stats calculated');

      res.json({
        success: true,
        data: stats
      });

    } catch (error: any) {
      console.error('Error in getProductTypeStats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve product type statistics',
        error: error.message
      });
    }
  }
}

export default new ProductTypeController();