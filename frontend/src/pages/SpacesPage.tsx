import { useState, useMemo } from 'react';
import { useSpaces, useDeleteSpace, useCleanupOrphanedSpaces } from '../hooks/useSpaces';
import { Space } from '@shared/types';
import { SpaceCard } from '../components/spaces/SpaceCard';
import { SpaceForm } from '../components/spaces/SpaceForm';
import { Plus, Search, Filter, Grid, List, Trash2, AlertTriangle } from 'lucide-react';

export function SpacesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | undefined>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error } = useSpaces({
    page: currentPage,
    limit: 20,
    search: search || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    isActive: isActiveFilter,
  });

  // *** DEBUGGING: Log space data for consistency analysis ***
  console.log("=== SPACES PAGE DEBUG ===");
  console.log("Spaces Data:", data);
  console.log("Spaces Count:", data?.spaces?.length || 0);
  console.log("Spaces List:", data?.spaces?.map((s: Space) => ({
    id: s._id,
    name: s.name,
    type: s.type,
    locationId: s.locationId,
    isActive: s.isActive
  })));
  console.log("Current Filters:", {
    search,
    typeFilter,
    statusFilter,
    isActiveFilter
  });

  const deleteSpaceMutation = useDeleteSpace();
  const cleanupOrphanedSpaces = useCleanupOrphanedSpaces();

  // Data consistency analysis
  const dataConsistencyAnalysis = useMemo(() => {
    if (!data?.spaces) return null;
    
    const analysis = {
      totalSpaces: data.spaces.length,
      activeSpaces: data.spaces.filter((s: Space) => s.isActive).length,
      inactiveSpaces: data.spaces.filter((s: Space) => !s.isActive).length,
      spacesWithoutLocation: data.spaces.filter((s: Space) => !s.locationId).length,
      uniqueLocations: new Set(data.spaces.map((s: Space) => s.locationId).filter(Boolean)).size,
      spaceTypes: [...new Set(data.spaces.map((s: Space) => s.type))],
    };
    
    return analysis;
  }, [data?.spaces]);

  const handleCreateSpace = () => {
    setSelectedSpace(undefined);
    setShowForm(true);
  };

  const handleEditSpace = (space: Space) => {
    setSelectedSpace(space);
    setShowForm(true);
  };

  const handleViewSpace = (space: Space) => {
    // TODO: Implement space detail view
    console.log('View space:', space);
  };

  const handleDeleteSpace = async (space: Space) => {
    if (window.confirm(`Are you sure you want to delete "${space.name}"? This action cannot be undone.`)) {
      try {
        await deleteSpaceMutation.mutateAsync(space._id);
      } catch (error) {
        console.error('Error deleting space:', error);
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedSpace(undefined);
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setIsActiveFilter(undefined);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading spaces...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading spaces. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const spaces = data?.spaces || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Spaces</h1>
            <p className="text-gray-600 mt-1">
              Manage your workspace inventory and availability
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => cleanupOrphanedSpaces.mutate()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              disabled={cleanupOrphanedSpaces.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {cleanupOrphanedSpaces.isPending ? 'Cleaning...' : 'Cleanup Data'}
            </button>
            <button
              onClick={handleCreateSpace}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Space
            </button>
          </div>
        </div>

        {/* Data Consistency Panel */}
        {dataConsistencyAnalysis && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                Data Consistency Analysis
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{dataConsistencyAnalysis.totalSpaces}</div>
                <div className="text-sm text-gray-600">Total Spaces</div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{dataConsistencyAnalysis.activeSpaces}</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{dataConsistencyAnalysis.inactiveSpaces}</div>
                <div className="text-sm text-gray-600">Inactive</div>
              </div>
              
              <div className={`p-3 rounded-lg ${dataConsistencyAnalysis.spacesWithoutLocation > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <div className={`text-2xl font-bold ${dataConsistencyAnalysis.spacesWithoutLocation > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {dataConsistencyAnalysis.spacesWithoutLocation}
                </div>
                <div className="text-sm text-gray-600">Orphaned</div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{dataConsistencyAnalysis.uniqueLocations}</div>
                <div className="text-sm text-gray-600">Locations</div>
              </div>
              
              <div className="bg-indigo-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{dataConsistencyAnalysis.spaceTypes.length}</div>
                <div className="text-sm text-gray-600">Types</div>
              </div>
            </div>
            
            {dataConsistencyAnalysis.spacesWithoutLocation > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-700">
                  <strong>Warning:</strong> {dataConsistencyAnalysis.spacesWithoutLocation} spaces without location assignments detected. 
                  These will not appear in booking forms. Consider cleaning up this data.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Search spaces..."
              />
            </div>

            {/* View Mode and Filter Toggle */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Space Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
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
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Out of Service">Out of Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Active Status
                  </label>
                  <select
                    value={isActiveFilter === undefined ? '' : isActiveFilter.toString()}
                    onChange={(e) => setIsActiveFilter(e.target.value === '' ? undefined : e.target.value === 'true')}
                    className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {pagination && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Grid className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Spaces</p>
                  <p className="text-2xl font-semibold text-gray-900">{pagination.totalSpaces}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-600 rounded-full" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Available</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {spaces.filter((s: Space) => s.status === 'Available' && s.isActive).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-red-600 rounded-full" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Occupied</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {spaces.filter((s: Space) => s.status === 'Occupied').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Spaces List */}
        {spaces.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Grid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No spaces found</h3>
            <p className="text-gray-600 mb-6">
              {search || typeFilter || statusFilter ? 
                'Try adjusting your search or filters to find spaces.' :
                'Get started by creating your first space.'
              }
            </p>
            {!search && !typeFilter && !statusFilter && (
              <button
                onClick={handleCreateSpace}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Space
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 
            'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 
            'space-y-4'
          }>
            {spaces.map((space: Space) => (
              <SpaceCard
                key={space._id}
                space={space}
                onView={handleViewSpace}
                onEdit={handleEditSpace}
                onDelete={handleDeleteSpace}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                disabled={!pagination.hasPrevPage}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={!pagination.hasNextPage}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Space Form Modal */}
      <SpaceForm
        space={selectedSpace}
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}