import { useState } from 'react';
import { useLocations, useLocationStats } from '../hooks/useLocations';
import { LocationList } from '../components/locations/LocationList';
import { LocationForm } from '../components/locations/LocationForm';
import { LocationStats } from '../components/locations/LocationStats';
import { LocationFilters } from '../components/locations/LocationFilters';
import { Plus, MapPin, AlertTriangle } from 'lucide-react';

export function LocationsPage() {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [filters, setFilters] = useState<{
    search?: string;
    isActive?: boolean;
    city?: string;
    state?: string;
    amenities?: string;
    minCapacity?: number;
    maxCapacity?: number;
  }>({});
  const [currentPage, setCurrentPage] = useState(1);

  const { data: locationsData, isLoading: isLoadingLocations, error: locationsError } = useLocations({
    page: currentPage,
    limit: 12,
    ...filters,
  });

  const { data: statsData, isLoading: isLoadingStats } = useLocationStats();

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCreateSuccess = () => {
    setIsCreateFormOpen(false);
  };

  if (locationsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <div className="text-red-500 text-lg font-medium mb-2">
            Error loading locations
          </div>
          <div className="text-gray-600">
            {locationsError.message || 'Something went wrong'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
                <p className="text-sm text-gray-600">
                  Manage your workspace locations
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsCreateFormOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8">
          <LocationStats data={statsData} isLoading={isLoadingStats} />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <LocationFilters
            filters={filters}
            onFiltersChange={handleFilterChange}
          />
        </div>

        {/* Results Summary */}
        {locationsData && !isLoadingLocations && (
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * 12) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * 12, locationsData.pagination.total)}
                </span> of{' '}
                <span className="font-medium">{locationsData.pagination.total}</span> locations
              </p>
              {Object.keys(filters).some(key => filters[key as keyof typeof filters] !== undefined && filters[key as keyof typeof filters] !== '') && (
                <button
                  onClick={() => {
                    setFilters({});
                    setCurrentPage(1);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Location List */}
        <LocationList
          data={locationsData}
          isLoading={isLoadingLocations}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />

        {/* Create Location Modal */}
        {isCreateFormOpen && (
          <LocationForm
            isOpen={isCreateFormOpen}
            onClose={() => setIsCreateFormOpen(false)}
            onSuccess={handleCreateSuccess}
          />
        )}
      </div>
    </div>
  );
}