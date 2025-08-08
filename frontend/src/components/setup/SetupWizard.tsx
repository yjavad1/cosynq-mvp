import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Building, 
  MapPin, 
  Rocket,
  CheckCircle
} from 'lucide-react';
import { 
  SetupStep, 
  CompanyProfile, 
  SetupWizardProps
} from '@shared/types';
import { LocationForm } from '../locations/LocationForm';
import { useLocationStats } from '../../hooks/useLocations';
import { useAuth } from '../../contexts/AuthContext';

const steps: Array<{ key: SetupStep; title: string; description: string; icon: React.ComponentType<any> }> = [
  { 
    key: 'company', 
    title: 'Company Profile', 
    description: 'Tell us about your company',
    icon: Building
  },
  { 
    key: 'locations', 
    title: 'Add Locations', 
    description: 'Set up your workspace locations',
    icon: MapPin
  },
  { 
    key: 'launch', 
    title: 'Launch', 
    description: 'Complete your setup',
    icon: Rocket
  },
];

const industries = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Marketing',
  'Consulting',
  'Real Estate',
  'Legal',
  'Non-profit',
  'Other'
];

const companySizes = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-1000 employees',
  '1000+ employees'
];


export function SetupWizard({ isOpen, onClose, onComplete, initialStep = 'company' }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>(initialStep);
  const [completedSteps, setCompletedSteps] = useState<SetupStep[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [isLocationFormOpen, setIsLocationFormOpen] = useState(false);
  const [expectedLocations, setExpectedLocations] = useState<number>(1);

  const { user } = useAuth();
  const { data: locationStats } = useLocationStats();

  const {
    register: registerCompany,
    formState: { errors: companyErrors, isValid: isCompanyValid },
    watch: watchCompany,
    reset: resetCompanyForm
  } = useForm<CompanyProfile>({
    defaultValues: {
      companyName: '',
      industry: '',
      companySize: '',
      description: ''
    }
  });


  // Reset to initial step when wizard opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(initialStep);
    }
  }, [isOpen, initialStep]);

  // Prefill company profile if user already has onboarding data
  useEffect(() => {
    if (user?.onboardingData && isOpen) {
      const existingData = {
        companyName: user.onboardingData.companyName || '',
        industry: user.onboardingData.industry || '',
        companySize: user.onboardingData.companySize || '',
        description: user.onboardingData.description || '',
        website: user.onboardingData.website || ''
      };
      
      // Only prefill if we have some company data
      if (existingData.companyName || existingData.industry || existingData.companySize) {
        resetCompanyForm(existingData);
        setCompanyProfile(existingData);
        
        // Mark company step as completed if we have basic info
        if (existingData.companyName && existingData.industry && existingData.companySize) {
          setCompletedSteps(prev => prev.includes('company') ? prev : [...prev, 'company']);
        }
      }
    }
  }, [user, isOpen, resetCompanyForm]);

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const canProceed = () => {
    switch (currentStep) {
      case 'company':
        return isCompanyValid && watchCompany('companyName') && watchCompany('industry') && watchCompany('companySize');
      case 'locations':
        return (locationStats?.totalLocations || 0) >= expectedLocations;
      case 'launch':
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep === 'company' && canProceed()) {
      const companyData = watchCompany();
      setCompanyProfile(companyData);
      if (!completedSteps.includes('company')) {
        setCompletedSteps(prev => [...prev, 'company']);
      }
    }

    if (!isLastStep) {
      const nextStepIndex = currentStepIndex + 1;
      setCurrentStep(steps[nextStepIndex].key);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      const prevStepIndex = currentStepIndex - 1;
      setCurrentStep(steps[prevStepIndex].key);
    }
  };

  const handleStepClick = (stepKey: SetupStep) => {
    const stepIndex = steps.findIndex(step => step.key === stepKey);
    const currentIndex = steps.findIndex(step => step.key === currentStep);
    
    // Only allow going to previous steps or next step if current step is valid
    if (stepIndex <= currentIndex || (stepIndex === currentIndex + 1 && canProceed())) {
      setCurrentStep(stepKey);
    }
  };

  const handleLocationSuccess = () => {
    setIsLocationFormOpen(false);
    if (!completedSteps.includes('locations')) {
      setCompletedSteps(prev => [...prev, 'locations']);
    }
  };


  const handleFinishSetup = async () => {
    // Mark setup as completed
    if (!completedSteps.includes('launch')) {
      setCompletedSteps(prev => [...prev, 'launch']);
    }
    
    // Save setup completion to localStorage or API
    localStorage.setItem('cosynq_setup_completed', 'true');
    localStorage.setItem('cosynq_company_profile', JSON.stringify(companyProfile));
    
    onComplete();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'company':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    {...registerCompany('companyName', { required: 'Company name is required' })}
                    type="text"
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your company name"
                  />
                  {companyErrors.companyName && (
                    <p className="mt-1 text-sm text-red-600">{companyErrors.companyName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry *
                  </label>
                  <select
                    {...registerCompany('industry', { required: 'Industry is required' })}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select your industry</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                  {companyErrors.industry && (
                    <p className="mt-1 text-sm text-red-600">{companyErrors.industry.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Size *
                  </label>
                  <select
                    {...registerCompany('companySize', { required: 'Company size is required' })}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select company size</option>
                    {companySizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  {companyErrors.companySize && (
                    <p className="mt-1 text-sm text-red-600">{companyErrors.companySize.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    {...registerCompany('website')}
                    type="url"
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://your-website.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Description
                  </label>
                  <textarea
                    {...registerCompany('description')}
                    rows={3}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of your company..."
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'locations':
        const totalLocations = locationStats?.totalLocations || 0;
        const locationsNeeded = Math.max(0, expectedLocations - totalLocations);
        
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your Locations</h3>
              <p className="text-sm text-gray-600 mb-6">
                Add your workspace locations. You need at least {expectedLocations} location{expectedLocations > 1 ? 's' : ''} to continue.
              </p>

              {/* Progress Indicator */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    Location Progress
                  </span>
                  <span className="text-sm text-blue-700">
                    {totalLocations} of {expectedLocations} added
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (totalLocations / expectedLocations) * 100)}%` }}
                  />
                </div>
                {locationsNeeded > 0 && (
                  <p className="text-xs text-blue-700 mt-2">
                    Add {locationsNeeded} more location{locationsNeeded > 1 ? 's' : ''} to continue to the next step
                  </p>
                )}
              </div>

              {totalLocations === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No locations added yet</h4>
                  <p className="text-gray-600 mb-6">Get started by adding your first workspace location</p>
                  <button
                    onClick={() => setIsLocationFormOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Add Your First Location
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Display recent locations from API */}
                  {locationStats?.recentLocations?.map((location) => (
                    <div key={location._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{location.name}</h4>
                          <p className="text-sm text-gray-600 font-mono">{location.code}</p>
                          <p className="text-sm text-gray-500">
                            {location.address.city}
                          </p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  ))}

                  {/* Add Another Location Button */}
                  <button
                    onClick={() => setIsLocationFormOpen(true)}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                  >
                    <MapPin className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-600">
                      {totalLocations >= expectedLocations ? 'Add Another Location (Optional)' : 'Add Another Location'}
                    </span>
                  </button>

                  {/* Expected Locations Selector */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How many locations do you plan to manage?
                    </label>
                    <select 
                      value={expectedLocations}
                      onChange={(e) => setExpectedLocations(Number(e.target.value))}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 10, 15, 20].map(num => (
                        <option key={num} value={num}>
                          {num} location{num > 1 ? 's' : ''}
                        </option>
                      ))}
                      <option value={99}>More than 20 locations</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      You can always add more locations later from your dashboard
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );


      case 'launch':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Rocket className="mx-auto h-16 w-16 text-blue-600 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-4">Ready to Launch!</h3>
              <p className="text-gray-600 mb-8">
                Your workspace is set up and ready to go. Review your setup below.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Company Profile</h4>
                <p className="text-sm text-gray-600">{companyProfile?.companyName}</p>
                <p className="text-sm text-gray-500">{companyProfile?.industry} • {companyProfile?.companySize}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Locations ({locationStats?.totalLocations || 0})</h4>
                {locationStats?.recentLocations?.slice(0, 2).map((location: any) => (
                  <p key={location._id} className="text-sm text-gray-600">
                    {location.name} - {location.address.city}
                  </p>
                ))}
                {(locationStats?.totalLocations || 0) > 2 && (
                  <p className="text-sm text-gray-500">+{(locationStats?.totalLocations || 0) - 2} more locations</p>
                )}
                {!locationStats?.totalLocations && (
                  <p className="text-sm text-gray-500">No locations added yet</p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <Rocket className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">What's Next?</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Configure your space offerings, pricing, and advanced settings on your dashboard.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-800">Setup Complete</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Click "Launch Workspace" to access your dashboard and start managing your coworking space.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                  {/* Header */}
                  <div className="bg-white px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                        Setup Wizard
                      </Dialog.Title>
                      <button
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                        onClick={onClose}
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Progress Steps */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        {steps.map((step, index) => {
                          const Icon = step.icon;
                          const isActive = step.key === currentStep;
                          const isCompleted = completedSteps.includes(step.key);
                          const isAccessible = index <= currentStepIndex || completedSteps.includes(step.key);

                          return (
                            <div key={step.key} className="flex items-center">
                              <button
                                onClick={() => handleStepClick(step.key)}
                                disabled={!isAccessible}
                                className={`
                                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                                  ${isActive 
                                    ? 'border-blue-600 bg-blue-600 text-white' 
                                    : isCompleted
                                      ? 'border-green-600 bg-green-600 text-white'
                                      : isAccessible
                                        ? 'border-gray-300 bg-white text-gray-400 hover:border-gray-400'
                                        : 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                                  }
                                `}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="h-5 w-5" />
                                ) : (
                                  <Icon className="h-5 w-5" />
                                )}
                              </button>
                              {index < steps.length - 1 && (
                                <div className={`w-12 h-1 mx-2 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="mt-2 text-center">
                        <h4 className="text-sm font-medium text-gray-900">
                          {steps[currentStepIndex].title}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {steps[currentStepIndex].description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="bg-white px-6 py-6 max-h-96 overflow-y-auto">
                    {renderStepContent()}
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handlePrevious}
                      disabled={isFirstStep}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </button>

                    <span className="text-sm text-gray-500">
                      Step {currentStepIndex + 1} of {steps.length}
                    </span>

                    {isLastStep ? (
                      <button
                        type="button"
                        onClick={handleFinishSetup}
                        className="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <Rocket className="h-4 w-4 mr-2" />
                        Launch Workspace
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={!canProceed()}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Location Form Modal */}
      {isLocationFormOpen && (
        <LocationForm
          isOpen={isLocationFormOpen}
          onClose={() => setIsLocationFormOpen(false)}
          onSuccess={handleLocationSuccess}
          isOnboarding={true}
          onOnboardingNext={() => {
            setCurrentStep('launch');
            setIsLocationFormOpen(false);
          }}
        />
      )}
    </>
  );
}