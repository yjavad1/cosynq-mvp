import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocationStats } from './useLocations';

export interface OnboardingStatus {
  isCompleted: boolean;
  hasCompanyProfile: boolean;
  hasLocations: boolean;
  nextStep: 'company' | 'locations' | 'completed';
  completionPercentage: number;
}

export function useOnboardingStatus(): OnboardingStatus {
  const { user, requiresOnboarding } = useAuth();
  const { data: locationStats } = useLocationStats();
  const [status, setStatus] = useState<OnboardingStatus>({
    isCompleted: false,
    hasCompanyProfile: false,
    hasLocations: false,
    nextStep: 'company',
    completionPercentage: 0
  });

  useEffect(() => {
    if (!user) return;

    // Check if user has company profile (basic onboarding info)
    const hasCompanyProfile = !!(
      user.onboardingData?.companyName && 
      user.onboardingData?.industry && 
      user.onboardingData?.companySize
    );

    // Check if user has locations
    const hasLocations = (locationStats?.totalLocations || 0) > 0;

    // Calculate completion percentage (2 steps: company + locations)
    const completedSteps = [hasCompanyProfile, hasLocations].filter(Boolean).length;
    const completionPercentage = Math.round((completedSteps / 2) * 100);

    // Determine if onboarding is completed
    // Consider onboarding complete if user has company profile and locations
    const isCompleted = hasCompanyProfile && hasLocations && !requiresOnboarding;

    // Determine next step
    let nextStep: OnboardingStatus['nextStep'] = 'completed';
    if (!hasCompanyProfile) {
      nextStep = 'company';
    } else if (!hasLocations) {
      nextStep = 'locations';
    }

    setStatus({
      isCompleted,
      hasCompanyProfile,
      hasLocations,
      nextStep,
      completionPercentage
    });
  }, [user, requiresOnboarding, locationStats]);

  return status;
}