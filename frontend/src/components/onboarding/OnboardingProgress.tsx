import { CheckCircle, Building, MapPin, Rocket } from 'lucide-react';
import { SetupStep } from '@shared/types';
import { useLocationStats } from '../../hooks/useLocations';

interface OnboardingProgressProps {
  currentStep: SetupStep;
  completedSteps: SetupStep[];
  companyProfile?: {
    companyName: string;
    industry: string;
    companySize: string;
  };
  expectedLocations?: number;
  className?: string;
}

interface StepInfo {
  key: SetupStep;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const steps: StepInfo[] = [
  { 
    key: 'company', 
    title: 'Company Profile', 
    description: 'Business information',
    icon: Building
  },
  { 
    key: 'locations', 
    title: 'Add Locations', 
    description: 'Workspace locations',
    icon: MapPin
  },
  { 
    key: 'launch', 
    title: 'Launch', 
    description: 'Complete setup',
    icon: Rocket
  },
];

export function OnboardingProgress({ 
  currentStep, 
  completedSteps, 
  companyProfile,
  expectedLocations = 1,
  className = ''
}: OnboardingProgressProps) {
  const { data: locationStats } = useLocationStats();

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const totalLocations = locationStats?.totalLocations || 0;

  const getStepStatus = (stepKey: SetupStep, stepIndex: number) => {
    if (completedSteps.includes(stepKey)) return 'completed';
    if (stepKey === currentStep) return 'current';
    if (stepIndex < currentStepIndex) return 'completed';
    return 'upcoming';
  };

  const getStepProgress = (stepKey: SetupStep) => {
    switch (stepKey) {
      case 'company':
        return companyProfile ? 100 : 0;
      case 'locations':
        if (totalLocations === 0) return 0;
        return Math.min(100, (totalLocations / expectedLocations) * 100);
      case 'launch':
        return completedSteps.includes('launch') ? 100 : 0;
      default:
        return 0;
    }
  };

  const getStepDetails = (stepKey: SetupStep) => {
    switch (stepKey) {
      case 'company':
        return companyProfile ? companyProfile.companyName : 'Not started';
      case 'locations':
        if (totalLocations === 0) return 'No locations added';
        if (totalLocations >= expectedLocations) return `${totalLocations} location${totalLocations > 1 ? 's' : ''} added ✓`;
        return `${totalLocations}/${expectedLocations} locations added`;
      case 'launch':
        return completedSteps.includes('launch') ? 'Workspace launched!' : 'Ready to launch';
      default:
        return '';
    }
  };

  const overallProgress = steps.reduce((total, step) => {
    return total + getStepProgress(step.key);
  }, 0) / steps.length;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Onboarding Progress</h3>
            <p className="text-sm text-gray-600">Complete your workspace setup</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{Math.round(overallProgress)}%</div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {/* Steps List */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const status = getStepStatus(step.key, index);
            const progress = getStepProgress(step.key);
            const details = getStepDetails(step.key);

            return (
              <div key={step.key} className="flex items-start space-x-3">
                {/* Icon */}
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                  ${status === 'completed' 
                    ? 'bg-green-100 text-green-600' 
                    : status === 'current'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }
                `}>
                  {status === 'completed' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${
                        status === 'completed' ? 'text-green-900' : 
                        status === 'current' ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-medium ${
                        status === 'completed' ? 'text-green-600' : 
                        status === 'current' ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {Math.round(progress)}%
                      </div>
                    </div>
                  </div>

                  {/* Progress bar for current/incomplete steps */}
                  {(status === 'current' || (progress > 0 && progress < 100)) && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full transition-all duration-300 ${
                            status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Details */}
                  <p className="text-xs text-gray-600 mt-1">{details}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Next Steps */}
        {overallProgress < 100 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-1">Next Steps</h4>
            <p className="text-sm text-blue-700">
              {currentStep === 'company' && 'Complete your company profile to continue'}
              {currentStep === 'locations' && `Add ${expectedLocations - totalLocations} more location${expectedLocations - totalLocations !== 1 ? 's' : ''} to continue`}
              {currentStep === 'launch' && 'Launch your workspace and start managing your coworking space!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}