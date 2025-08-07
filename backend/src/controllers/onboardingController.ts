import { Request, Response } from 'express';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import Joi from 'joi';

const updateOnboardingSchema = Joi.object({
  companyName: Joi.string().trim().max(200).optional(),
  industry: Joi.string().trim().max(100).optional(),
  companySize: Joi.string().valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+').optional(),
  website: Joi.string().trim().max(200).optional(),
  description: Joi.string().trim().max(1000).optional(),
  completionSteps: Joi.array().items(
    Joi.string().valid('company', 'locations', 'spaces', 'pricing', 'launch')
  ).optional(),
  skipOnboarding: Joi.boolean().optional()
});

/**
 * Get current onboarding status and data
 */
export const getOnboardingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    res.json({
      success: true,
      data: {
        onboardingCompleted: user.onboardingCompleted,
        onboardingSkipped: user.onboardingSkipped,
        onboardingCompletedAt: user.onboardingCompletedAt,
        onboardingData: user.onboardingData || {},
        requiresOnboarding: user.requiresOnboarding(),
        completedSteps: user.onboardingData?.completionSteps || []
      }
    });
  } catch (error) {
    console.error('Get onboarding status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update onboarding data and progress
 */
export const updateOnboardingData = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { error, value } = updateOnboardingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { skipOnboarding, ...onboardingData } = value;

    // Update onboarding data
    if (!user.onboardingData) {
      user.onboardingData = {};
    }

    // Update the onboarding data fields
    Object.assign(user.onboardingData, onboardingData);

    // Handle skip onboarding
    if (skipOnboarding === true) {
      user.markOnboardingCompleted(true);
    } else {
      // Check if onboarding should be marked as completed
      const hasCompanyName = user.onboardingData.companyName && user.onboardingData.companyName.trim().length > 0;
      const hasIndustry = user.onboardingData.industry && user.onboardingData.industry.trim().length > 0;
      
      if (hasCompanyName && hasIndustry) {
        user.markOnboardingCompleted(false);
      }
    }

    await user.save();

    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      onboardingCompleted: user.onboardingCompleted,
      onboardingSkipped: user.onboardingSkipped,
      onboardingData: user.onboardingData,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      message: 'Onboarding data updated successfully',
      data: {
        user: userResponse,
        requiresOnboarding: user.requiresOnboarding()
      }
    });
  } catch (error) {
    console.error('Update onboarding data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Complete onboarding (alternative endpoint)
 */
export const completeOnboarding = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { skipOnboarding } = req.body;

    user.markOnboardingCompleted(skipOnboarding === true);
    await user.save();

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        onboardingCompleted: user.onboardingCompleted,
        onboardingSkipped: user.onboardingSkipped,
        requiresOnboarding: user.requiresOnboarding()
      }
    });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Reset onboarding (for testing or re-onboarding)
 */
export const resetOnboarding = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Reset onboarding status
    user.onboardingCompleted = false;
    user.onboardingSkipped = false;
    user.onboardingCompletedAt = undefined;
    
    // Optionally reset onboarding data
    const { resetData } = req.body;
    if (resetData === true) {
      user.onboardingData = {};
    }

    await user.save();

    res.json({
      success: true,
      message: 'Onboarding reset successfully',
      data: {
        onboardingCompleted: user.onboardingCompleted,
        onboardingSkipped: user.onboardingSkipped,
        onboardingData: user.onboardingData,
        requiresOnboarding: user.requiresOnboarding()
      }
    });
  } catch (error) {
    console.error('Reset onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};