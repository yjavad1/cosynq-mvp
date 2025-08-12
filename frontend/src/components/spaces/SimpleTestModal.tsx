import React from 'react';
import { X } from 'lucide-react';

interface SimpleTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimpleTestModal: React.FC<SimpleTestModalProps> = ({ isOpen, onClose }) => {
  console.log("🧪 SimpleTestModal - Props:", { isOpen });
  
  if (!isOpen) {
    console.log("❌ SimpleTestModal - Not rendering (isOpen is false)");
    return null;
  }

  console.log("✅ SimpleTestModal - Rendering modal");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">🧪 Simple Test Modal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            ✅ This modal is rendering successfully!
          </p>
          <p className="text-sm text-gray-600">
            If you can see this, then modal rendering is working correctly.
            The issue might be with the SpaceManagementInterface component itself.
          </p>
          
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close Modal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};