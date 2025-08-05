import { Response } from 'express';
import { Contact, IContact, ContactType, ContextState } from '../models/Contact';
import { AuthRequest } from '../middleware/auth';
import AIContextService from '../services/aiContextService';
import Joi from 'joi';
import mongoose from 'mongoose';

const createContactSchema = Joi.object({
  type: Joi.string().valid('Lead', 'Member', 'Prospect').required(),
  firstName: Joi.string().trim().min(1).max(50).required(),
  lastName: Joi.string().trim().min(1).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().trim().max(20).allow('').optional(),
  company: Joi.string().trim().max(100).allow('').optional(),
  jobTitle: Joi.string().trim().max(100).allow('').optional(),
  address: Joi.object({
    street: Joi.string().max(200).allow('').optional(),
    city: Joi.string().max(100).allow('').optional(),
    state: Joi.string().max(50).allow('').optional(),
    zipCode: Joi.string().max(20).allow('').optional(),
    country: Joi.string().max(50).allow('').optional()
  }).optional(),
  tags: Joi.array().items(Joi.string().trim().max(30)).optional(),
  leadSource: Joi.string().trim().max(100).allow('').optional(),
  assignedTo: Joi.string().allow('').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  aiContext: Joi.object({
    preferences: Joi.array().items(Joi.string()).optional(),
    interests: Joi.array().items(Joi.string()).optional(),
    painPoints: Joi.array().items(Joi.string()).optional(),
    budget: Joi.object({
      min: Joi.number().allow(null).optional(),
      max: Joi.number().allow(null).optional(),
      currency: Joi.string().default('USD')
    }).optional(),
    spaceRequirements: Joi.array().items(Joi.string()).optional()
  }).optional()
});

const updateContactSchema = createContactSchema.fork(
  ['type', 'firstName', 'lastName', 'email'], 
  (schema) => schema.optional()
);

const addInteractionSchema = Joi.object({
  type: Joi.string().valid('call', 'email', 'meeting', 'note', 'tour', 'ai_conversation').required(),
  subject: Joi.string().max(200).optional(),
  content: Joi.string().max(5000).required(),
  metadata: Joi.object({
    aiModel: Joi.string().optional(),
    aiContext: Joi.string().optional(),
    duration: Joi.number().optional(),
    outcome: Joi.string().optional(),
    nextActions: Joi.array().items(Joi.string()).optional()
  }).optional()
});

const updateContextStateSchema = Joi.object({
  contextState: Joi.string().valid('New', 'Touring', 'Negotiating', 'Active', 'Inactive', 'Churned').required(),
  reason: Joi.string().max(500).optional()
});

export const createContact = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Received contact data:', JSON.stringify(req.body, null, 2));
    const { error, value } = createContactSchema.validate(req.body);
    if (error) {
      console.error('Validation error details:', error.details);
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

    // Check if contact already exists for this organization
    const existingContact = await Contact.findOne({
      organizationId: user._id,
      email: value.email
    });

    if (existingContact) {
      return res.status(409).json({
        success: false,
        message: 'Contact with this email already exists in your organization'
      });
    }

    // Validate assignedTo user exists if provided
    if (value.assignedTo && value.assignedTo.trim()) {
      const assignedUser = await mongoose.model('User').findById(value.assignedTo);
      if (!assignedUser) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user does not exist'
        });
      }
    }

    const contact = new Contact({
      ...value,
      organizationId: user._id,
      createdBy: user._id,
      updatedBy: user._id,
      aiContext: {
        preferences: value.aiContext?.preferences || [],
        interests: value.aiContext?.interests || [],
        painPoints: value.aiContext?.painPoints || [],
        budget: value.aiContext?.budget || { currency: 'USD' },
        spaceRequirements: value.aiContext?.spaceRequirements || [],
        lastContextUpdate: new Date()
      }
    });

    await contact.save();

    const populatedContact = await Contact.findById(contact._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: { contact: populatedContact }
    });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getContacts = async (req: AuthRequest, res: Response) => {
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
    const type = req.query.type as ContactType;
    const contextState = req.query.contextState as ContextState;
    const assignedTo = req.query.assignedTo as string;
    const priority = req.query.priority as string;
    const tags = req.query.tags as string;

    // Build filter query
    const filter: any = { organizationId: user._id };

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    if (type) filter.type = type;
    if (contextState) filter.contextState = contextState;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (priority) filter.priority = priority;
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagArray };
    }

    const skip = (page - 1) * limit;

    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .populate('assignedTo', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Contact.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          currentPage: page,
          totalPages,
          totalContacts: total,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getContact = async (req: AuthRequest, res: Response) => {
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
        message: 'Invalid contact ID'
      });
    }

    const contact = await Contact.findOne({
      _id: id,
      organizationId: user._id
    })
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('interactions.createdBy', 'firstName lastName email');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: { contact }
    });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateContact = async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== UPDATE CONTACT DEBUG START ===');
    console.log('Contact ID:', req.params.id);
    console.log('User ID:', req.user?._id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { error, value } = updateContactSchema.validate(req.body);
    if (error) {
      console.error('Validation error details:', error.details);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    console.log('Validated data:', JSON.stringify(value, null, 2));

    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;
    console.log('Processing contact ID:', id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid ObjectId format:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID'
      });
    }

    // Validate assignedTo user exists if provided
    if (value.assignedTo && value.assignedTo.trim()) {
      console.log('Validating assignedTo user:', value.assignedTo);
      try {
        const assignedUser = await mongoose.model('User').findById(value.assignedTo);
        if (!assignedUser) {
          console.error('AssignedTo user not found:', value.assignedTo);
          return res.status(400).json({
            success: false,
            message: 'Assigned user does not exist'
          });
        }
        console.log('AssignedTo user validated:', assignedUser._id);
      } catch (assignedToError) {
        console.error('Error validating assignedTo user:', assignedToError);
        return res.status(400).json({
          success: false,
          message: 'Error validating assigned user'
        });
      }
    }

    // Check if email is being changed and if it conflicts with existing contact
    if (value.email) {
      console.log('Checking email conflict for:', value.email);
      try {
        const existingContact = await Contact.findOne({
          organizationId: user._id,
          email: value.email,
          _id: { $ne: id }
        });

        if (existingContact) {
          console.error('Email conflict found:', existingContact._id, existingContact.email);
          return res.status(409).json({
            success: false,
            message: 'Another contact with this email already exists in your organization'
          });
        }
        console.log('No email conflict found');
      } catch (emailCheckError) {
        console.error('Error checking email conflict:', emailCheckError);
        return res.status(500).json({
          success: false,
          message: 'Error checking email uniqueness'
        });
      }
    }

    console.log('Building update data...');
    
    // Separate nested objects from other fields to avoid MongoDB conflicts
    const { aiContext, ...otherFields } = value;
    
    const updateData: any = {
      ...otherFields,
      updatedBy: user._id
    };

    // Update AI context if provided - use dot notation to update specific fields
    if (aiContext) {
      console.log('Processing aiContext update:', JSON.stringify(aiContext, null, 2));
      
      // Always update the lastContextUpdate when aiContext is modified
      updateData['aiContext.lastContextUpdate'] = new Date();
      
      // Update individual aiContext fields using dot notation
      if (aiContext.preferences !== undefined) {
        updateData['aiContext.preferences'] = aiContext.preferences;
        console.log('Setting preferences:', aiContext.preferences);
      }
      if (aiContext.interests !== undefined) {
        updateData['aiContext.interests'] = aiContext.interests;
        console.log('Setting interests:', aiContext.interests);
      }
      if (aiContext.painPoints !== undefined) {
        updateData['aiContext.painPoints'] = aiContext.painPoints;
        console.log('Setting painPoints:', aiContext.painPoints);
      }
      if (aiContext.budget !== undefined) {
        updateData['aiContext.budget'] = aiContext.budget;
        console.log('Setting budget:', aiContext.budget);
      }
      if (aiContext.spaceRequirements !== undefined) {
        updateData['aiContext.spaceRequirements'] = aiContext.spaceRequirements;
        console.log('Setting spaceRequirements:', aiContext.spaceRequirements);
      }
    }
    
    console.log('Final update data:', JSON.stringify(updateData, null, 2));

    console.log('Executing findOneAndUpdate...');
    console.log('Query filter:', { _id: id, organizationId: user._id });
    
    let contact;
    try {
      contact = await Contact.findOneAndUpdate(
        { _id: id, organizationId: user._id },
        updateData,
        { new: true, runValidators: true }
      );
      console.log('findOneAndUpdate completed, contact found:', !!contact);
      
      if (contact) {
        console.log('Contact before population:', contact._id);
      }
    } catch (updateError: any) {
      console.error('Error during findOneAndUpdate:', updateError);
      if (updateError.name === 'ValidationError') {
        console.error('Mongoose validation errors:', updateError.errors);
        return res.status(400).json({
          success: false,
          message: 'Validation error during update',
          errors: Object.values(updateError.errors).map((err: any) => err.message)
        });
      }
      throw updateError; // Re-throw to be caught by outer catch
    }

    if (!contact) {
      console.error('Contact not found with ID:', id, 'and organizationId:', user._id);
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    console.log('Populating contact references...');
    try {
      const populatedContact = await Contact.findById(contact._id)
        .populate('assignedTo', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email');
      
      console.log('Population completed successfully');
      console.log('=== UPDATE CONTACT DEBUG END ===');
      
      res.json({
        success: true,
        message: 'Contact updated successfully',
        data: { contact: populatedContact }
      });
    } catch (populationError) {
      console.error('Error during population:', populationError);
      // Return the contact without population if population fails
      res.json({
        success: true,
        message: 'Contact updated successfully',
        data: { contact }
      });
    }
  } catch (error: any) {
    console.error('=== UPDATE CONTACT ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // More specific error handling
    if (error.name === 'CastError') {
      console.error('MongoDB CastError details:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid data type provided',
        details: error.message
      });
    }
    
    if (error.name === 'ValidationError') {
      console.error('MongoDB ValidationError details:', error.errors);
      return res.status(400).json({
        success: false,
        message: 'Data validation failed',
        errors: Object.values(error.errors).map((err: any) => err.message)
      });
    }
    
    if (error.code === 11000) {
      console.error('MongoDB duplicate key error:', error);
      return res.status(409).json({
        success: false,
        message: 'Duplicate data conflict',
        details: error.message
      });
    }
    
    console.error('=== UPDATE CONTACT ERROR END ===');
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const deleteContact = async (req: AuthRequest, res: Response) => {
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
        message: 'Invalid contact ID'
      });
    }

    const contact = await Contact.findOneAndDelete({
      _id: id,
      organizationId: user._id
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const addInteraction = async (req: AuthRequest, res: Response) => {
  try {
    const { error, value } = addInteractionSchema.validate(req.body);
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
        message: 'Invalid contact ID'
      });
    }

    const contact = await Contact.findOne({
      _id: id,
      organizationId: user._id
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    contact.addInteraction({
      ...value,
      createdBy: user._id
    });

    contact.updatedBy = user._id;
    await contact.save();

    const updatedContact = await Contact.findById(contact._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('interactions.createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Interaction added successfully',
      data: { contact: updatedContact }
    });
  } catch (error) {
    console.error('Add interaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateContextState = async (req: AuthRequest, res: Response) => {
  try {
    const { error, value } = updateContextStateSchema.validate(req.body);
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
        message: 'Invalid contact ID'
      });
    }

    const contact = await Contact.findOne({
      _id: id,
      organizationId: user._id
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    contact.updatedBy = user._id;
    contact.updateContextState(value.contextState, value.reason);
    await contact.save();

    const updatedContact = await Contact.findById(contact._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('interactions.createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Context state updated successfully',
      data: { contact: updatedContact }
    });
  } catch (error) {
    console.error('Update context state error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getContactStats = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const stats = await Contact.aggregate([
      { $match: { organizationId: user._id } },
      {
        $facet: {
          totalContacts: [{ $count: "count" }],
          contactsByType: [
            { $group: { _id: "$type", count: { $sum: 1 } } }
          ],
          contactsByState: [
            { $group: { _id: "$contextState", count: { $sum: 1 } } }
          ],
          contactsByPriority: [
            { $group: { _id: "$priority", count: { $sum: 1 } } }
          ],
          recentInteractions: [
            { $unwind: "$interactions" },
            { $sort: { "interactions.createdAt": -1 } },
            { $limit: 10 },
            { $replaceRoot: { newRoot: "$interactions" } }
          ]
        }
      }
    ]);

    const result = stats[0];

    res.json({
      success: true,
      data: {
        totalContacts: result.totalContacts[0]?.count || 0,
        contactsByType: result.contactsByType,
        contactsByState: result.contactsByState,
        contactsByPriority: result.contactsByPriority,
        recentInteractions: result.recentInteractions
      }
    });
  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getContactAIContext = async (req: AuthRequest, res: Response) => {
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
        message: 'Invalid contact ID'
      });
    }

    const contact = await Contact.findOne({
      _id: id,
      organizationId: user._id
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    const aiContext = AIContextService.generateContextSummary(contact);

    res.json({
      success: true,
      data: { aiContext }
    });
  } catch (error) {
    console.error('Get contact AI context error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getConversationPrompts = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;
    const { interactionType } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID'
      });
    }

    if (!interactionType || typeof interactionType !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Interaction type is required'
      });
    }

    const contact = await Contact.findOne({
      _id: id,
      organizationId: user._id
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    const prompts = AIContextService.generateConversationPrompts(contact, interactionType);

    res.json({
      success: true,
      data: { prompts }
    });
  } catch (error) {
    console.error('Get conversation prompts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};