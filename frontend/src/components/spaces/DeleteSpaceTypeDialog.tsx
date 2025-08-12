import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { useBookings } from '../../hooks/useBookings';

interface DeleteSpaceTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  spaceTypeName: string;
  spaceCount: number;
  productTypeId?: string;
  isLoading?: boolean;
}

export const DeleteSpaceTypeDialog: React.FC<DeleteSpaceTypeDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  spaceTypeName,
  spaceCount,
  productTypeId: _productTypeId,
  isLoading = false,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [showConfirmInput, setShowConfirmInput] = useState(false);

  // Get active bookings for spaces of this product type
  const { data: bookingsData } = useBookings({
    limit: 1000,
    status: 'Confirmed',
    startDate: new Date().toISOString(), // Only future bookings
  });

  // Filter bookings for spaces that belong to this product type
  const activeBookings = bookingsData?.bookings?.filter(() => {
    // This would need to be enhanced based on your space-productType relationship
    // For now, we'll show a general warning
    return false; // Placeholder - implement actual filtering logic
  }) || [];

  const hasActiveBookings = activeBookings.length > 0;
  const requiresConfirmation = hasActiveBookings || spaceCount > 5;

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setShowConfirmInput(requiresConfirmation);
    }
  }, [isOpen, requiresConfirmation]);

  const canConfirm = !requiresConfirmation || confirmText === spaceTypeName;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Space Type</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 mb-1">
                    Are you sure you want to delete "{spaceTypeName}"?
                  </p>
                  <p className="text-sm text-red-700">
                    This will permanently delete {spaceCount} individual space{spaceCount !== 1 ? 's' : ''} 
                    and all associated data.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 mb-1">
                    Impact Assessment
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• {spaceCount} space{spaceCount !== 1 ? 's' : ''} will be permanently deleted</li>
                    <li>• All booking history for these spaces will be preserved</li>
                    <li>• Future bookings for these spaces will be cancelled</li>
                    {hasActiveBookings && (
                      <li className="text-red-700 font-medium">• {activeBookings.length} active booking{activeBookings.length !== 1 ? 's' : ''} will be affected</li>
                    )}
                    <li>• This action cannot be reversed</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* High-risk confirmation input */}
            {showConfirmInput && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="mb-3">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    {hasActiveBookings ? 'Active Bookings Detected' : 'High Impact Deletion'}
                  </p>
                  <p className="text-sm text-red-700">
                    {hasActiveBookings 
                      ? 'This space type has active bookings. Customers will be affected.'
                      : 'You are about to delete a large number of spaces.'
                    }
                  </p>
                  <p className="text-sm text-red-700 mt-2">
                    Type <span className="font-mono font-medium">"{spaceTypeName}"</span> to confirm:
                  </p>
                </div>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={spaceTypeName}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading || !canConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Space Type</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};