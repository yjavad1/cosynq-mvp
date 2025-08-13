import { useState, useEffect } from 'react';
import { Space, CreateSpaceData, SpaceType, SpaceStatus, WorkingHours } from '@shared/types';
import { useCreateSpace, useUpdateSpace } from '../../hooks/useSpaces';
import { X, Plus, Trash2 } from 'lucide-react';

interface SpaceFormProps {
  space?: Space;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const defaultWorkingHours: WorkingHours[] = [
  { day: 'monday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
  { day: 'tuesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
  { day: 'wednesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
  { day: 'thursday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
  { day: 'friday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
  { day: 'saturday', isOpen: false, openTime: '09:00', closeTime: '17:00' },
  { day: 'sunday', isOpen: false, openTime: '09:00', closeTime: '17:00' }
];

export function SpaceForm({ space, isOpen, onClose, onSuccess }: SpaceFormProps) {
  const [formData, setFormData] = useState<CreateSpaceData>({
    name: '',
    description: '',
    type: 'Hot Desk',
    status: 'Available',
    capacity: 1,
    area: undefined,
    floor: '',
    room: '',
    rates: {
      hourly: undefined,
      daily: undefined,
      weekly: undefined,
      monthly: undefined,
      currency: 'USD'
    },
    amenities: [],
    equipment: [],
    workingHours: defaultWorkingHours,
    isActive: true,
    minimumBookingDuration: 60,
    maximumBookingDuration: 480,
    advanceBookingLimit: 30,
    allowSameDayBooking: true,
    images: []
  });

  const [newAmenity, setNewAmenity] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createSpaceMutation = useCreateSpace();
  const updateSpaceMutation = useUpdateSpace();

  useEffect(() => {
    if (space) {
      setFormData({
        name: space.name,
        description: space.description || '',
        type: space.type,
        status: space.status,
        capacity: space.capacity,
        area: space.area,
        floor: space.floor || '',
        room: space.room || '',
        rates: space.rates,
        amenities: space.amenities,
        equipment: space.equipment,
        workingHours: space.workingHours,
        isActive: space.isActive,
        minimumBookingDuration: space.minimumBookingDuration,
        maximumBookingDuration: space.maximumBookingDuration,
        advanceBookingLimit: space.advanceBookingLimit,
        allowSameDayBooking: space.allowSameDayBooking,
        images: space.images || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'Hot Desk',
        status: 'Available',
        capacity: 1,
        area: undefined,
        floor: '',
        room: '',
        rates: {
          hourly: undefined,
          daily: undefined,
          weekly: undefined,
          monthly: undefined,
          currency: 'USD'
        },
        amenities: [],
        equipment: [],
        workingHours: defaultWorkingHours,
        isActive: true,
        minimumBookingDuration: 60,
        maximumBookingDuration: 480,
        advanceBookingLimit: 30,
        allowSameDayBooking: true,
        images: []
      });
    }
    setErrors({});
  }, [space, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Space name is required';
    }

    if (formData.capacity !== null && formData.capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    }

    // Check that at least one rate is provided
    const hasRate = formData.rates.hourly || formData.rates.daily || formData.rates.weekly || formData.rates.monthly;
    if (!hasRate) {
      newErrors.rates = 'At least one rate must be provided';
    }

    // Validate working hours
    const openDays = formData.workingHours.filter(wh => wh.isOpen);
    for (const workingHour of openDays) {
      if (!workingHour.openTime || !workingHour.closeTime) {
        newErrors.workingHours = 'Open and close times are required for open days';
        break;
      }
      if (workingHour.openTime >= workingHour.closeTime) {
        newErrors.workingHours = 'Open time must be before close time';
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (space) {
        await updateSpaceMutation.mutateAsync({
          id: space._id,
          data: formData
        });
      } else {
        await createSpaceMutation.mutateAsync(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !(formData.amenities || []).includes(newAmenity.trim())) {
      setFormData({
        ...formData,
        amenities: [...(formData.amenities || []), newAmenity.trim()]
      });
      setNewAmenity('');
    }
  };

  const removeAmenity = (index: number) => {
    setFormData({
      ...formData,
      amenities: (formData.amenities || []).filter((_, i) => i !== index)
    });
  };

  const addEquipment = () => {
    if (newEquipment.trim() && !(formData.equipment || []).includes(newEquipment.trim())) {
      setFormData({
        ...formData,
        equipment: [...(formData.equipment || []), newEquipment.trim()]
      });
      setNewEquipment('');
    }
  };

  const removeEquipment = (index: number) => {
    setFormData({
      ...formData,
      equipment: (formData.equipment || []).filter((_, i) => i !== index)
    });
  };

  const updateWorkingHours = (dayIndex: number, field: keyof WorkingHours, value: any) => {
    const updatedHours = [...formData.workingHours];
    updatedHours[dayIndex] = { ...updatedHours[dayIndex], [field]: value };
    setFormData({ ...formData, workingHours: updatedHours });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
            <form onSubmit={handleSubmit}>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {space ? 'Edit Space' : 'Create New Space'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {space ? 'Update space details and configuration' : 'Add a new space to your organization'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Space Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g. Conference Room A"
                      />
                      {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                        rows={3}
                        placeholder="Brief description of the space..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type *
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as SpaceType })}
                          className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="Hot Desk">Hot Desk</option>
                          <option value="Meeting Room">Meeting Room</option>
                          <option value="Private Office">Private Office</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as SpaceStatus })}
                          className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Occupied">Occupied</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Out of Service">Out of Service</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Capacity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.capacity || ''}
                          onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : null })}
                          className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.capacity && <p className="text-red-600 text-xs mt-1">{errors.capacity}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Floor
                        </label>
                        <input
                          type="text"
                          value={formData.floor}
                          onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                          className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="e.g. 2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Room
                        </label>
                        <input
                          type="text"
                          value={formData.room}
                          onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                          className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="e.g. 201"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Area (sq ft)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.area || ''}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g. 150"
                      />
                    </div>
                  </div>

                  {/* Rates and Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Rates & Configuration</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pricing (at least one required) *
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.rates.hourly || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              rates: { ...formData.rates, hourly: e.target.value ? parseFloat(e.target.value) : undefined }
                            })}
                            className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Hourly rate"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.rates.daily || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              rates: { ...formData.rates, daily: e.target.value ? parseFloat(e.target.value) : undefined }
                            })}
                            className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Daily rate"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.rates.weekly || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              rates: { ...formData.rates, weekly: e.target.value ? parseFloat(e.target.value) : undefined }
                            })}
                            className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Weekly rate"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.rates.monthly || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              rates: { ...formData.rates, monthly: e.target.value ? parseFloat(e.target.value) : undefined }
                            })}
                            className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Monthly rate"
                          />
                        </div>
                      </div>
                      {errors.rates && <p className="text-red-600 text-xs mt-1">{errors.rates}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Min Booking (minutes)
                        </label>
                        <input
                          type="number"
                          min="15"
                          value={formData.minimumBookingDuration}
                          onChange={(e) => setFormData({ ...formData, minimumBookingDuration: parseInt(e.target.value) })}
                          className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Booking (minutes)
                        </label>
                        <input
                          type="number"
                          min="15"
                          max="1440"
                          value={formData.maximumBookingDuration}
                          onChange={(e) => setFormData({ ...formData, maximumBookingDuration: parseInt(e.target.value) })}
                          className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Advance Booking (days)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="365"
                          value={formData.advanceBookingLimit}
                          onChange={(e) => setFormData({ ...formData, advanceBookingLimit: parseInt(e.target.value) })}
                          className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex items-center space-x-4 pt-6">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.allowSameDayBooking}
                            onChange={(e) => setFormData({ ...formData, allowSameDayBooking: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Same-day booking</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Active</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Working Hours</h3>
                  <div className="space-y-3">
                    {formData.workingHours.map((wh, index) => (
                      <div key={wh.day} className="flex items-center space-x-4">
                        <div className="w-20">
                          <span className="text-sm font-medium text-gray-700 capitalize">{wh.day}</span>
                        </div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={wh.isOpen}
                            onChange={(e) => updateWorkingHours(index, 'isOpen', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Open</span>
                        </label>
                        {wh.isOpen && (
                          <>
                            <input
                              type="time"
                              value={wh.openTime}
                              onChange={(e) => updateWorkingHours(index, 'openTime', e.target.value)}
                              className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-500">to</span>
                            <input
                              type="time"
                              value={wh.closeTime}
                              onChange={(e) => updateWorkingHours(index, 'closeTime', e.target.value)}
                              className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                          </>
                        )}
                      </div>
                    ))}
                    {errors.workingHours && <p className="text-red-600 text-xs mt-1">{errors.workingHours}</p>}
                  </div>
                </div>

                {/* Amenities and Equipment */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Amenities */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Amenities</h3>
                    <div className="flex space-x-2 mb-3">
                      <input
                        type="text"
                        value={newAmenity}
                        onChange={(e) => setNewAmenity(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                        className="flex-1 rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Add amenity..."
                      />
                      <button
                        type="button"
                        onClick={addAmenity}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {(formData.amenities || []).map((amenity, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                          <span className="text-sm text-gray-700">{amenity}</span>
                          <button
                            type="button"
                            onClick={() => removeAmenity(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Equipment */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Equipment</h3>
                    <div className="flex space-x-2 mb-3">
                      <input
                        type="text"
                        value={newEquipment}
                        onChange={(e) => setNewEquipment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
                        className="flex-1 rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Add equipment..."
                      />
                      <button
                        type="button"
                        onClick={addEquipment}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {(formData.equipment || []).map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                          <span className="text-sm text-gray-700">{item}</span>
                          <button
                            type="button"
                            onClick={() => removeEquipment(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  disabled={createSpaceMutation.isPending || updateSpaceMutation.isPending}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {createSpaceMutation.isPending || updateSpaceMutation.isPending
                    ? 'Saving...'
                    : space
                    ? 'Update Space'
                    : 'Create Space'}
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
    </>
  );
}