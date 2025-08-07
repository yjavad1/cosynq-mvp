import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

/**
 * Middleware to check if user has completed onboarding
 * Redirects to onboarding if not completed, unless accessing onboarding routes
 */
export const requireOnboarding = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    // Skip onboarding check for these routes
    const exemptRoutes = [
      '/api/auth/logout',
      '/api/auth/refresh',
      '/api/auth/profile',
      '/api/onboarding',
      '/api/health'
    ];

    // Skip onboarding check for preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    // Check if current route is exempt
    const isExemptRoute = exemptRoutes.some(route => 
      req.path.startsWith(route) || req.path === route
    );

    if (isExemptRoute) {
      return next();
    }

    // Check if user exists in request
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get user from database to check latest onboarding status
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user requires onboarding
    if (user.requiresOnboarding()) {
      return res.status(403).json({
        success: false,
        message: 'Onboarding required',
        code: 'ONBOARDING_REQUIRED',
        data: {
          onboardingRequired: true,
          onboardingData: user.onboardingData,
          completedSteps: user.onboardingData?.completionSteps || []
        }
      });
    }

    // User has completed onboarding, proceed
    next();
  } catch (error) {
    console.error('Onboarding middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to optionally check onboarding status without blocking
 * Adds onboarding info to response headers for frontend use
 */
export const checkOnboardingStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      return next();
    }

    const user = await User.findById(req.user.id);
    
    if (user) {
      // Add onboarding status to response headers
      res.setHeader('X-Onboarding-Required', user.requiresOnboarding().toString());
      res.setHeader('X-Onboarding-Completed', user.onboardingCompleted.toString());
      
      if (user.onboardingData?.completionSteps) {
        res.setHeader('X-Onboarding-Steps', JSON.stringify(user.onboardingData.completionSteps));
      }
    }

    next();
  } catch (error) {
    console.error('Onboarding status check error:', error);
    // Don't fail the request, just continue without onboarding headers
    next();
  }
};