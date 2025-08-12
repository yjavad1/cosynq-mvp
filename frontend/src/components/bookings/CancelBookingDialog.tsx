import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle, X } from 'lucide-react';
import { BookingData } from '../../services/bookingApi';

interface CancelBookingDialogProps {
  booking: BookingData | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (booking: BookingData, reason: string) => void;
  isLoading?: boolean;
}

export function CancelBookingDialog({
  booking,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}: CancelBookingDialogProps) {
  const [cancelReason, setCancelReason] = useState('');

  if (!booking) return null;

  const handleConfirm = () => {
    onConfirm(booking, cancelReason || 'Cancelled by user');
    setCancelReason(''); // Reset for next time
  };

  const handleClose = () => {
    setCancelReason('');
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-medium text-gray-900">
                        Cancel Booking
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
                        {booking.bookingReference}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    onClick={handleClose}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-sm text-gray-900 mb-2">
                      Are you sure you want to cancel this booking?
                    </p>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Customer:</span>
                        <span className="ml-2 text-gray-900">
                          {(booking.contactId && typeof booking.contactId === 'object') ? 
                            `${booking.contactId.firstName} ${booking.contactId.lastName}` : 
                            booking.customerName
                          }
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Space:</span>
                        <span className="ml-2 text-gray-900">
                          {(booking.spaceId && typeof booking.spaceId === 'object' && booking.spaceId.name) || 'Unknown Space'}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Date:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(booking.startTime).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Time:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(booking.startTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })} - {new Date(booking.endTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700 mb-2">
                      Cancellation Reason (Optional)
                    </label>
                    <textarea
                      id="cancelReason"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      placeholder="Enter reason for cancellation..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>Warning:</strong> This action cannot be undone. The customer will be notified of the cancellation.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleClose}
                    disabled={isLoading}
                  >
                    Keep Booking
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleConfirm}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default CancelBookingDialog;