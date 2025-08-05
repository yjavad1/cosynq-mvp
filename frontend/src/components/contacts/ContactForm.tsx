import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateContact, useUpdateContact } from '../../hooks/useContacts';
import { CreateContactData, Contact, ContactType } from '@shared/types';
import { X, Plus, Trash2 } from 'lucide-react';

interface ContactFormProps {
  contact?: Contact;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ContactForm({ contact, isOpen, onClose, onSuccess }: ContactFormProps) {
  const isEditing = !!contact;
  const [tags, setTags] = useState<string[]>(contact?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [preferences, setPreferences] = useState<string[]>(contact?.aiContext?.preferences || []);
  const [interests, setInterests] = useState<string[]>(contact?.aiContext?.interests || []);
  const [painPoints, setPainPoints] = useState<string[]>(contact?.aiContext?.painPoints || []);

  const createContactMutation = useCreateContact();
  const updateContactMutation = useUpdateContact();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateContactData>({
    defaultValues: contact
      ? {
          type: contact.type,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone || '',
          company: contact.company || '',
          jobTitle: contact.jobTitle || '',
          address: {
            street: contact.address?.street || '',
            city: contact.address?.city || '',
            state: contact.address?.state || '',
            zipCode: contact.address?.zipCode || '',
            country: contact.address?.country || 'US',
          },
          leadSource: contact.leadSource || '',
          priority: contact.priority,
          aiContext: {
            budget: {
              min: contact.aiContext?.budget?.min || 0,
              max: contact.aiContext?.budget?.max || 0,
              currency: contact.aiContext?.budget?.currency || 'USD',
            },
          },
        }
      : {
          type: 'Lead' as ContactType,
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          jobTitle: '',
          priority: 'medium',
          leadSource: '',
          address: { 
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'US' 
          },
          aiContext: { 
            budget: { 
              currency: 'USD' 
            } 
          },
        },
  });

  const onSubmit = async (data: CreateContactData) => {
    try {
      // Clean up empty fields
      const cleanData = {
        ...data,
        phone: data.phone?.trim() || undefined,
        company: data.company?.trim() || undefined,
        jobTitle: data.jobTitle?.trim() || undefined,
        leadSource: data.leadSource?.trim() || undefined,
        assignedTo: data.assignedTo?.trim() || undefined,
        address: data.address && Object.values(data.address).some(v => v?.trim()) ? {
          street: data.address.street?.trim() || undefined,
          city: data.address.city?.trim() || undefined,
          state: data.address.state?.trim() || undefined,
          zipCode: data.address.zipCode?.trim() || undefined,
          country: data.address.country?.trim() || undefined
        } : undefined,
        aiContext: {
          preferences,
          interests,
          painPoints,
          budget: data.aiContext?.budget && (data.aiContext.budget.min || data.aiContext.budget.max) ? {
            min: data.aiContext.budget.min || undefined,
            max: data.aiContext.budget.max || undefined,
            currency: data.aiContext.budget.currency || 'USD'
          } : { currency: 'USD' },
          spaceRequirements: []
        }
      };

      const submitData = {
        ...cleanData,
        tags,
      };

      if (isEditing && contact) {
        await updateContactMutation.mutateAsync({
          id: contact._id,
          data: submitData,
        });
      } else {
        await createContactMutation.mutateAsync(submitData);
      }

      reset();
      setTags([]);
      setPreferences([]);
      setInterests([]);
      setPainPoints([]);
      onSuccess();
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const addArrayItem = (
    array: string[],
    setter: (items: string[]) => void,
    value: string
  ) => {
    if (value.trim() && !array.includes(value.trim())) {
      setter([...array, value.trim()]);
    }
  };

  const removeArrayItem = (
    array: string[],
    setter: (items: string[]) => void,
    item: string
  ) => {
    setter(array.filter((i) => i !== item));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {isEditing ? 'Edit Contact' : 'Add New Contact'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Basic Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      {...register('type', { required: 'Type is required' })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="Lead">Lead</option>
                      <option value="Member">Member</option>
                      <option value="Prospect">Prospect</option>
                    </select>
                    {errors.type && (
                      <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        {...register('firstName', { required: 'First name is required' })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        {...register('lastName', { required: 'Last name is required' })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      {...register('email', { required: 'Email is required' })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        {...register('phone')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <select
                        {...register('priority')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company</label>
                      <input
                        type="text"
                        {...register('company')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Job Title</label>
                      <input
                        type="text"
                        {...register('jobTitle')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lead Source</label>
                    <input
                      type="text"
                      {...register('leadSource')}
                      placeholder="e.g., Website, Referral, Cold Call"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Context & Additional Info */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">AI Context & Preferences</h4>
                  
                  {/* Budget */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        {...register('aiContext.budget.min')}
                        placeholder="Min"
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        {...register('aiContext.budget.max')}
                        placeholder="Max"
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <select
                        {...register('aiContext.budget.currency')}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferences</label>
                    <ArrayInput
                      items={preferences}
                      onAdd={(value) => addArrayItem(preferences, setPreferences, value)}
                      onRemove={(item) => removeArrayItem(preferences, setPreferences, item)}
                      placeholder="Add preference"
                    />
                  </div>

                  {/* Interests */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
                    <ArrayInput
                      items={interests}
                      onAdd={(value) => addArrayItem(interests, setInterests, value)}
                      onRemove={(item) => removeArrayItem(interests, setInterests, item)}
                      placeholder="Add interest"
                    />
                  </div>

                  {/* Pain Points */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pain Points</label>
                    <ArrayInput
                      items={painPoints}
                      onAdd={(value) => addArrayItem(painPoints, setPainPoints, value)}
                      onRemove={(item) => removeArrayItem(painPoints, setPainPoints, item)}
                      placeholder="Add pain point"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Address</h5>
                    <div className="space-y-2">
                      <input
                        type="text"
                        {...register('address.street')}
                        placeholder="Street"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          {...register('address.city')}
                          placeholder="City"
                          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          {...register('address.state')}
                          placeholder="State"
                          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          {...register('address.zipCode')}
                          placeholder="ZIP Code"
                          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          {...register('address.country')}
                          placeholder="Country"
                          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Contact' : 'Create Contact'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Helper component for managing arrays
interface ArrayInputProps {
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (item: string) => void;
  placeholder: string;
}

function ArrayInput({ items, onAdd, onRemove, placeholder }: ArrayInputProps) {
  const [value, setValue] = useState('');

  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-2 mb-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-1">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-2 py-1 bg-gray-100 rounded-md"
          >
            <span className="text-sm text-gray-700">{item}</span>
            <button
              type="button"
              onClick={() => onRemove(item)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}