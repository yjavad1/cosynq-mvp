import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, 
  List, 
  Plus,
  // Grid,
  // Filter,
  // Search
} from 'lucide-react';
import { ErrorBoundary } from '../common/ErrorBoundary';
// import { NewBookingForm } from './NewBookingForm';
import BookingForm from './BookingForm';
import { BookingList } from './BookingList';
import { BookingCalendar } from './BookingCalendar';

type ViewType = 'list' | 'calendar';

interface BookingData {
  _id: string;
  spaceName: string;
  spaceType: string;
  contactName?: string;
  customerName?: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  status: 'confirmed' | 'pending' | 'cancelled';
}

function BookingPageCore() {
  const { locationId } = useParams<{ locationId: string }>();
  const [view, setView] = useState<ViewType>('list');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [prefilledSpaceId, setPrefilledSpaceId] = useState<string>('');

  const handleCreateBooking = useCallback((date?: Date, spaceId?: string) => {
    if (date) {
      setSelectedDate(date);
    }
    if (spaceId) {
      setPrefilledSpaceId(spaceId);
    }
    setShowCreateForm(true);
  }, []);

  const handleCloseCreateForm = useCallback(() => {
    setShowCreateForm(false);
    setSelectedDate(null);
    setPrefilledSpaceId('');
  }, []);

  const handleBookingSuccess = useCallback(() => {
    setShowCreateForm(false);
    setSelectedDate(null);
    setPrefilledSpaceId('');
  }, []);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleBookingClick = useCallback((booking: BookingData) => {
    console.log('Booking clicked:', booking);
  }, []);

  const handleEditBooking = useCallback((booking: BookingData) => {
    console.log('Edit booking:', booking);
  }, []);

  if (!locationId) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-600">Location ID is required to view bookings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
            <p className="text-sm text-gray-600">
              Manage space reservations and schedules
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex rounded-lg border border-gray-300 bg-white p-1">
              <button
                onClick={() => setView('list')}
                className={`
                  inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${view === 'list' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <List className="w-4 h-4" />
                <span>List</span>
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`
                  inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${view === 'calendar' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <Calendar className="w-4 h-4" />
                <span>Calendar</span>
              </button>
            </div>

            <button
              onClick={() => handleCreateBooking()}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Booking</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6">
        {view === 'list' ? (
          <BookingList
            locationId={locationId}
            onEditBooking={handleEditBooking}
            className="bg-white"
          />
        ) : (
          <BookingCalendar
            locationId={locationId}
            onDateSelect={handleDateSelect}
            onBookingClick={handleBookingClick}
            onCreateBooking={handleCreateBooking}
            className=""
          />
        )}
      </div>

      {showCreateForm && (
        <BookingForm
          locationId={locationId}
          isOpen={showCreateForm}
          onClose={handleCloseCreateForm}
          onSuccess={handleBookingSuccess}
          prefilledDate={selectedDate || undefined}
          prefilledSpaceId={prefilledSpaceId || undefined}
        />
      )}
    </div>
  );
}

export function BookingPage() {
  return (
    <ErrorBoundary>
      <BookingPageCore />
    </ErrorBoundary>
  );
}

export default BookingPage;