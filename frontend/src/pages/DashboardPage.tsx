import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  BarChart3,
  Building, 
  MapPin, 
  CheckCircle, 
  ArrowRight,
  Plus,
  TrendingUp,
  Bell,
  Search,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { SetupWizard } from '../components/setup/SetupWizard';
import { IncompleteSetupBanner } from '../components/onboarding/IncompleteSetupBanner';
import { DashboardLocationCard } from '../components/dashboard/LocationCard';
import { SetupProgressCard } from '../components/dashboard/SetupProgressCard';
import { useContactStats } from '../hooks/useContacts';
import { useLocationStats, useLocations } from '../hooks/useLocations';
import { useSpaceStats } from '../hooks/useSpaces';
import { useBookingStats } from '../hooks/useBookings';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { Location } from '@shared/types';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  const [setupWizardStep, setSetupWizardStep] = useState<'company' | 'locations'>('company');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Use comprehensive onboarding status
  const onboardingStatus = useOnboardingStatus();

  // Check for success message from space configuration
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
      // Auto-hide after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, [location]);

  // Data queries for dashboard stats
  const { data: contactStats } = useContactStats();
  const { data: locationStats, isLoading: locationStatsLoading, error: locationStatsError } = useLocationStats();
  const { data: locationsData, isLoading: locationsLoading } = useLocations({ limit: 4 });
  const { data: spaceStats } = useSpaceStats();
  const { data: bookingStats } = useBookingStats();


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

  const handleCompleteSetup = () => {
    // Determine the appropriate starting step based on current status
    if (!onboardingStatus.hasCompanyProfile) {
      setSetupWizardStep('company');
    } else if (!onboardingStatus.hasLocations) {
      setSetupWizardStep('locations');
    }
    setIsSetupWizardOpen(true);
  };

  const handleResumeOnboarding = () => {
    // Resume from the next incomplete step
    setSetupWizardStep(onboardingStatus.nextStep as 'company' | 'locations');
    setIsSetupWizardOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Cosynq
                </h1>
                <p className="text-sm text-gray-600">Workspace Management</p>
              </div>
              
              {/* Search Bar */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search locations, spaces..."
                    className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-600">Admin</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-white flex-shrink-0" />
              <div className="ml-3">
                <p className="text-lg font-medium text-white">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-auto text-white hover:text-green-100 transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {onboardingStatus.isCompleted ? (
          /* Main Dashboard - Setup Complete */
          <div className="space-y-8">
            {/* Top Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                    <p className="text-2xl font-bold text-gray-900">{contactStats?.totalContacts || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Locations</p>
                    <p className="text-2xl font-bold text-gray-900">{locationStats?.totalLocations || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Spaces</p>
                    <p className="text-2xl font-bold text-gray-900">{spaceStats?.totalSpaces || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{bookingStats?.totalBookings || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">₹{(Math.random() * 100000 + 50000).toFixed(0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Locations */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Your Locations</h2>
                    <p className="text-sm text-gray-600">Manage and monitor your workspace locations</p>
                  </div>
                  <Link
                    to="/locations"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Link>
                </div>

                {/* Location Cards Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {locationStatsLoading || locationsLoading ? (
                    // Loading state
                    <div className="xl:col-span-2 text-center py-12">
                      <div className="animate-spin mx-auto h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                      <p className="text-gray-600">Loading your locations...</p>
                    </div>
                  ) : locationStatsError ? (
                    // Error state
                    <div className="xl:col-span-2 text-center py-12">
                      <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <MapPin className="h-6 w-6 text-red-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading locations</h3>
                      <p className="text-gray-600 mb-4">There was a problem fetching your location data.</p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Try again
                      </button>
                    </div>
                  ) : locationsData?.locations && locationsData.locations.length > 0 ? (
                    // Has locations - show cards from actual location data
                    locationsData.locations.slice(0, 4).map((location: Location, index: number) => (
                      <DashboardLocationCard
                        key={location._id}
                        location={location}
                        spaceCount={Math.floor(Math.random() * 15) + 3}
                        setupProgress={60 + (index * 15) + Math.floor(Math.random() * 20)}
                        monthlyRevenue={Math.floor(Math.random() * 50000) + 25000}
                        totalBookings={Math.floor(Math.random() * 50) + 10}
                      />
                    ))
                  ) : (
                    // No locations state
                    <div className="xl:col-span-2 text-center py-12">
                      <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No locations yet</h3>
                      <p className="text-gray-600 mb-6">Add your first workspace location to get started</p>
                      <Link
                        to="/locations"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Your First Location
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Setup Progress & Quick Actions */}
              <div className="space-y-6">
                <SetupProgressCard
                  overallProgress={onboardingStatus.completionPercentage}
                  completedSteps={['company', 'locations']}
                  nextStep="Configure your space offerings"
                  totalLocations={locationStats?.totalLocations || 0}
                  totalSpaces={spaceStats?.totalSpaces || 0}
                  firstLocationId={locationsData?.locations?.[0]?._id || locationStats?.recentLocations?.[0]?._id}
                />

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link
                      to="/locations"
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg border border-blue-200 transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-900">Manage Locations</p>
                          <p className="text-sm text-blue-700">Configure spaces & settings</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <Link
                      to="/contacts"
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-lg border border-green-200 transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-green-900">Manage Contacts</p>
                          <p className="text-sm text-green-700">View your leads</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <Link
                      to="/analytics"
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 rounded-lg border border-orange-200 transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-orange-900">Analytics</p>
                          <p className="text-sm text-orange-700">View insights & reports</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-orange-600 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <Link
                      to="/whatsapp"
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-lg border border-green-200 transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-green-900">WhatsApp</p>
                          <p className="text-sm text-green-700">Business messaging</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Onboarding Required */
          <div className="text-center py-12">
            <IncompleteSetupBanner 
              status={onboardingStatus}
              onCompleteSetup={handleCompleteSetup}
              onResumeOnboarding={handleResumeOnboarding}
            />
          </div>
        )}
      </main>

      {/* Setup Wizard Modal */}
      <SetupWizard
        isOpen={isSetupWizardOpen}
        onClose={() => setIsSetupWizardOpen(false)}
        onComplete={handleSetupComplete}
        initialStep={setupWizardStep}
      />
    </div>
  );
};

export default DashboardPage;