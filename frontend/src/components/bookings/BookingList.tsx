import { useState, useCallback, useMemo } from 'react';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Mail, 
  Phone, 
  Building2,
  Trash2,
  Edit3,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface Booking {
  _id: string;
  spaceId: string;
  spaceName: string;
  spaceType: string;
  locationId: string;
  locationName: string;
  contactId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  purpose?: string;
  specialRequests?: string;
  notes?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  totalAmount: number;
  currency: string;
  createdAt: string;
}

interface BookingListProps {
  locationId: string;
  onEditBooking?: (booking: Booking) => void;
  className?: string;
}

const fetchBookings = async (locationId: string): Promise<Booking[]> => {
  const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api';
  const response = await fetch(`${apiUrl}/bookings?locationId=${locationId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('cosynq_token')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bookings: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data?.bookings || [];
};

const deleteBooking = async (bookingId: string): Promise<void> => {
  const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api';
  const response = await fetch(`${apiUrl}/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('cosynq_token')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete booking');
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM dd, yyyy');
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, 'h:mm a');
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'confirmed':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'pending':
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    case 'cancelled':
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

function BookingListCore({ locationId, onEditBooking, className = '' }: BookingListProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  const {
    data: bookings = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['bookings', locationId],
    queryFn: () => fetchBookings(locationId),
    enabled: !!locationId,
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const deleteBookingMutation = useMutation({
    mutationFn: deleteBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['stable-time-slots'] });
    }
  });

  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.spaceName.toLowerCase().includes(search) ||
        booking.spaceType.toLowerCase().includes(search) ||
        booking.contactName?.toLowerCase().includes(search) ||
        booking.customerName?.toLowerCase().includes(search) ||
        booking.contactEmail?.toLowerCase().includes(search) ||
        booking.customerEmail?.toLowerCase().includes(search) ||
        booking.purpose?.toLowerCase().includes(search)
      );
    }

    return filtered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [bookings, searchTerm, statusFilter]);

  const handleDeleteBooking = useCallback((bookingId: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      deleteBookingMutation.mutate(bookingId);
    }
  }, [deleteBookingMutation]);

  const handleEditBooking = useCallback((booking: Booking) => {
    if (onEditBooking) {
      onEditBooking(booking);
    }
  }, [onEditBooking]);

  const toggleBookingExpansion = useCallback((bookingId: string) => {
    setExpandedBooking(prev => prev === bookingId ? null : bookingId);
  }, []);

  if (isLoading) {
    return (
      <div className={`p-6 bg-white rounded-lg border border-gray-200 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading bookings...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`p-6 bg-red-50 rounded-lg border border-red-200 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="text-sm font-medium">Error loading bookings</p>
              <p className="text-xs">{(error as Error)?.message}</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1 text-sm text-red-700 hover:bg-red-100 rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-900 mb-2">No bookings found</p>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first booking to get started'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {booking.spaceName}
                      </h3>
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="capitalize">{booking.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(booking.startTime)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>{booking.attendeeCount} attendee{booking.attendeeCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{booking.spaceType}</span>
                      </div>
                      {(booking.contactName || booking.customerName) && (
                        <div className="flex items-center space-x-1">
                          <Mail className="w-4 h-4" />
                          <span>{booking.contactName || booking.customerName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleBookingExpansion(booking._id)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandedBooking === booking._id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Contact Information</h5>
                        <div className="space-y-1 text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4" />
                            <span>{booking.contactEmail || booking.customerEmail}</span>
                          </div>
                          {(booking.contactPhone || booking.customerPhone) && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4" />
                              <span>{booking.contactPhone || booking.customerPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Booking Details</h5>
                        <div className="space-y-1 text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4" />
                            <span>{booking.locationName}</span>
                          </div>
                          {booking.purpose && (
                            <div>
                              <span className="text-gray-500">Purpose:</span> {booking.purpose}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {(booking.specialRequests || booking.notes) && (
                      <div className="space-y-2">
                        {booking.specialRequests && (
                          <div>
                            <span className="text-sm font-medium text-gray-900">Special Requests:</span>
                            <p className="text-sm text-gray-600 mt-1">{booking.specialRequests}</p>
                          </div>
                        )}
                        {booking.notes && (
                          <div>
                            <span className="text-sm font-medium text-gray-900">Internal Notes:</span>
                            <p className="text-sm text-gray-600 mt-1">{booking.notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        Created {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center space-x-2">
                        {onEditBooking && (
                          <button
                            onClick={() => handleEditBooking(booking)}
                            className="inline-flex items-center space-x-1 px-3 py-1 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteBooking(booking._id)}
                          disabled={deleteBookingMutation.isPending}
                          className="inline-flex items-center space-x-1 px-3 py-1 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>{deleteBookingMutation.isPending ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BookingList(props: BookingListProps) {
  return (
    <ErrorBoundary>
      <BookingListCore {...props} />
    </ErrorBoundary>
  );
}

export default BookingList;