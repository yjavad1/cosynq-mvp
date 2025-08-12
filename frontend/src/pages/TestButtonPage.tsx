import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TestButtonPage() {
  const navigate = useNavigate();

  const handleModifySpaces = () => {
    console.log("🔥 TEST BUTTON CLICKED - Navigating to space management");
    alert("🚨 BUTTON CLICKED! Navigating to space management page...");
    navigate('/locations/test-location/spaces/manage');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <h1 className="text-2xl font-bold mb-8">Button Functionality Test</h1>
      
      <div className="mb-4 text-sm">
        Testing page-based navigation approach - no modal complexity!
      </div>
      
      <button
        onClick={handleModifySpaces}
        type="button"
        className="inline-flex items-center px-6 py-3 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
      >
        <Settings className="h-4 w-4 mr-2" />
        Test Navigation to Space Management
      </button>

      <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border">
        <h2 className="font-semibold mb-2">✅ Simple Page-Based Approach</h2>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• No modal state management issues</li>
          <li>• No rendering complexity</li>
          <li>• Standard page navigation</li>
          <li>• Reliable and debuggable</li>
          <li>• Dedicated URL: /locations/:id/spaces/manage</li>
        </ul>
      </div>
    </div>
  );
}