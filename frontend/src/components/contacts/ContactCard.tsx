import { Contact } from '@shared/types';
import { Mail, Phone, Building } from 'lucide-react';

interface ContactCardProps {
  contact: Contact;
  onClick: () => void;
}

export function ContactCard({ contact, onClick }: ContactCardProps) {
  const getContactTypeColor = (type: string) => {
    switch (type) {
      case 'Lead':
        return 'bg-yellow-100 text-yellow-800';
      case 'Member':
        return 'bg-green-100 text-green-800';
      case 'Prospect':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getContextStateColor = (state: string) => {
    switch (state) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'Touring':
        return 'bg-purple-100 text-purple-800';
      case 'Negotiating':
        return 'bg-orange-100 text-orange-800';
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      case 'Churned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {contact.firstName[0]}
              {contact.lastName[0]}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {contact.firstName} {contact.lastName}
            </h3>
            <p className="text-sm text-gray-500">{contact.jobTitle || 'No title'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getContactTypeColor(
              contact.type
            )}`}
          >
            {contact.type}
          </span>
          <span className={`text-xs font-medium capitalize ${getPriorityColor(contact.priority)}`}>
            {contact.priority} priority
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="h-4 w-4 mr-2 text-gray-400" />
          {contact.email}
        </div>
        {contact.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2 text-gray-400" />
            {contact.phone}
          </div>
        )}
        {contact.company && (
          <div className="flex items-center text-sm text-gray-600">
            <Building className="h-4 w-4 mr-2 text-gray-400" />
            {contact.company}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getContextStateColor(
            contact.contextState
          )}`}
        >
          {contact.contextState}
        </span>
        <div className="text-xs text-gray-500">
          Updated {new Date(contact.updatedAt).toLocaleDateString()}
        </div>
      </div>

      {contact.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {contact.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md"
            >
              {tag}
            </span>
          ))}
          {contact.tags.length > 3 && (
            <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-200 text-gray-600 rounded-md">
              +{contact.tags.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}