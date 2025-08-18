import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  CalendarIcon, 
  UsersIcon, 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { getApiUrl, logApiConfig } from '../utils/apiConfig';

interface AnalyticsData {
  overview: {
    totalBookings: number;
    totalRevenue: number;
    averageUtilization: number;
    activeContacts: number;
    averageBookingValue: number;
    totalSpaces: number;
  };
  trends: {
    bookingsByMonth: Array<{ date: string; bookings: number; revenue: number }>;
    spaceUtilization: Array<{ 
      spaceName: string; 
      spaceType: string; 
      bookings: number; 
      totalHours: number;
      totalRevenue: number;
      utilizationScore: number;
    }>;
    popularTimeSlots: Array<{ hour: number; bookings: number; averageRevenue: number }>;
    revenueByMonth: Array<{ month: string; revenue: number; bookings: number; averageValue: number }>;
  };
  contacts: {
    newContacts: number;
    contactsByType: Array<{ _id: string; count: number }>;
    conversionRate: number;
  };
  whatsapp: {
    totalMessages: number;
    totalConversations: number;
    messagesByDirection: Array<{ _id: string; count: number }>;
  };
  timeRange: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');

  // Fetch analytics data
  useEffect(() => {
    // Log API configuration for debugging
    logApiConfig();
    
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('📊 Fetching analytics data for timeRange:', timeRange);
        
        const apiUrl = getApiUrl(`analytics?timeRange=${timeRange}`);
        console.log('📊 API URL:', apiUrl);
        
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📊 Analytics data received:', data);

        if (data.success) {
          setAnalytics(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch analytics');
        }
      } catch (error: any) {
        console.error('❌ Error fetching analytics:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Analytics Loading Error
            </h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data</h3>
          <p className="mt-1 text-sm text-gray-500">Analytics data will appear here once you have bookings and contacts.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link 
              to="/dashboard"
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600">Track your coworking space performance and growth</p>
              </div>
            </div>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex space-x-2">
            {[
              { value: '7d', label: '7 Days' },
              { value: '30d', label: '30 Days' },
              { value: '90d', label: '90 Days' },
              { value: '1y', label: '1 Year' }
            ].map(range => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  timeRange === range.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.overview.totalBookings.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.overview.totalRevenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Utilization</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.overview.averageUtilization}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Contacts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.overview.activeContacts}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Booking Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.overview.averageBookingValue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ChatBubbleLeftIcon className="h-8 w-8 text-pink-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">WhatsApp Chats</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.whatsapp.totalConversations}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Space Utilization */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Space Performance
            </h3>
            <div className="space-y-4">
              {analytics.trends.spaceUtilization.slice(0, 5).map((space, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {space.spaceName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {space.bookings} bookings
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(space.utilizationScore, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(space.totalRevenue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {space.totalHours}h total
                    </p>
                 </div>
               </div>
             ))}
           </div>
         </div>

         {/* Popular Time Slots */}
         <div className="bg-white p-6 rounded-lg shadow">
           <h3 className="text-lg font-semibold text-gray-900 mb-4">
             Popular Time Slots
           </h3>
           <div className="space-y-3">
             {analytics.trends.popularTimeSlots.slice(0, 8).map((slot, idx) => (
               <div key={idx} className="flex items-center justify-between">
                 <div className="flex items-center">
                   <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                   <span className="text-sm font-medium text-gray-900">
                     {slot.hour}:00 - {slot.hour + 1}:00
                   </span>
                 </div>
                 <div className="flex items-center space-x-4">
                   <span className="text-sm text-gray-600">
                     {slot.bookings} bookings
                   </span>
                   <span className="text-sm font-medium text-green-600">
                     {formatCurrency(slot.averageRevenue)}/avg
                   </span>
                 </div>
               </div>
             ))}
           </div>
         </div>
       </div>

       {/* Revenue and Contact Analytics */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Revenue Trends */}
         <div className="bg-white p-6 rounded-lg shadow">
           <h3 className="text-lg font-semibold text-gray-900 mb-4">
             Revenue Trends
           </h3>
           <div className="space-y-3">
             {analytics.trends.revenueByMonth.slice(-6).map((month, idx) => (
               <div key={idx} className="flex items-center justify-between">
                 <span className="text-sm font-medium text-gray-900">
                   {new Date(`${month.month}-01`).toLocaleDateString('en-US', { 
                     year: 'numeric', 
                     month: 'short' 
                   })}
                 </span>
                 <div className="flex items-center space-x-4">
                   <span className="text-sm text-gray-600">
                     {month.bookings} bookings
                   </span>
                   <span className="text-sm font-bold text-green-600">
                     {formatCurrency(month.revenue)}
                   </span>
                 </div>
               </div>
             ))}
           </div>
         </div>

         {/* Contact Analytics */}
         <div className="bg-white p-6 rounded-lg shadow">
           <h3 className="text-lg font-semibold text-gray-900 mb-4">
             Contact Insights
           </h3>
           <div className="space-y-4">
             <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
               <span className="text-sm font-medium text-blue-900">New Contacts</span>
               <span className="text-lg font-bold text-blue-600">
                 {analytics.contacts.newContacts}
               </span>
             </div>
             
             <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
               <span className="text-sm font-medium text-green-900">Conversion Rate</span>
               <span className="text-lg font-bold text-green-600">
                 {analytics.contacts.conversionRate}%
               </span>
             </div>

             <div className="space-y-2">
               <h4 className="text-sm font-medium text-gray-700">Contact Types</h4>
               {analytics.contacts.contactsByType.map((type, idx) => (
                 <div key={idx} className="flex items-center justify-between">
                   <span className="text-sm text-gray-600 capitalize">
                     {type._id}s
                   </span>
                   <span className="text-sm font-medium text-gray-900">
                     {type.count}
                   </span>
                 </div>
               ))}
             </div>
           </div>
         </div>
       </div>

       {/* WhatsApp Analytics */}
       {analytics.whatsapp.totalMessages > 0 && (
         <div className="mt-8 bg-white p-6 rounded-lg shadow">
           <h3 className="text-lg font-semibold text-gray-900 mb-4">
             WhatsApp Performance
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="text-center">
               <p className="text-3xl font-bold text-green-600">
                 {analytics.whatsapp.totalMessages}
               </p>
               <p className="text-sm text-gray-500">Total Messages</p>
             </div>
             <div className="text-center">
               <p className="text-3xl font-bold text-blue-600">
                 {analytics.whatsapp.totalConversations}
               </p>
               <p className="text-sm text-gray-500">Active Conversations</p>
             </div>
             <div className="text-center">
               <div className="space-y-1">
                 {analytics.whatsapp.messagesByDirection.map((dir, idx) => (
                   <div key={idx} className="flex justify-between text-sm">
                     <span className="text-gray-600 capitalize">{dir._id}:</span>
                     <span className="font-medium">{dir.count}</span>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Data Summary */}
       <div className="mt-8 bg-gray-100 p-6 rounded-lg">
         <h3 className="text-lg font-semibold text-gray-900 mb-4">
           Analytics Summary ({timeRange})
         </h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
           <div>
             <span className="text-gray-600">Period:</span>
             <p className="font-medium">
               {new Date(analytics.dateRange?.start || '').toLocaleDateString()} - 
               {new Date(analytics.dateRange?.end || '').toLocaleDateString()}
             </p>
           </div>
           <div>
             <span className="text-gray-600">Total Spaces:</span>
             <p className="font-medium">{analytics.overview.totalSpaces} spaces</p>
           </div>
           <div>
             <span className="text-gray-600">Avg per Booking:</span>
             <p className="font-medium">{formatCurrency(analytics.overview.averageBookingValue)}</p>
           </div>
           <div>
             <span className="text-gray-600">Utilization:</span>
             <p className="font-medium">{analytics.overview.averageUtilization}% capacity</p>
           </div>
         </div>
       </div>
     </div>
   </div>
 );
}

