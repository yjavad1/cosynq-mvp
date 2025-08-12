import React, { useState } from 'react';
import { X, Plus, Edit, Trash2, Users, DollarSign, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { useProductTypes, useCreateProductType, useUpdateProductType, useDeleteProductType, useGenerateSpaces } from '../../hooks/useProductTypes';
import { CreateProductTypeData } from '@shared/types';
import { SpaceTypeForm } from './SpaceTypeForm';
import { DeleteSpaceTypeDialog } from './DeleteSpaceTypeDialog';

interface SpaceManagementInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  locationName: string;
}

export const SpaceManagementInterface: React.FC<SpaceManagementInterfaceProps> = ({
  isOpen,
  onClose,
  locationId,
  locationName,
}) => {
  const [showSpaceForm, setShowSpaceForm] = useState(false);
  const [editingSpaceType, setEditingSpaceType] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingSpaceType, setDeletingSpaceType] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get existing space types for this location
  const { data: productTypesData, isLoading, error } = useProductTypes({
    locationId,
    limit: 50,
  });

  // Debug API call
  console.log("📡 useProductTypes result:", { 
    data: productTypesData, 
    isLoading, 
    error,
    locationId 
  });

  const createProductType = useCreateProductType();
  const updateProductType = useUpdateProductType();
  const deleteProductType = useDeleteProductType();
  const generateSpaces = useGenerateSpaces();

  const spaceTypes = productTypesData?.productTypes || [];

  // Debug component props and state
  console.log("🔍 SpaceManagementInterface - Props received:", {
    isOpen,
    locationId,
    locationName,
    spaceTypesCount: spaceTypes.length
  });

  // Handle adding new space type
  const handleAddNew = () => {
    setEditingSpaceType(null);
    setShowSpaceForm(true);
  };

  // Handle editing space type
  const handleEdit = (spaceType: any) => {
    setEditingSpaceType(spaceType);
    setShowSpaceForm(true);
  };

  // Handle delete initiation
  const handleDelete = (spaceType: any) => {
    setDeletingSpaceType(spaceType);
    setShowDeleteConfirm(true);
  };

  // Handle space type save (create or update)
  const handleSpaceTypeSave = async (formData: CreateProductTypeData) => {
    try {
      if (editingSpaceType) {
        // Update existing space type
        await updateProductType.mutateAsync({
          id: editingSpaceType._id,
          productTypeData: formData
        });
        setSuccessMessage('Space type updated successfully!');
      } else {
        // Create new space type
        await createProductType.mutateAsync(formData);
        setSuccessMessage('Space type created successfully!');
      }
      setShowSpaceForm(false);
      setEditingSpaceType(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving space type:', error);
      setSuccessMessage('Error saving space type. Please try again.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Handle space type form close
  const handleSpaceFormClose = () => {
    setShowSpaceForm(false);
    setEditingSpaceType(null);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingSpaceType) return;
    
    try {
      await deleteProductType.mutateAsync(deletingSpaceType._id);
      setShowDeleteConfirm(false);
      setDeletingSpaceType(null);
      setSuccessMessage(`${deletingSpaceType.name} deleted successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error deleting space type:', error);
      // Error is handled by the delete dialog
    }
  };

  // Handle delete cancellation
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeletingSpaceType(null);
  };

  // Generate additional spaces for a space type
  const handleGenerateSpaces = async (spaceType: any, additionalCount: number) => {
    try {
      await generateSpaces.mutateAsync({
        productTypeId: spaceType._id,
        count: additionalCount,
      });
      setSuccessMessage(`Generated ${additionalCount} additional ${spaceType.name} spaces!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error generating spaces:', error);
    }
  };

  if (!isOpen) {
    console.log("❌ SpaceManagementInterface - Not rendering because isOpen is false:", isOpen);
    return null;
  }
  
  console.log("✅ SpaceManagementInterface - Rendering modal interface");
  console.log("🔍 Component state:", { 
    isOpen, 
    locationId, 
    locationName,
    spaceTypesCount: spaceTypes.length,
    isLoading,
    showSpaceForm,
    showDeleteConfirm 
  });

  return (
    <>
      {/* Debug Overlay */}
      <div 
        style={{
          position: 'fixed',
          top: '50px',
          right: '10px',
          background: 'green',
          color: 'white',
          padding: '10px',
          zIndex: 10001,
          borderRadius: '5px'
        }}
      >
        🟢 SpaceManagementInterface IS RENDERING!
      </div>
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Settings className="h-6 w-6 mr-3 text-blue-600" />
                Manage Space Types
              </h2>
              <p className="text-sm text-gray-600 mt-1">{locationName} • Configure your workspace offerings</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <span className="text-green-800">{successMessage}</span>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-red-600 mb-4">⚠️ Error loading space types</div>
                  <div className="text-sm text-gray-600">{error.toString()}</div>
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="ml-3 text-gray-600">Loading space types...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Add New Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Current Space Types</h3>
                    <p className="text-sm text-gray-600">
                      {spaceTypes.length} space type{spaceTypes.length !== 1 ? 's' : ''} configured
                    </p>
                  </div>
                  <button
                    onClick={handleAddNew}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Space Type
                  </button>
                </div>

                {/* Space Types Table */}
                {spaceTypes.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Space Types Yet</h3>
                    <p className="text-gray-600 mb-6">Get started by adding your first space type</p>
                    <button
                      onClick={handleAddNew}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Your First Space Type
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Space Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Capacity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Spaces
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {spaceTypes.map((spaceType: any) => (
                            <tr key={spaceType._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{spaceType.name}</div>
                                  <div className="text-sm text-gray-500">{spaceType.description}</div>
                                  <div className="text-xs text-blue-600 mt-1">Code: {spaceType.code}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {spaceType.category.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-900">
                                  <Users className="h-4 w-4 mr-1 text-gray-400" />
                                  {spaceType.capacity?.optimalCapacity || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-900">
                                  <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                                  ₹{spaceType.pricing?.basePrice || 0}/hr
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  <span className="font-medium">{spaceType.generatedSpacesCount || 0}</span>
                                  <div className="text-xs text-gray-500 mt-1">
                                    <button
                                      onClick={() => handleGenerateSpaces(spaceType, 1)}
                                      className="text-blue-600 hover:text-blue-800 mr-2"
                                      disabled={generateSpaces.isPending}
                                    >
                                      +1 more
                                    </button>
                                    <button
                                      onClick={() => handleGenerateSpaces(spaceType, 5)}
                                      className="text-blue-600 hover:text-blue-800"
                                      disabled={generateSpaces.isPending}
                                    >
                                      +5 more
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  spaceType.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {spaceType.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => handleEdit(spaceType)}
                                    className="inline-flex items-center px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(spaceType)}
                                    className="inline-flex items-center px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Summary Stats */}
                {spaceTypes.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {spaceTypes.length}
                      </div>
                      <div className="text-sm text-blue-700">Space Types</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {spaceTypes.reduce((total: number, st: any) => total + (st.generatedSpacesCount || 0), 0)}
                      </div>
                      <div className="text-sm text-green-700">Total Spaces</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        ₹{spaceTypes.reduce((total: number, st: any) => total + (st.pricing?.basePrice || 0), 0)}
                      </div>
                      <div className="text-sm text-purple-700">Total Hourly Revenue</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center text-sm text-gray-600">
              <AlertCircle className="h-4 w-4 mr-2" />
              Changes to space types affect booking availability
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Space Type Form Modal */}
      <SpaceTypeForm
        isOpen={showSpaceForm}
        onClose={handleSpaceFormClose}
        onSave={handleSpaceTypeSave}
        editingProductType={editingSpaceType}
        locationId={locationId}
        isLoading={createProductType.isPending || updateProductType.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteSpaceTypeDialog
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        spaceTypeName={deletingSpaceType?.name || ''}
        spaceCount={deletingSpaceType?.generatedSpacesCount || 0}
        productTypeId={deletingSpaceType?._id}
        isLoading={deleteProductType.isPending}
      />
    </>
  );
};