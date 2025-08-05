import { ContactStats as ContactStatsType } from '@shared/types';
import { Users, UserPlus, Target } from 'lucide-react';

interface ContactStatsProps {
  stats: ContactStatsType;
}

export function ContactStats({ stats }: ContactStatsProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Lead':
        return <UserPlus className="h-8 w-8 text-yellow-600" />;
      case 'Member':
        return <Users className="h-8 w-8 text-green-600" />;
      case 'Prospect':
        return <Target className="h-8 w-8 text-blue-600" />;
      default:
        return <Users className="h-8 w-8 text-gray-600" />;
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'New':
        return 'text-blue-600';
      case 'Touring':
        return 'text-purple-600';
      case 'Negotiating':
        return 'text-orange-600';
      case 'Active':
        return 'text-green-600';
      case 'Inactive':
        return 'text-gray-600';
      case 'Churned':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Contacts */}
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
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalContacts}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Contacts by Type */}
      {stats.contactsByType.map((typeStats) => (
        <div key={typeStats._id} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {getTypeIcon(typeStats._id)}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {typeStats._id}s
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {typeStats.count}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Context States Overview */}
      <div className="bg-white overflow-hidden shadow rounded-lg md:col-span-2 lg:col-span-4">
        <div className="p-5">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Contact Status Distribution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.contactsByState.map((stateStats) => (
              <div key={stateStats._id} className="text-center">
                <div className={`text-2xl font-bold ${getStateColor(stateStats._id)}`}>
                  {stateStats.count}
                </div>
                <div className="text-sm text-gray-500">{stateStats._id}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="bg-white overflow-hidden shadow rounded-lg md:col-span-2 lg:col-span-2">
        <div className="p-5">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Priority Distribution
          </h3>
          <div className="space-y-3">
            {stats.contactsByPriority.map((priorityStats) => {
              const getPriorityColor = (priority: string) => {
                switch (priority) {
                  case 'high':
                    return 'text-red-600 bg-red-100';
                  case 'medium':
                    return 'text-yellow-600 bg-yellow-100';
                  case 'low':
                    return 'text-green-600 bg-green-100';
                  default:
                    return 'text-gray-600 bg-gray-100';
                }
              };

              return (
                <div key={priorityStats._id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span 
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getPriorityColor(priorityStats._id)}`}
                    >
                      {priorityStats._id}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {priorityStats.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white overflow-hidden shadow rounded-lg md:col-span-2 lg:col-span-2">
        <div className="p-5">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Interactions
          </h3>
          <div className="space-y-3">
            {stats.recentInteractions.slice(0, 5).map((interaction, index) => (
              <div key={`${interaction._id}-${index}`} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-blue-400 rounded-full mt-2"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {interaction.subject || `${interaction.type} interaction`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(interaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {stats.recentInteractions.length === 0 && (
              <p className="text-sm text-gray-500 italic">No recent interactions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}