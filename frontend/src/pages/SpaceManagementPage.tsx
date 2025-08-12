import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Users, DollarSign, Settings, CheckCircle } from 'lucide-react';
import { useLocation as useLocationById } from '../hooks/useLocations';
import { useProductTypes, useDeleteProductType, useGenerateSpaces } from '../hooks/useProductTypes';
import { SpaceTypeForm } from '../components/spaces/SpaceTypeForm';
import { DeleteSpaceTypeDialog } from '../components/spaces/DeleteSpaceTypeDialog';

export default function SpaceManagementPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const { data: location, isLoading: locationLoading } = useLocationById(locationId!);
  
  const [showSpaceForm, setShowSpaceForm] = useState(false);
  const [editingSpaceType, setEditingSpaceType] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingSpaceType, setDeletingSpaceType] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get existing space types for this location
  const { data: productTypesData, isLoading } = useProductTypes({
    locationId: locationId!,
    limit: 50,
  });

  const deleteProductType = useDeleteProductType();
  const generateSpaces = useGenerateSpaces();

  const spaceTypes = productTypesData?.productTypes || [];

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
  const handleSpaceTypeSave = () => {
    setShowSpaceForm(false);
    setEditingSpaceType(null);
    setSuccessMessage(editingSpaceType ? 'Space type updated successfully!' : 'Space type created successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
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

  if (locationLoading || !location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link
                to={`/locations/${locationId}/spaces`}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Space Overview
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Settings className="h-6 w-6 mr-3 text-blue-600" />
                  Manage Space Types
                </h1>
                <p className="text-sm text-gray-600">
                  {location.name} • Configure your workspace offerings
                </p>
              </div>
            </div>
            
            <button
              onClick={handleAddNew}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Space Type
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="ml-3 text-gray-600">Loading space types...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Current Space Types</h2>
              <p className="text-sm text-gray-600">
                {spaceTypes.length} space type{spaceTypes.length !== 1 ? 's' : ''} configured
              </p>
            </div>

            {/* Space Types Table */}
            {spaceTypes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Space Type Form Modal */}
      {showSpaceForm && (
        <SpaceTypeForm
          isOpen={showSpaceForm}
          onClose={handleSpaceFormClose}
          onSave={handleSpaceTypeSave}
          editingProductType={editingSpaceType}
          locationId={locationId!}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <DeleteSpaceTypeDialog
          isOpen={showDeleteConfirm}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          spaceTypeName={deletingSpaceType?.name || ''}
          spaceCount={deletingSpaceType?.generatedSpacesCount || 0}
          productTypeId={deletingSpaceType?._id}
          isLoading={deleteProductType.isPending}
        />
      )}
    </div>
  );
}