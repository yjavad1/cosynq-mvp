import { useState } from 'react';
import { useContacts, useContactStats } from '../hooks/useContacts';
import { ContactList } from '../components/contacts/ContactList';
import { ContactForm } from '../components/contacts/ContactForm';
import { ContactStats } from '../components/contacts/ContactStats';
import { ContactFilters } from '../components/contacts/ContactFilters';
import { Plus, Users } from 'lucide-react';
import { ContactType, ContextState } from '@shared/types';

export function ContactsPage() {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [filters, setFilters] = useState<{
    search?: string;
    type?: ContactType;
    contextState?: ContextState;
    priority?: string;
    tags?: string;
  }>({});
  const [currentPage, setCurrentPage] = useState(1);

  const { data: contactsData, isLoading: isLoadingContacts, error: contactsError } = useContacts({
    page: currentPage,
    limit: 20,
    ...filters,
  });

  const { data: statsData, isLoading: isLoadingStats } = useContactStats();

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (contactsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">
            Error loading contacts
          </div>
          <div className="text-gray-600">
            {contactsError.message || 'Something went wrong'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
              <p className="text-gray-600">Manage your leads, members, and prospects</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateFormOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Contact
          </button>
        </div>

        {/* Stats Section */}
        {!isLoadingStats && statsData && (
          <div className="mb-8">
            <ContactStats stats={statsData} />
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <ContactFilters
            filters={filters}
            onFiltersChange={handleFilterChange}
          />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow">
          {isLoadingContacts ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : contactsData ? (
            <ContactList
              contacts={contactsData.contacts}
              pagination={contactsData.pagination}
              onPageChange={handlePageChange}
            />
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first contact.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIsCreateFormOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Contact
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Contact Modal */}
      {isCreateFormOpen && (
        <ContactForm
          isOpen={isCreateFormOpen}
          onClose={() => setIsCreateFormOpen(false)}
          onSuccess={() => {
            setIsCreateFormOpen(false);
          }}
        />
      )}
    </div>
  );
}