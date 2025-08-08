import { AlertCircle, Rocket, CheckCircle, MapPin, Building } from 'lucide-react';
import { OnboardingStatus } from '../../hooks/useOnboardingStatus';

interface IncompleteSetupBannerProps {
  status: OnboardingStatus;
  onCompleteSetup: () => void;
  onResumeOnboarding: () => void;
}

export function IncompleteSetupBanner({ 
  status, 
  onCompleteSetup, 
  onResumeOnboarding 
}: IncompleteSetupBannerProps) {
  const getNextStepMessage = () => {
    switch (status.nextStep) {
      case 'company':
        return 'Complete your company profile to get started';
      case 'locations':
        return 'Add your first workspace location';
      default:
        return 'Complete your workspace setup';
    }
  };

  const getNextStepIcon = () => {
    switch (status.nextStep) {
      case 'company':
        return Building;
      case 'locations':
        return MapPin;
      default:
        return Rocket;
    }
  };

  const NextStepIcon = getNextStepIcon();

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 border-l-4 border-blue-500 p-6 mb-8 rounded-lg shadow-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-8 w-8 text-blue-100" />
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Complete Your Workspace Setup
              </h3>
              <p className="mt-1 text-blue-100">
                {getNextStepMessage()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Progress indicator */}
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {status.completionPercentage}%
                </div>
                <div className="text-xs text-blue-200">Complete</div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 w-full bg-blue-500 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${status.completionPercentage}%` }}
            />
          </div>

          {/* Progress steps */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                {status.hasCompanyProfile ? (
                  <CheckCircle className="h-4 w-4 text-green-300" />
                ) : (
                  <Building className="h-4 w-4 text-blue-200" />
                )}
                <span className={`${status.hasCompanyProfile ? 'text-green-200' : 'text-blue-200'}`}>
                  Company Profile
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {status.hasLocations ? (
                  <CheckCircle className="h-4 w-4 text-green-300" />
                ) : (
                  <MapPin className="h-4 w-4 text-blue-200" />
                )}
                <span className={`${status.hasLocations ? 'text-green-200' : 'text-blue-200'}`}>
                  Locations
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center space-x-4">
            <button
              onClick={onCompleteSetup}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <NextStepIcon className="h-5 w-5 mr-2" />
              Complete Setup Now
            </button>
            
            {status.hasCompanyProfile && (
              <button
                onClick={onResumeOnboarding}
                className="inline-flex items-center px-4 py-3 border border-blue-300 text-base font-medium rounded-md text-blue-100 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-colors"
              >
                Resume Setup
              </button>
            )}
          </div>

          {/* Helpful tip */}
          <div className="mt-4 p-3 bg-blue-500 bg-opacity-50 rounded-md">
            <p className="text-sm text-blue-100">
              💡 <strong>Tip:</strong> Complete setup takes just 2-3 minutes. Configure spaces and pricing later on your dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}