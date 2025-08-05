import { useState } from 'react';
import { Contact } from '@shared/types';
import { useAddInteraction, useDeleteContact } from '../../hooks/useContacts';
import { X, Mail, Phone, Building, MapPin, Edit, Trash2, Plus } from 'lucide-react';
import { ContactForm } from './ContactForm';
import { InteractionTimeline } from './InteractionTimeline';

interface ContactDetailProps {
  contact: Contact;
  isOpen: boolean;
  onClose: () => void;
}

export function ContactDetail({ contact, isOpen, onClose }: ContactDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [interactionError, setInteractionError] = useState<string | null>(null);
  const [newInteraction, setNewInteraction] = useState<{
    type: 'call' | 'email' | 'meeting' | 'note' | 'tour' | 'ai_conversation';
    subject: string;
    content: string;
    metadata: {
      duration: number | undefined;
      outcome: string;
      nextActions: string[];
    };
  }>({
    type: 'note',
    subject: '',
    content: '',
    metadata: {
      duration: undefined,
      outcome: '',
      nextActions: [],
    },
  });

  const addInteractionMutation = useAddInteraction();
  const deleteContactMutation = useDeleteContact();

  const handleAddInteraction = async () => {
    if (!newInteraction.content.trim()) return;

    setInteractionError(null);

    try {
      console.log('🔄 Adding interaction:', newInteraction);
      console.log('🔄 Contact ID:', contact._id);
      
      // Clean up the interaction data to only send fields with values
      const cleanInteraction: any = {
        type: newInteraction.type,
        content: newInteraction.content.trim(),
      };

      // Only include subject if it has a value
      if (newInteraction.subject && newInteraction.subject.trim()) {
        cleanInteraction.subject = newInteraction.subject.trim();
      }

      // Only include metadata if it has meaningful values
      const hasMetadata = newInteraction.metadata.duration || 
                         (newInteraction.metadata.outcome && newInteraction.metadata.outcome.trim()) ||
                         (newInteraction.metadata.nextActions && newInteraction.metadata.nextActions.length > 0);
      
      if (hasMetadata) {
        cleanInteraction.metadata = {};
        if (newInteraction.metadata.duration) {
          cleanInteraction.metadata.duration = newInteraction.metadata.duration;
        }
        if (newInteraction.metadata.outcome && newInteraction.metadata.outcome.trim()) {
          cleanInteraction.metadata.outcome = newInteraction.metadata.outcome.trim();
        }
        if (newInteraction.metadata.nextActions && newInteraction.metadata.nextActions.length > 0) {
          cleanInteraction.metadata.nextActions = newInteraction.metadata.nextActions;
        }
      }

      console.log('🔄 Clean interaction data:', cleanInteraction);
      
      await addInteractionMutation.mutateAsync({
        contactId: contact._id,
        interaction: cleanInteraction,
      });
      
      console.log('✅ Interaction added successfully');
      setNewInteraction({ 
        type: 'note', 
        subject: '', 
        content: '',
        metadata: {
          duration: undefined,
          outcome: '',
          nextActions: [],
        },
      });
      setShowAddInteraction(false);
    } catch (error: any) {
      console.error('❌ Error adding interaction:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add interaction';
      setInteractionError(errorMessage);
    }
  };

  const handleDeleteContact = async () => {
    if (window.confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      try {
        await deleteContactMutation.mutateAsync(contact._id);
        onClose();
      } catch (error) {
        console.error('Error deleting contact:', error);
      }
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xl font-medium text-white">
                      {contact.firstName[0]}
                      {contact.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {contact.firstName} {contact.lastName}
                    </h2>
                    <p className="text-gray-600">{contact.jobTitle || 'No title'}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getContactTypeColor(
                          contact.type
                        )}`}
                      >
                        {contact.type}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getContextStateColor(
                          contact.contextState
                        )}`}
                      >
                        {contact.contextState}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteContact}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-3 text-gray-400" />
                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:text-blue-800">
                          {contact.email}
                        </a>
                      </div>
                      {contact.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-3 text-gray-400" />
                          <a href={`tel:${contact.phone}`} className="text-blue-600 hover:text-blue-800">
                            {contact.phone}
                          </a>
                        </div>
                      )}
                      {contact.company && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Building className="h-4 w-4 mr-3 text-gray-400" />
                          {contact.company}
                        </div>
                      )}
                      {contact.address && (
                        <div className="flex items-start text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-3 text-gray-400 mt-0.5" />
                          <div>
                            {contact.address.street && <div>{contact.address.street}</div>}
                            <div>
                              {contact.address.city && `${contact.address.city}, `}
                              {contact.address.state && `${contact.address.state} `}
                              {contact.address.zipCode}
                            </div>
                            {contact.address.country && <div>{contact.address.country}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Context */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">AI Context</h3>
                    <div className="space-y-4">
                      {contact.aiContext.preferences.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Preferences</h4>
                          <div className="flex flex-wrap gap-1">
                            {contact.aiContext.preferences.map((pref, index) => (
                              <span
                                key={index}
                                className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md"
                              >
                                {pref}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {contact.aiContext.interests.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Interests</h4>
                          <div className="flex flex-wrap gap-1">
                            {contact.aiContext.interests.map((interest, index) => (
                              <span
                                key={index}
                                className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {contact.aiContext.painPoints.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Pain Points</h4>
                          <div className="flex flex-wrap gap-1">
                            {contact.aiContext.painPoints.map((point, index) => (
                              <span
                                key={index}
                                className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-md"
                              >
                                {point}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {contact.aiContext.budget && (contact.aiContext.budget.min || contact.aiContext.budget.max) && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Budget</h4>
                          <p className="text-sm text-gray-600">
                            {contact.aiContext.budget.min && `$${contact.aiContext.budget.min}`}
                            {contact.aiContext.budget.min && contact.aiContext.budget.max && ' - '}
                            {contact.aiContext.budget.max && `$${contact.aiContext.budget.max}`}
                            {` ${contact.aiContext.budget.currency}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  {contact.tags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Interactions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Interactions</h3>
                    <button
                      onClick={() => setShowAddInteraction(true)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </button>
                  </div>

                  {/* Add Interaction Form */}
                  {showAddInteraction && (
                    <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      {interactionError && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-600">{interactionError}</p>
                        </div>
                      )}
                      <div className="space-y-3">
                        <div>
                          <select
                            value={newInteraction.type}
                            onChange={(e) => setNewInteraction({ ...newInteraction, type: e.target.value as any })}
                            className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="note">Note</option>
                            <option value="call">Call</option>
                            <option value="email">Email</option>
                            <option value="meeting">Meeting</option>
                            <option value="tour">Tour</option>
                          </select>
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Subject (optional)"
                            value={newInteraction.subject}
                            onChange={(e) => setNewInteraction({ ...newInteraction, subject: e.target.value })}
                            className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <textarea
                            placeholder="Content"
                            value={newInteraction.content}
                            onChange={(e) => setNewInteraction({ ...newInteraction, content: e.target.value })}
                            className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                            rows={3}
                          />
                        </div>
                        
                        {/* Additional fields for calls and meetings */}
                        {(newInteraction.type === 'call' || newInteraction.type === 'meeting') && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <input
                                type="number"
                                placeholder="Duration (minutes)"
                                value={newInteraction.metadata.duration || ''}
                                onChange={(e) => setNewInteraction({ 
                                  ...newInteraction, 
                                  metadata: { 
                                    ...newInteraction.metadata, 
                                    duration: e.target.value ? parseInt(e.target.value) : undefined 
                                  } 
                                })}
                                className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                placeholder="Outcome"
                                value={newInteraction.metadata.outcome}
                                onChange={(e) => setNewInteraction({ 
                                  ...newInteraction, 
                                  metadata: { 
                                    ...newInteraction.metadata, 
                                    outcome: e.target.value 
                                  } 
                                })}
                                className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setShowAddInteraction(false);
                              setInteractionError(null);
                              setNewInteraction({ 
                                type: 'note', 
                                subject: '', 
                                content: '',
                                metadata: {
                                  duration: undefined,
                                  outcome: '',
                                  nextActions: [],
                                },
                              });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddInteraction}
                            disabled={!newInteraction.content.trim()}
                            className="px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interactions Timeline */}
                  <div className="max-h-96 overflow-y-auto">
                    <InteractionTimeline interactions={contact.interactions} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Contact Modal */}
      {isEditing && (
        <ContactForm
          contact={contact}
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          onSuccess={() => setIsEditing(false)}
        />
      )}
    </>
  );
}