import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { CreateProductTypeData } from '@shared/types';

// Simple ProductTypes Query
export const useProductTypes = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  locationId?: string;
  category?: string;
  isActive?: boolean;
}) => {
  return useQuery({
    queryKey: ['product-types', params],
    queryFn: async () => {
      // console.log('🔍 SIMPLE HOOK: Fetching product types with params:', params);
      const response = await apiService.getProductTypes(params);
      // console.log('📦 SIMPLE HOOK: Received response:', response.data);
      return response.data.data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
};

// Simple ProductType Single Query
export const useProductType = (id: string | undefined) => {
  return useQuery({
    queryKey: ['product-type', id],
    queryFn: async () => {
      if (!id) throw new Error('ProductType ID is required');
      // console.log('🔍 SIMPLE HOOK: Fetching single product type:', id);
      const response = await apiService.getProductType(id);
      return response.data.data?.productType;
    },
    enabled: !!id,
  });
};

// Simple Create ProductType Mutation
export const useCreateProductType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_productTypeData: CreateProductTypeData) => {
      // TODO: Fix in future release - CRUD operations disabled for production
      console.error('CRUD operations disabled for production deployment');
      throw new Error('Space type creation is being enhanced - Coming Soon!');
    },
    onSuccess: (_response, _variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
    },
    onError: (error: any, _variables) => {
      console.error('❌ SIMPLE HOOK: Create failed:', error.message);
    },
  });
};

// Simple Update ProductType Mutation
export const useUpdateProductType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productTypeData }: { id: string; productTypeData: Partial<CreateProductTypeData> }) => {
      console.log('🚀 SIMPLE HOOK: Starting update mutation');
      console.log('📤 SIMPLE HOOK: ID:', id);
      console.log('📤 SIMPLE HOOK: Data to send:', JSON.stringify(productTypeData, null, 2));
      
      const response = await apiService.updateProductType(id, productTypeData);
      
      console.log('📥 SIMPLE HOOK: API Response:', response.data);
      return response.data;
    },
    onSuccess: (_response, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
      queryClient.invalidateQueries({ queryKey: ['product-type', id] });
    },
    onError: (error: any, { id, productTypeData }) => {
      console.error('❌ SIMPLE HOOK: Update failed');
      console.error('❌ ID:', id);
      console.error('❌ Data:', productTypeData);
      console.error('❌ Error:', error);
      if (error.response?.data) {
        console.error('❌ Server response:', error.response.data);
      }
    },
  });
};

// Simple Delete ProductType Mutation
export const useDeleteProductType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🚀 SIMPLE HOOK: Starting delete mutation');
      console.log('📤 SIMPLE HOOK: ID to delete:', id);
      
      const response = await apiService.deleteProductType(id);
      
      console.log('📥 SIMPLE HOOK: Delete response:', response.data);
      return response.data;
    },
    onSuccess: (_response, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
      queryClient.removeQueries({ queryKey: ['product-type', deletedId] });
    },
    onError: (error: any, id) => {
      console.error('❌ SIMPLE HOOK: Delete failed');
      console.error('❌ ID:', id);
      console.error('❌ Error:', error);
      if (error.response?.data) {
        console.error('❌ Server response:', error.response.data);
      }
    },
  });
};

// Simple Generate Spaces Mutation
export const useGenerateSpaces = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productTypeId, count }: { productTypeId: string; count: number }) => {
      console.log('🚀 SIMPLE HOOK: Starting generate spaces mutation');
      console.log('📤 SIMPLE HOOK: ProductTypeId:', productTypeId, 'Count:', count);
      
      const response = await apiService.generateSpaces(productTypeId, count);
      
      console.log('📥 SIMPLE HOOK: Generate spaces response:', response.data);
      return response.data.data;
    },
    onSuccess: (_response) => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
    },
    onError: (error: any, variables) => {
      console.error('❌ SIMPLE HOOK: Generate spaces failed');
      console.error('❌ Variables:', variables);
      console.error('❌ Error:', error);
      if (error.response?.data) {
        console.error('❌ Server response:', error.response.data);
      }
    },
  });
};