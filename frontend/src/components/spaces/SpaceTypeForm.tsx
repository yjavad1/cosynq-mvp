import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Users } from 'lucide-react';
import { ProductTypeCategory, CreateProductTypeData } from '@shared/types';

interface SpaceTypeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateProductTypeData) => void;
  editingProductType?: any;
  locationId: string;
  isLoading?: boolean;
}

const CATEGORY_OPTIONS: Array<{ value: ProductTypeCategory; label: string }> = [
  { value: 'Hot_Desk', label: 'Hot Desk' },
  { value: 'Dedicated_Desk', label: 'Dedicated Desk' },
  { value: 'Manager_Cabin', label: 'Manager Cabin' },
  { value: 'Team_Cabin', label: 'Team Cabin' },
  { value: 'Private_Office', label: 'Private Office' },
  { value: 'Meeting_Room', label: 'Meeting Room' },
  { value: 'Conference_Room', label: 'Conference Room' },
  { value: 'Phone_Booth', label: 'Phone Booth' },
  { value: 'Event_Space', label: 'Event Space' },
  { value: 'Training_Room', label: 'Training Room' },
  { value: 'Interview_Room', label: 'Interview Room' },
  { value: 'Focus_Pod', label: 'Focus Pod' },
  { value: 'Lounge_Area', label: 'Lounge Area' },
  { value: 'Virtual_Office', label: 'Virtual Office' },
];

export const SpaceTypeForm: React.FC<SpaceTypeFormProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProductType,
  locationId,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateProductTypeData>({
    locationId,
    name: '',
    category: 'Hot_Desk',
    code: '',
    description: '',
    capacity: {
      minCapacity: 1,
      maxCapacity: 1,
      optimalCapacity: 1,
      wheelchairAccessible: true,
    },
    pricing: {
      type: 'hourly',
      basePrice: 15,
      currency: 'INR',
      minimumDuration: 60,
      maximumDuration: 480,
      advanceBookingRequired: 0,
    },
    amenities: {
      included: ['WiFi', 'AC'],
      optional: [],
      required: ['WiFi'],
    },
    features: [],
    isActive: true,
    autoGeneration: {
      enabled: true,
      naming: {
        prefix: 'HD',
        startNumber: 1,
        digits: 3,
      },
      distribution: {
        byFloor: false,
      },
    },
    accessLevel: 'members_only',
    displayOrder: 0,
    isHighlight: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or editing product changes
  useEffect(() => {
    if (isOpen) {
      if (editingProductType) {
        // Populate form with existing product type data
        setFormData({
          locationId,
          name: editingProductType.name || '',
          category: editingProductType.category || 'Hot_Desk',
          code: editingProductType.code || '',
          description: editingProductType.description || '',
          capacity: {
            minCapacity: editingProductType.capacity?.minCapacity || 1,
            maxCapacity: editingProductType.capacity?.maxCapacity || 1,
            optimalCapacity: editingProductType.capacity?.optimalCapacity || 1,
            wheelchairAccessible: editingProductType.capacity?.wheelchairAccessible ?? true,
          },
          pricing: {
            type: editingProductType.pricing?.type || 'hourly',
            basePrice: editingProductType.pricing?.basePrice || 15,
            currency: editingProductType.pricing?.currency || 'INR',
            minimumDuration: editingProductType.pricing?.minimumDuration || 60,
            maximumDuration: editingProductType.pricing?.maximumDuration || 480,
            advanceBookingRequired: editingProductType.pricing?.advanceBookingRequired || 0,
          },
          amenities: {
            included: editingProductType.amenities?.included || ['WiFi', 'AC'],
            optional: editingProductType.amenities?.optional || [],
            required: editingProductType.amenities?.required || ['WiFi'],
          },
          features: editingProductType.features || [],
          isActive: editingProductType.isActive ?? true,
          autoGeneration: {
            enabled: editingProductType.autoGeneration?.enabled ?? true,
            naming: {
              prefix: editingProductType.autoGeneration?.naming?.prefix || 'HD',
              startNumber: editingProductType.autoGeneration?.naming?.startNumber || 1,
              digits: editingProductType.autoGeneration?.naming?.digits || 3,
            },
            distribution: {
              byFloor: editingProductType.autoGeneration?.distribution?.byFloor || false,
            },
          },
          accessLevel: editingProductType.accessLevel || 'members_only',
          displayOrder: editingProductType.displayOrder || 0,
          isHighlight: editingProductType.isHighlight || false,
        });
      }
    }
    setErrors({});
  }, [isOpen, editingProductType, locationId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Space type name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Space type code is required';
    }

    if (formData.capacity.optimalCapacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    }

    if ((formData.pricing.basePrice || 0) < 0) {
      newErrors.pricing = 'Base price cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const updateCapacity = (field: keyof typeof formData.capacity, value: number | boolean) => {
    setFormData(prev => ({
      ...prev,
      capacity: {
        ...prev.capacity,
        [field]: value,
      },
    }));
  };

  const updatePricing = (field: keyof typeof formData.pricing, value: number | string) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [field]: value,
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProductType ? 'Edit Space Type' : 'Create New Space Type'}
              </h3>
              <p className="text-sm text-gray-600">
                {editingProductType ? 'Update space type configuration' : 'Configure a new space offering'}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Basic Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Space Type Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Hot Desk, Meeting Room"
                  disabled={isLoading}
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  placeholder="e.g., HD001"
                  disabled={isLoading}
                />
                {errors.code && <p className="text-sm text-red-600 mt-1">{errors.code}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ProductTypeCategory }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              >
                {CATEGORY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe this space type..."
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Capacity Configuration */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Capacity Configuration</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Capacity
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity.minCapacity}
                    onChange={(e) => updateCapacity('minCapacity', parseInt(e.target.value) || 1)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Capacity
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity.maxCapacity}
                    onChange={(e) => updateCapacity('maxCapacity', parseInt(e.target.value) || 1)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Optimal Capacity *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity.optimalCapacity}
                    onChange={(e) => updateCapacity('optimalCapacity', parseInt(e.target.value) || 1)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
                {errors.capacity && <p className="text-sm text-red-600 mt-1">{errors.capacity}</p>}
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="wheelchairAccessible"
                checked={formData.capacity.wheelchairAccessible}
                onChange={(e) => updateCapacity('wheelchairAccessible', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="wheelchairAccessible" className="ml-2 text-sm text-gray-700">
                Wheelchair accessible
              </label>
            </div>
          </div>

          {/* Pricing Configuration */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Pricing Configuration</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price (₹/hour) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={formData.pricing.basePrice}
                    onChange={(e) => updatePricing('basePrice', parseInt(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
                {errors.pricing && <p className="text-sm text-red-600 mt-1">{errors.pricing}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Duration (minutes)
                </label>
                <input
                  type="number"
                  min="30"
                  step="30"
                  value={formData.pricing.minimumDuration}
                  onChange={(e) => updatePricing('minimumDuration', parseInt(e.target.value) || 60)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Duration (minutes)
                </label>
                <input
                  type="number"
                  min="60"
                  step="60"
                  value={formData.pricing.maximumDuration}
                  onChange={(e) => updatePricing('maximumDuration', parseInt(e.target.value) || 480)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advance Booking (hours)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.pricing.advanceBookingRequired}
                  onChange={(e) => updatePricing('advanceBookingRequired', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{editingProductType ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{editingProductType ? 'Update Space Type' : 'Create Space Type'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};