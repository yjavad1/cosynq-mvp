import React, { useState, useEffect } from 'react';
import { X, Save, Users } from 'lucide-react';
import { CreateProductTypeData, ProductTypeCategory } from '@shared/types';

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
];

export const SpaceTypeForm: React.FC<SpaceTypeFormProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProductType,
  locationId,
  isLoading = false,
}) => {
  // Simple form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductTypeCategory>('Hot_Desk');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState(1);
  const [basePrice, setBasePrice] = useState(15);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or editing product changes
  useEffect(() => {
    if (isOpen) {
      if (editingProductType) {
        // console.log('🔄 SIMPLE FORM: Populating edit data');
        setName(editingProductType.name || '');
        setCategory(editingProductType.category || 'Hot_Desk');
        setCode(editingProductType.code || '');
        setDescription(editingProductType.description || '');
        setCapacity(editingProductType.capacity?.optimalCapacity || 1);
        setBasePrice(editingProductType.pricing?.basePrice || 15);
      } else {
        // console.log('🔄 SIMPLE FORM: Resetting for new space type');
        setName('');
        setCategory('Hot_Desk');
        setCode('');
        setDescription('');
        setCapacity(1);
        setBasePrice(15);
      }
    }
    setErrors({});
  }, [isOpen, editingProductType]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Space type name is required';
    }

    if (!code.trim()) {
      newErrors.code = 'Space type code is required';
    }

    if (capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    }

    if (basePrice < 0) {
      newErrors.basePrice = 'Base price cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    // alert('🚀 SIMPLE FORM: Submit button clicked!');
    // console.log('🚀 SIMPLE FORM: Submit button clicked');
    e.preventDefault();

    // console.log('📝 SIMPLE FORM: Form data:', {
    //   name,
    //   category,
    //   code,
    //   description,
    //   capacity,
    //   basePrice
    // });

    if (validateForm()) {
      // console.log('✅ SIMPLE FORM: Validation passed, creating data object');
      
      const formData: CreateProductTypeData = {
        locationId,
        name,
        category,
        code,
        description,
        capacity: {
          minCapacity: capacity,
          maxCapacity: capacity,
          optimalCapacity: capacity,
          wheelchairAccessible: true,
        },
        pricing: {
          type: 'hourly',
          basePrice,
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
            prefix: code.substring(0, 2).toUpperCase(),
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
      };

      // alert('🎯 SIMPLE FORM: Calling onSave!');
      // console.log('🎯 SIMPLE FORM: Calling onSave with data:', JSON.stringify(formData, null, 2));
      onSave(formData);
    } else {
      // console.log('❌ SIMPLE FORM: Validation failed:', errors);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingProductType ? 'Edit Space Type' : 'Create New Space Type'}
            </h3>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Space Type Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Meeting Room"
              disabled={isLoading}
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code *
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              placeholder="e.g., MR001"
              disabled={isLoading}
            />
            {errors.code && <p className="text-sm text-red-600 mt-1">{errors.code}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductTypeCategory)}
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

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Available Units *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
              <input
                type="number"
                min="1"
                max="50"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 5"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-blue-600 mt-1">Number of units available for booking</p>
            {errors.capacity && <p className="text-sm text-red-600 mt-1">{errors.capacity}</p>}
          </div>

          {/* Base Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Price (₹/hour) *
            </label>
            <input
              type="number"
              min="0"
              step="5"
              value={basePrice}
              onChange={(e) => setBasePrice(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            {errors.basePrice && <p className="text-sm text-red-600 mt-1">{errors.basePrice}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe this space type..."
              disabled={isLoading}
            />
          </div>

          {/* Buttons */}
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