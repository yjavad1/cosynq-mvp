import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Building, Users, ArrowRight, ArrowLeft, CheckCircle, X } from 'lucide-react';

interface OnboardingData {
  companyName: string;
  industry: string;
  companySize: string;
  website: string;
  description: string;
}

const OnboardingPage: React.FC = () => {
  const { updateOnboardingStatus } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    companyName: '',
    industry: '',
    companySize: '',
    website: '',
    description: ''
  });

  const steps = [
    {
      title: 'Company Information',
      subtitle: 'Tell us about your coworking space',
      icon: Building,
      fields: ['companyName', 'industry', 'companySize']
    },
    {
      title: 'Additional Details',
      subtitle: 'Help us understand your business better',
      icon: Users,
      fields: ['website', 'description']
    }
  ];

  useEffect(() => {
    // Load existing onboarding data if available
    const loadOnboardingData = async () => {
      try {
        const response = await apiService.getOnboardingStatus();
        if (response.data.success && response.data.data?.onboardingData) {
          const data = response.data.data.onboardingData;
          setOnboardingData({
            companyName: data.companyName || '',
            industry: data.industry || '',
            companySize: data.companySize || '',
            website: data.website || '',
            description: data.description || ''
          });
        }
      } catch (error) {
        console.error('Failed to load onboarding data:', error);
      }
    };

    loadOnboardingData();
  }, []);

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    setOnboardingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isStepValid = (stepIndex: number): boolean => {
    const currentStepData = steps[stepIndex];
    return currentStepData.fields.every(field => {
      const value = onboardingData[field as keyof OnboardingData];
      return value && value.trim().length > 0;
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.updateOnboardingData({
        ...onboardingData,
        completionSteps: ['company', 'locations']
      });

      if (response.data.success) {
        updateOnboardingStatus(false);
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.completeOnboarding(true);
      
      if (response.data.success) {
        updateOnboardingStatus(false);
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to skip onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const industryOptions = [
    'Coworking Space',
    'Business Center',
    'Shared Office',
    'Creative Space',
    'Tech Hub',
    'Startup Incubator',
    'Flexible Workspace',
    'Other'
  ];

  const companySizeOptions = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1000',
    '1000+'
  ];

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            <StepIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Welcome to Cosynq!</h1>
          <p className="mt-2 text-sm text-gray-600">
            Let's get your coworking space set up in just a few steps
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((_, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index <= currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 h-0.5 ml-2 ${
                        index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h2 className="text-lg font-medium text-gray-900">
                {currentStepData.title}
              </h2>
              <p className="text-sm text-gray-600">
                {currentStepData.subtitle}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <X className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {currentStep === 0 && (
              <>
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Company Name *
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    required
                    value={onboardingData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Enter your coworking space name"
                  />
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                    Industry Type *
                  </label>
                  <select
                    id="industry"
                    required
                    value={onboardingData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select industry type</option>
                    {industryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="companySize" className="block text-sm font-medium text-gray-700">
                    Expected Member Capacity *
                  </label>
                  <select
                    id="companySize"
                    required
                    value={onboardingData.companySize}
                    onChange={(e) => handleInputChange('companySize', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select expected capacity</option>
                    {companySizeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option} members
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {currentStep === 1 && (
              <>
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                    Website (Optional)
                  </label>
                  <input
                    id="website"
                    type="url"
                    value={onboardingData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="https://your-website.com"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    value={onboardingData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Tell us about your coworking space..."
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:underline"
                  title="You can complete setup later from your dashboard"
                >
                  I'll do this later
                </button>

                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid(currentStep)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Completing...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <CheckCircle className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;