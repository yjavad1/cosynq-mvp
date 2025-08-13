import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Mail, 
  Phone, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  User
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { BookingData, BookingStatus, PaymentStatus } from '../../services/bookingApi';

interface BookingDetailsModalProps {
  booking: BookingData | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (booking: BookingData) => void;
  onCancel: (booking: BookingData) => void;
  isLoading?: boolean;
}

const getStatusColor = (status: BookingStatus) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Confirmed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Completed':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'No Show':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPaymentStatusColor = (status: PaymentStatus) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Refunded':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Failed':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
  onEdit,
  onCancel,
  isLoading = false
}: BookingDetailsModalProps) {
  if (!booking) return null;

  const canEdit = booking.status === 'Pending' || booking.status === 'Confirmed';
  const canCancel = booking.status === 'Pending' || booking.status === 'Confirmed';

  const handleEdit = () => {
    onEdit(booking);
  };

  const handleCancel = () => {
    onCancel(booking);
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: format(date, 'EEEE, MMMM do, yyyy'),
      time: formatInTimeZone(date, 'Asia/Kolkata', 'h:mm a')
    };
  };

  const startDateTime = formatDateTime(booking.startTime);
  const endDateTime = formatDateTime(booking.endTime);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-6 w-6 text-blue-600" />
                    <div>
                      <Dialog.Title className="text-lg font-medium text-gray-900">
                        Booking Details
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
                        Reference: {booking.bookingReference}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={onClose}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                      {booking.status === 'Confirmed' && <CheckCircle className="w-4 h-4 mr-1" />}
                      {booking.status === 'Pending' && <Clock className="w-4 h-4 mr-1" />}
                      {(booking.status === 'Cancelled' || booking.status === 'No Show') && <AlertCircle className="w-4 h-4 mr-1" />}
                      {booking.status}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPaymentStatusColor(booking.paymentStatus)}`}>
                      <DollarSign className="w-4 h-4 mr-1" />
                      Payment: {booking.paymentStatus}
                    </span>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Customer Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-600 w-24">Name:</span>
                        <span className="text-sm text-gray-900">
                          {(booking.contactId && typeof booking.contactId === 'object') ? 
                            `${booking.contactId.firstName} ${booking.contactId.lastName}` : 
                            booking.customerName
                          }
                        </span>
                      </div>
                      {((booking.contactId && typeof booking.contactId === 'object' && booking.contactId.email) || booking.customerEmail) && (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-gray-600 w-24">Email:</span>
                          <span className="text-sm text-gray-900">
                            {(booking.contactId && typeof booking.contactId === 'object' && booking.contactId.email) || booking.customerEmail}
                          </span>
                        </div>
                      )}
                      {((booking.contactId && typeof booking.contactId === 'object' && booking.contactId.phone) || booking.customerPhone) && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-gray-600 w-24">Phone:</span>
                          <span className="text-sm text-gray-900">
                            {(booking.contactId && typeof booking.contactId === 'object' && booking.contactId.phone) || booking.customerPhone}
                          </span>
                        </div>
                      )}
                      {(booking.contactId && typeof booking.contactId === 'object' && booking.contactId.company) && (
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-600 w-24">Company:</span>
                          <span className="text-sm text-gray-900">{booking.contactId.company}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date & Time */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-900 flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Date & Time
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Date:</span>
                          <span className="text-sm text-gray-900 ml-2">{startDateTime.date}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Start:</span>
                          <span className="text-sm text-gray-900 ml-2">{startDateTime.time}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">End:</span>
                          <span className="text-sm text-gray-900 ml-2">{endDateTime.time}</span>
                        </div>
                      </div>
                    </div>

                    {/* Space & Capacity */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-900 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Space Details
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Space:</span>
                          <span className="text-sm text-gray-900 ml-2">
                            {(booking.spaceId && typeof booking.spaceId === 'object' && booking.spaceId.name) || 'Unknown Space'}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Type:</span>
                          <span className="text-sm text-gray-900 ml-2">
                            {(booking.spaceId && typeof booking.spaceId === 'object' && booking.spaceId.type) || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-gray-600">Attendees:</span>
                          <span className="text-sm text-gray-900 ml-2">
                            {booking.attendeeCount} people
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Purpose & Notes */}
                  {(booking.purpose || booking.specialRequests || booking.notes) && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-900">Additional Information</h3>
                      {booking.purpose && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Purpose:</span>
                          <span className="text-sm text-gray-900 ml-2">{booking.purpose}</span>
                        </div>
                      )}
                      {booking.specialRequests && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Special Requests:</span>
                          <span className="text-sm text-gray-900 ml-2">{booking.specialRequests}</span>
                        </div>
                      )}
                      {booking.notes && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Notes:</span>
                          <span className="text-sm text-gray-900 ml-2">{booking.notes}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment Information */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Payment Information
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">
                        {booking.currency} {booking.totalAmount.toLocaleString()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                        {booking.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Check-in Information */}
                  {booking.checkedIn && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Check-in Information
                      </h3>
                      <div className="space-y-1">
                        {booking.checkInTime && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">Checked in:</span>
                            <span className="text-sm text-gray-900 ml-2">
                              {formatInTimeZone(parseISO(booking.checkInTime), 'Asia/Kolkata', 'MMM do, yyyy at h:mm a')}
                            </span>
                          </div>
                        )}
                        {booking.checkOutTime && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">Checked out:</span>
                            <span className="text-sm text-gray-900 ml-2">
                              {formatInTimeZone(parseISO(booking.checkOutTime), 'Asia/Kolkata', 'MMM do, yyyy at h:mm a')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
                  </button>
                  
                  {canCancel && (
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancel Booking
                    </button>
                  )}
                  
                  {canEdit && (
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleEdit}
                      disabled={isLoading}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Booking
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default BookingDetailsModal;