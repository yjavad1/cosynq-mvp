import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, Settings, BarChart3, Calendar, Building, MapPin, Rocket, CheckCircle, ArrowRight } from 'lucide-react';
import { SetupWizard } from '../components/setup/SetupWizard';
import { LocationsManagement } from '../components/locations/LocationsManagement';
import { OnboardingProgress } from '../components/onboarding/OnboardingProgress';
import { useContactStats } from '../hooks/useContacts';
import { useLocationStats } from '../hooks/useLocations';
import { useSpaceStats } from '../hooks/useSpaces';

const DashboardPage: React.FC = () => {
  const { user, logout, requiresOnboarding } = useAuth();
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);

  // Setup is considered completed if onboarding is done
  const isSetupCompleted = !requiresOnboarding;

  // Data queries for dashboard stats
  const { data: contactStats } = useContactStats();
  const { data: locationStats } = useLocationStats();
  const { data: spaceStats } = useSpaceStats();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSetupComplete = () => {
    // Onboarding completion is now handled by the onboarding system
    setIsSetupWizardOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Cosynq Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {!isSetupCompleted ? (
            /* Setup Required State */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Welcome Section */}
              <div className="lg:col-span-2">
                <div className="text-center mb-8">
                  <Rocket className="mx-auto h-16 w-16 text-blue-600 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Cosynq!</h2>
                  <p className="text-lg text-gray-600 mb-8">
                    Let's set up your coworking space in just a few steps
                  </p>
                  <button
                    onClick={() => setIsSetupWizardOpen(true)}
                    className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Rocket className="h-5 w-5 mr-2" />
                    Complete Setup
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">What you'll set up:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Building className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Company Profile</h4>
                        <p className="text-sm text-gray-600">Basic company information</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <MapPin className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Locations</h4>
                        <p className="text-sm text-gray-600">Your workspace locations</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Building className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Space Types</h4>
                        <p className="text-sm text-gray-600">Configure available spaces</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <BarChart3 className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Pricing</h4>
                        <p className="text-sm text-gray-600">Set your pricing structure</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Onboarding Progress */}
              <div className="lg:col-span-1">
                <OnboardingProgress 
                  currentStep="company"
                  completedSteps={[]}
                  expectedLocations={1}
                />
              </div>
            </div>
          ) : (
            /* Setup Completed - Show Dashboard */
            <>
              {/* Dashboard Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Contacts
                          </dt>
                          <dd className="text-2xl font-bold text-gray-900">
                            {contactStats?.totalContacts || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <MapPin className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Locations
                          </dt>
                          <dd className="text-2xl font-bold text-gray-900">
                            {locationStats?.totalLocations || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Building className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Spaces
                          </dt>
                          <dd className="text-2xl font-bold text-gray-900">
                            {spaceStats?.totalSpaces || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Setup Status
                          </dt>
                          <dd className="text-lg font-bold text-green-600">
                            Complete
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Locations Management Section */}
              <div className="mb-8">
                <LocationsManagement maxDisplayed={6} />
              </div>
            </>
          )}

          {/* Quick Actions - Only show if setup is completed */}
          {isSetupCompleted && (
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Manage Your Workspace</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                  to="/contacts"
                  className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                      <Users className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        Contact Management
                      </h3>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Manage leads, members, and prospects with AI-powered context tracking.
                    </p>
                    <div className="mt-3 text-sm font-medium text-blue-600">
                      {contactStats?.totalContacts || 0} contacts
                    </div>
                  </div>
                </Link>

                <Link
                  to="/locations"
                  className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                      <MapPin className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        Location Management
                      </h3>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Manage your workspace locations with operating hours, contacts, and amenities.
                    </p>
                    <div className="mt-3 text-sm font-medium text-green-600">
                      {locationStats?.totalLocations || 0} locations
                    </div>
                  </div>
                </Link>

                <Link
                  to="/spaces"
                  className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-purple-500 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                      <Building className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        Space Management
                      </h3>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Manage workspaces, meeting rooms, and resource availability.
                    </p>
                    <div className="mt-3 text-sm font-medium text-purple-600">
                      {spaceStats?.totalSpaces || 0} spaces
                    </div>
                  </div>
                </Link>

                <div className="group relative bg-white p-6 rounded-lg shadow opacity-50 cursor-not-allowed">
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-gray-50 text-gray-400 ring-4 ring-white">
                      <Calendar className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-400">
                      Bookings
                    </h3>
                    <p className="mt-2 text-sm text-gray-400">
                      Coming soon - Manage space bookings and reservations.
                    </p>
                  </div>
                </div>

                <div className="group relative bg-white p-6 rounded-lg shadow opacity-50 cursor-not-allowed">
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-gray-50 text-gray-400 ring-4 ring-white">
                      <BarChart3 className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-400">
                      Analytics
                    </h3>
                    <p className="mt-2 text-sm text-gray-400">
                      Coming soon - Business insights and reporting.
                    </p>
                  </div>
                </div>

                <div className="group relative bg-white p-6 rounded-lg shadow opacity-50 cursor-not-allowed">
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-gray-50 text-gray-400 ring-4 ring-white">
                      <Settings className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-400">
                      Settings
                    </h3>
                    <p className="mt-2 text-sm text-gray-400">
                      Coming soon - Manage your workspace and preferences.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Welcome message for completed setup */}
          {isSetupCompleted && (
            <div className="mt-8">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Your workspace is ready!
                      </h3>
                      <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>
                          Your coworking space setup is complete. You can now manage contacts, locations, and spaces
                          from the dashboard. Start by adding contacts or exploring your workspace management tools.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5">
                    <div className="text-sm text-gray-600">
                      <p><strong>Member since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Setup Wizard Modal */}
      <SetupWizard
        isOpen={isSetupWizardOpen}
        onClose={() => setIsSetupWizardOpen(false)}
        onComplete={handleSetupComplete}
      />
    </div>
  );
};

export default DashboardPage;