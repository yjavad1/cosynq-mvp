import { ContactInteraction } from '@shared/types';
import { MessageSquare, Phone, Mail, Calendar, MapPin, User, Clock } from 'lucide-react';

interface InteractionTimelineProps {
  interactions: ContactInteraction[];
}

export function InteractionTimeline({ interactions }: InteractionTimelineProps) {
  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'tour':
        return <MapPin className="h-4 w-4" />;
      case 'ai_conversation':
        return <User className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getInteractionColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'email':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'meeting':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'tour':
        return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'ai_conversation':
        return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const interactionDate = new Date(date);
    const diffInMs = now.getTime() - interactionDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `Today at ${interactionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return interactionDate.toLocaleDateString();
    }
  };

  const sortedInteractions = [...interactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sortedInteractions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-sm">No interactions yet</p>
        <p className="text-xs text-gray-400 mt-1">Start by adding a note or logging a call</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {sortedInteractions.map((interaction, index) => (
          <li key={interaction._id}>
            <div className="relative pb-8">
              {index !== sortedInteractions.length - 1 && (
                <span
                  className="absolute top-8 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex items-start space-x-3">
                <div className={`relative px-2 py-2 rounded-full border ${getInteractionColor(interaction.type)}`}>
                  {getInteractionIcon(interaction.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {interaction.type.replace('_', ' ')}
                      </span>
                      {interaction.subject && (
                        <span className="text-sm text-gray-600">- {interaction.subject}</span>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(interaction.createdAt)}
                    </div>
                  </div>
                  <div className="mt-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {interaction.content}
                    </p>
                    {interaction.metadata && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        {interaction.metadata.duration && (
                          <div className="text-xs text-gray-500 mb-1">
                            Duration: {interaction.metadata.duration} minutes
                          </div>
                        )}
                        {interaction.metadata.outcome && (
                          <div className="text-xs text-gray-600 mb-1">
                            <span className="font-medium">Outcome:</span> {interaction.metadata.outcome}
                          </div>
                        )}
                        {interaction.metadata.nextActions && interaction.metadata.nextActions.length > 0 && (
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Next Actions:</span>
                            <ul className="list-disc list-inside ml-2 mt-1">
                              {interaction.metadata.nextActions.map((action, actionIndex) => (
                                <li key={actionIndex}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {interaction.createdBy && (
                    <div className="mt-2 text-xs text-gray-500">
                      By {interaction.createdBy.firstName} {interaction.createdBy.lastName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}