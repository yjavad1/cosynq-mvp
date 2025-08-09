import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../components/navigation/Breadcrumb';
import { 
  ArrowLeft, 
  Save, 
  Sparkles, 
  Users, 
  MapPin, 
  DollarSign,
  Calendar,
  Coffee,
  Presentation,
  UserCheck,
  Lightbulb,
  CheckCircle2,
  Plus,
  Minus,
  TrendingUp
} from 'lucide-react';
import { useLocation as useLocationById } from '../hooks/useLocations';

interface SpaceProduct {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string; }>;
  category: 'workspace' | 'meeting' | 'service' | 'custom';
  basePrice: number;
  capacity?: number;
  isTeamCabin?: boolean;
  teamSizes?: number[];
}

interface SelectedProduct extends SpaceProduct {
  isSelected: boolean;
  quantity: number;
  customPrice?: number;
  selectedTeamSize?: number;
}

const spaceProducts: SpaceProduct[] = [
  {
    id: 'hot-desk',
    name: 'Hot Desk',
    description: 'Flexible workspace for individuals',
    icon: Coffee,
    category: 'workspace',
    basePrice: 15,
    capacity: 1,
  },
  {
    id: 'meeting-room',
    name: 'Meeting Room',
    description: 'Private space for team meetings',
    icon: Presentation,
    category: 'meeting',
    basePrice: 25,
    capacity: 8,
  },
  {
    id: 'manager-cabin',
    name: 'Manager Cabin',
    description: 'Private office for senior professionals',
    icon: UserCheck,
    category: 'workspace',
    basePrice: 50,
    capacity: 1,
  },
  {
    id: 'team-cabin',
    name: 'Team Cabin',
    description: 'Dedicated space for small teams',
    icon: Users,
    category: 'workspace',
    basePrice: 35,
    isTeamCabin: true,
    teamSizes: [4, 6, 8],
  },
  {
    id: 'virtual-address',
    name: 'Virtual Address',
    description: 'Business address service',
    icon: MapPin,
    category: 'service',
    basePrice: 10,
    capacity: 0,
  },
  {
    id: 'event-space',
    name: 'Event Space',
    description: 'Large venue for events and workshops',
    icon: Calendar,
    category: 'meeting',
    basePrice: 100,
    capacity: 50,
  },
  {
    id: 'custom',
    name: 'Custom Space',
    description: 'Define your own unique offering',
    icon: Plus,
    category: 'custom',
    basePrice: 20,
  },
];

export default function LocationSpacesPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const { data: location, isLoading: locationLoading } = useLocationById(locationId!);
  
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize selected products from spaceProducts
  useEffect(() => {
    const initialProducts = spaceProducts.map(product => ({
      ...product,
      isSelected: false,
      quantity: 1,
      selectedTeamSize: product.isTeamCabin ? product.teamSizes?.[0] : undefined,
    }));
    setSelectedProducts(initialProducts);
  }, []);

  // Calculate totals whenever selection changes
  useEffect(() => {
    const activeProducts = selectedProducts.filter(p => p.isSelected);
    
    const capacity = activeProducts.reduce((total, product) => {
      const productCapacity = product.isTeamCabin 
        ? (product.selectedTeamSize || 4) 
        : (product.capacity || 0);
      return total + (productCapacity * product.quantity);
    }, 0);

    const revenue = activeProducts.reduce((total, product) => {
      const price = product.customPrice || product.basePrice;
      return total + (price * product.quantity);
    }, 0);

    setTotalCapacity(capacity);
    setTotalRevenue(revenue);
    setHasUnsavedChanges(activeProducts.length > 0);
  }, [selectedProducts]);

  // AI suggestions based on selection
  useEffect(() => {
    const activeProducts = selectedProducts.filter(p => p.isSelected);
    const suggestions = [];

    if (activeProducts.length === 0) {
      suggestions.push("💡 Start with Hot Desks - they're popular and flexible!");
    } else {
      if (activeProducts.some(p => p.id === 'hot-desk') && !activeProducts.some(p => p.id === 'meeting-room')) {
        suggestions.push("🤝 Add Meeting Rooms to complement your Hot Desks");
      }
      if (totalCapacity > 20 && !activeProducts.some(p => p.id === 'event-space')) {
        suggestions.push("🎪 Consider Event Space for workshops and networking");
      }
      if (activeProducts.length >= 3) {
        suggestions.push("🏢 You're building a comprehensive workspace!");
      }
    }

    setAiSuggestions(suggestions);
  }, [selectedProducts, totalCapacity]);

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => prev.map(product =>
      product.id === productId 
        ? { ...product, isSelected: !product.isSelected }
        : product
    ));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedProducts(prev => prev.map(product =>
      product.id === productId 
        ? { ...product, quantity }
        : product
    ));
  };

  const updatePrice = (productId: string, price: number) => {
    setSelectedProducts(prev => prev.map(product =>
      product.id === productId 
        ? { ...product, customPrice: price }
        : product
    ));
  };

  const updateTeamSize = (productId: string, teamSize: number) => {
    setSelectedProducts(prev => prev.map(product =>
      product.id === productId 
        ? { ...product, selectedTeamSize: teamSize }
        : product
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    setHasUnsavedChanges(false);
    // Show success message and redirect
    navigate('/dashboard', { 
      state: { 
        message: `Space configuration for ${location?.name} saved successfully!` 
      }
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'workspace': return 'from-blue-500 to-indigo-600';
      case 'meeting': return 'from-green-500 to-emerald-600';
      case 'service': return 'from-purple-500 to-violet-600';
      case 'custom': return 'from-orange-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getProgressPercentage = () => {
    const selectedCount = selectedProducts.filter(p => p.isSelected).length;
    return Math.min(100, (selectedCount / spaceProducts.length) * 100);
  };

  if (locationLoading || !location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configure Spaces</h1>
                <p className="text-sm text-gray-600">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  {location.name} • {location.address.city}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white transition-all ${
                hasUnsavedChanges && !isSaving
                  ? 'bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Configuration Area */}
          <div className="lg:col-span-3">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Configuration Progress</h2>
                <span className="text-sm text-gray-600">{Math.round(getProgressPercentage())}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {selectedProducts.map((product) => {
                const Icon = product.icon;
                const isSelected = product.isSelected;
                
                return (
                  <div
                    key={product.id}
                    className={`relative group cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'scale-105 shadow-xl' 
                        : 'hover:scale-102 hover:shadow-lg'
                    }`}
                    onClick={() => toggleProduct(product.id)}
                  >
                    {/* Selection Indicator */}
                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white shadow-lg transition-all duration-300 z-10 ${
                      isSelected ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white m-0.5" />}
                    </div>

                    {/* Card */}
                    <div className={`bg-white rounded-xl p-6 border-2 transition-all duration-300 ${
                      isSelected 
                        ? 'border-blue-500 bg-gradient-to-br from-white to-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      {/* Header */}
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getCategoryColor(product.category)} flex items-center justify-center text-white shadow-lg`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-600">{product.description}</p>
                        </div>
                      </div>

                      {/* Team Size Selector for Team Cabins */}
                      {isSelected && product.isTeamCabin && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg" onClick={e => e.stopPropagation()}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Team Size
                          </label>
                          <div className="flex space-x-2">
                            {product.teamSizes?.map(size => (
                              <button
                                key={size}
                                onClick={() => updateTeamSize(product.id, size)}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                  product.selectedTeamSize === size
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {size} person{size > 1 ? 's' : ''}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Configuration Controls - Only show when selected */}
                      {isSelected && (
                        <div className="space-y-4" onClick={e => e.stopPropagation()}>
                          {/* Quantity Slider */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Quantity: {product.quantity}
                            </label>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => updateQuantity(product.id, product.quantity - 1)}
                                disabled={product.quantity <= 1}
                                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <input
                                type="range"
                                min="1"
                                max="50"
                                value={product.quantity}
                                onChange={(e) => updateQuantity(product.id, parseInt(e.target.value))}
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                              />
                              <button
                                onClick={() => updateQuantity(product.id, product.quantity + 1)}
                                className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Pricing Input */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Price per hour (₹)
                            </label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                type="number"
                                min="0"
                                step="5"
                                value={product.customPrice || product.basePrice}
                                onChange={(e) => updatePrice(product.id, parseInt(e.target.value) || 0)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={`${product.basePrice}`}
                              />
                            </div>
                            {(product.customPrice || 0) !== product.basePrice && (
                              <p className="text-xs text-blue-600 mt-1">
                                Suggested: ₹{product.basePrice}/hr
                              </p>
                            )}
                          </div>

                          {/* Capacity Display */}
                          {product.capacity !== undefined && product.capacity > 0 && (
                            <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                              <span>Capacity per unit:</span>
                              <span className="font-medium">
                                {product.isTeamCabin ? product.selectedTeamSize : product.capacity} people
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Base Price Display - Only show when not selected */}
                      {!isSelected && (
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Starting from</span>
                          <span className="font-semibold text-lg text-gray-900">₹{product.basePrice}/hr</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar - Summary & AI Suggestions */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Configuration Summary */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  Summary
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-900">Total Capacity</span>
                    <span className="text-xl font-bold text-blue-600">{totalCapacity}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-900">Hourly Revenue</span>
                    <span className="text-xl font-bold text-green-600">₹{totalRevenue}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-purple-900">Products</span>
                    <span className="text-xl font-bold text-purple-600">
                      {selectedProducts.filter(p => p.isSelected).length}
                    </span>
                  </div>
                </div>

                {totalRevenue > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      <strong>Monthly Potential:</strong> ₹{(totalRevenue * 8 * 22).toLocaleString()}
                      <br />
                      <span className="text-yellow-700">*Based on 8 hours/day, 22 days/month</span>
                    </p>
                  </div>
                )}
              </div>

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 border border-indigo-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-indigo-600" />
                    AI Suggestions
                  </h3>
                  
                  <div className="space-y-3">
                    {aiSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white rounded-lg shadow-sm border border-indigo-100 text-sm text-gray-700 animate-fade-in"
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Tips */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
                  Pro Tips
                </h3>
                
                <div className="space-y-3 text-sm text-gray-600">
                  <p>💰 Hot Desks typically have the highest utilization</p>
                  <p>🤝 Meeting Rooms generate premium rates</p>
                  <p>🏢 Virtual Addresses provide steady recurring revenue</p>
                  <p>🎯 Start small and expand based on demand</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .hover\\\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}