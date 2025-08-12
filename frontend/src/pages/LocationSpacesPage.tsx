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
  TrendingUp,
  AlertCircle,
  Edit,
  Trash2,
  MoreVertical,
  Settings
} from 'lucide-react';
import { useLocation as useLocationById } from '../hooks/useLocations';
import { useProductTypes, useCreateProductType, useUpdateProductType, useDeleteProductType, useGenerateSpaces } from '../hooks/useProductTypes';
import { ProductTypeCategory, CreateProductTypeData } from '@shared/types';
import { DeleteSpaceTypeDialog } from '../components/spaces/DeleteSpaceTypeDialog';
import { SpaceTypeForm } from '../components/spaces/SpaceTypeForm';

interface SpaceProduct {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string; }>;
  category: 'workspace' | 'meeting' | 'service' | 'custom';
  productTypeCategory: ProductTypeCategory;
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
    productTypeCategory: 'Hot_Desk',
    basePrice: 15,
    capacity: 1,
  },
  {
    id: 'meeting-room',
    name: 'Meeting Room',
    description: 'Private space for team meetings',
    icon: Presentation,
    category: 'meeting',
    productTypeCategory: 'Meeting_Room',
    basePrice: 25,
    capacity: 8,
  },
  {
    id: 'manager-cabin',
    name: 'Manager Cabin',
    description: 'Private office for senior professionals',
    icon: UserCheck,
    category: 'workspace',
    productTypeCategory: 'Manager_Cabin',
    basePrice: 50,
    capacity: 1,
  },
  {
    id: 'team-cabin',
    name: 'Team Cabin',
    description: 'Dedicated space for small teams',
    icon: Users,
    category: 'workspace',
    productTypeCategory: 'Team_Cabin',
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
    productTypeCategory: 'Virtual_Office',
    basePrice: 10,
    capacity: 0,
  },
  {
    id: 'event-space',
    name: 'Event Space',
    description: 'Large venue for events and workshops',
    icon: Calendar,
    category: 'meeting',
    productTypeCategory: 'Event_Space',
    basePrice: 100,
    capacity: 50,
  },
  {
    id: 'custom',
    name: 'Custom Space',
    description: 'Define your own unique offering',
    icon: Plus,
    category: 'custom',
    productTypeCategory: 'Private_Office',
    basePrice: 20,
  },
];

// Helper function to generate product type code
const generateProductTypeCode = (productTypeCategory: ProductTypeCategory, index: number = 1): string => {
  const codeMap: Record<ProductTypeCategory, string> = {
    'Hot_Desk': 'HD',
    'Dedicated_Desk': 'DD',
    'Manager_Cabin': 'MC',
    'Team_Cabin': 'TC',
    'Private_Office': 'PO',
    'Meeting_Room': 'MR',
    'Conference_Room': 'CR',
    'Phone_Booth': 'PB',
    'Event_Space': 'ES',
    'Training_Room': 'TR',
    'Interview_Room': 'IR',
    'Focus_Pod': 'FP',
    'Lounge_Area': 'LA',
    'Virtual_Office': 'VO'
  };
  
  const prefix = codeMap[productTypeCategory] || 'SP';
  return `${prefix}${index.toString().padStart(3, '0')}`;
};

export default function LocationSpacesPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const { data: location, isLoading: locationLoading } = useLocationById(locationId!);
  
  // Debug component mount and state
  console.log("🏗️ LocationSpacesPage mounted");
  console.log("📍 Location ID from params:", locationId);
  console.log("🏢 Location data:", location);
  
  // Check for existing product types for this location
  const { data: existingProductTypes, isLoading: productTypesLoading } = useProductTypes({
    locationId: locationId!,
    limit: 50 // Get all product types for this location
  });
  
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [editingProductType, setEditingProductType] = useState<any>(null);
  const [deletingProductType, setDeletingProductType] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Mutations
  const createProductType = useCreateProductType();
  const updateProductType = useUpdateProductType();
  const deleteProductType = useDeleteProductType();
  const generateSpaces = useGenerateSpaces();
  
  const isSaving = createProductType.isPending || generateSpaces.isPending;
  
  // Check if location has existing product types configured
  const hasConfiguredSpaces = existingProductTypes?.productTypes && existingProductTypes.productTypes.length > 0;

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
    if (!locationId || !location) {
      setSaveError('Location information is missing');
      return;
    }

    setSaveError(null);
    
    console.log('Starting save process...');
    
    try {
      const activeProducts = selectedProducts.filter(p => p.isSelected);
      
      if (activeProducts.length === 0) {
        setSaveError('Please select at least one space type to configure');
        return;
      }

      console.log('Active products to save:', activeProducts);

      let savedCount = 0;
      const createdProductTypes = [];

      // Create product types for each selected product
      for (const [index, product] of activeProducts.entries()) {
        const capacity = product.isTeamCabin 
          ? (product.selectedTeamSize || 4) 
          : (product.capacity || 1);

        const productTypeData: CreateProductTypeData = {
          locationId: locationId,
          name: product.name,
          category: product.productTypeCategory,
          code: generateProductTypeCode(product.productTypeCategory, index + 1),
          description: product.description,
          capacity: {
            minCapacity: capacity,
            maxCapacity: capacity,
            optimalCapacity: capacity,
            wheelchairAccessible: true,
          },
          pricing: {
            type: 'hourly',
            basePrice: product.customPrice || product.basePrice,
            currency: 'INR',
            minimumDuration: 60, // 1 hour minimum
            maximumDuration: 480, // 8 hours maximum
            advanceBookingRequired: 0, // No advance booking required
          },
          amenities: {
            included: ['WiFi', 'AC'], // Basic amenities
            optional: [],
            required: ['WiFi'],
          },
          features: [`${product.name} workspace`],
          isActive: true,
          autoGeneration: {
            enabled: true,
            naming: {
              prefix: generateProductTypeCode(product.productTypeCategory, index + 1).substring(0, 2),
              startNumber: 1,
              digits: 3,
            },
            distribution: {
              byFloor: false,
            },
          },
          accessLevel: 'members_only',
          displayOrder: index,
          isHighlight: false,
        };

        console.log(`Creating product type: ${product.name}`, productTypeData);

        const createdProductType = await createProductType.mutateAsync(productTypeData);
        createdProductTypes.push(createdProductType);
        
        console.log(`Created product type: ${createdProductType?._id}`);

        // Generate individual spaces for this product type
        if (createdProductType?._id) {
          console.log(`Generating ${product.quantity} spaces for product type: ${createdProductType._id}`);
          await generateSpaces.mutateAsync({ 
            productTypeId: createdProductType._id, 
            count: product.quantity 
          });
        }

        savedCount++;
      }

      setHasUnsavedChanges(false);
      setShowConfiguration(false); // Reset to show overview
      
      console.log(`Successfully saved ${savedCount} product types and generated spaces`);
      
      // Optionally show a toast/success message here instead of navigating away immediately
      // The user will now see the space overview automatically

    } catch (error: any) {
      console.error('Error saving space configuration:', error);
      setSaveError(
        error.response?.data?.message || 
        error.message || 
        'Failed to save space configuration. Please try again.'
      );
    }
  };

  // Handle edit product type
  const handleEditProductType = (productType: any) => {
    setEditingProductType(productType);
    setShowEditForm(true);
  };

  // Handle delete product type
  const handleDeleteProductType = (productType: any) => {
    setDeletingProductType(productType);
    setShowDeleteConfirm(true);
  };

  // Confirm deletion
  const confirmDeleteProductType = async () => {
    if (!deletingProductType) return;
    
    try {
      await deleteProductType.mutateAsync(deletingProductType._id);
      setShowDeleteConfirm(false);
      setDeletingProductType(null);
    } catch (error: any) {
      console.error('Error deleting product type:', error);
      setSaveError(error.response?.data?.message || 'Failed to delete space type. It may have active bookings.');
    }
  };

  // Cancel delete
  const cancelDeleteProductType = () => {
    setShowDeleteConfirm(false);
    setDeletingProductType(null);
  };

  // Handle save from edit form
  const handleSaveSpaceType = async (formData: CreateProductTypeData) => {
    try {
      if (editingProductType) {
        // Update existing product type
        await updateProductType.mutateAsync({
          id: editingProductType._id,
          productTypeData: formData
        });
      } else {
        // Create new product type
        await createProductType.mutateAsync(formData);
      }
      setShowEditForm(false);
      setEditingProductType(null);
      setSaveError(null);
    } catch (error: any) {
      console.error('Error saving space type:', error);
      setSaveError(error.response?.data?.message || 'Failed to save space type. Please try again.');
    }
  };

  // Handle close edit form
  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setEditingProductType(null);
  };

  // Handle modify spaces click - Navigate to dedicated page
  const handleModifySpaces = () => {
    console.log("🔥 MODIFY SPACES CLICKED - Navigating to dedicated page");
    console.log("📍 Location ID:", locationId);
    navigate(`/locations/${locationId}/spaces/manage`);
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

  // Space Overview Component for when spaces are already configured
  const SpaceOverview = () => {
    const productTypes = existingProductTypes?.productTypes || [];
    
    const totalConfiguredCapacity = productTypes.reduce((total: number, pt: any) => 
      total + (pt.capacity?.optimalCapacity || 0), 0
    );
    
    const totalRevenuePotential = productTypes.reduce((total: number, pt: any) => 
      total + (pt.pricing?.basePrice || 0), 0
    );

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Space Configuration Complete! 🎉</h2>
          <p className="text-lg text-gray-600">
            Your location "{location?.name}" has {productTypes.length} configured space type{productTypes.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Capacity</h3>
                <p className="text-2xl font-bold text-blue-600">{totalConfiguredCapacity}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Hourly Revenue</h3>
                <p className="text-2xl font-bold text-green-600">₹{totalRevenuePotential}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Space Types</h3>
                <p className="text-2xl font-bold text-purple-600">{productTypes.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Configured Space Types */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Configured Space Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productTypes.map((productType: any) => (
              <div key={productType._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative group">
                {/* Actions dropdown */}
                <div className="absolute top-3 right-3">
                  <div className="relative">
                    <button
                      className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        const button = e.currentTarget;
                        const dropdown = button.nextElementSibling as HTMLElement;
                        if (dropdown) {
                          dropdown.classList.toggle('hidden');
                        }
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 hidden z-10">
                      <button
                        onClick={() => handleEditProductType(productType)}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit className="h-3 w-3 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProductType(productType)}
                        className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2 pr-8">
                  <h4 className="font-medium text-gray-900">{productType.name}</h4>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{productType.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span>Capacity: {productType.capacity?.optimalCapacity || 'N/A'}</span>
                  <span>₹{productType.pricing?.basePrice || 0}/hr</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-600 font-medium">Code: {productType.code}</span>
                  <span className="text-gray-500">Spaces: {productType.generatedSpacesCount || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleModifySpaces}
            className="inline-flex items-center px-6 py-3 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Settings className="h-4 w-4 mr-2" />
            Modify Spaces
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  };

  if (locationLoading || productTypesLoading || !location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Conditional rendering: Show overview if spaces configured, otherwise show configuration form
  if (hasConfiguredSpaces && !showConfiguration) {
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
                  <h1 className="text-2xl font-bold text-gray-900">Space Overview</h1>
                  <p className="text-sm text-gray-600">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    {location.name} • {location.address.city}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <SpaceOverview />
      </div>
    );
  }

  // Show configuration form (existing UI)
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
        
        {/* Error Message */}
        {saveError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{saveError}</p>
              </div>
              <button
                onClick={() => setSaveError(null)}
                className="ml-auto text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
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
      
      {/* Delete Confirmation Dialog */}
      <DeleteSpaceTypeDialog
        isOpen={showDeleteConfirm}
        onClose={cancelDeleteProductType}
        onConfirm={confirmDeleteProductType}
        spaceTypeName={deletingProductType?.name || ''}
        spaceCount={deletingProductType?.generatedSpacesCount || 0}
        productTypeId={deletingProductType?._id}
        isLoading={deleteProductType.isPending}
      />

      {/* Edit/Create Space Type Form */}
      <SpaceTypeForm
        isOpen={showEditForm}
        onClose={handleCloseEditForm}
        onSave={handleSaveSpaceType}
        editingProductType={editingProductType}
        locationId={locationId!}
        isLoading={updateProductType.isPending || createProductType.isPending}
      />

      {/* Space Management Interface */}
      {/* No modal needed - using page-based navigation */}
    </div>
  );
}