import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { CreateProductTypeData } from '@shared/types';

// ProductTypes Query
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
      const response = await apiService.getProductTypes(params);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Single ProductType Query
export const useProductType = (id: string | undefined) => {
  return useQuery({
    queryKey: ['product-type', id],
    queryFn: async () => {
      if (!id) throw new Error('ProductType ID is required');
      const response = await apiService.getProductType(id);
      return response.data.data?.productType;
    },
    enabled: !!id,
  });
};

// Create ProductType Mutation
export const useCreateProductType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productTypeData: CreateProductTypeData) => {
      const response = await apiService.createProductType(productTypeData);
      return response.data.data?.productType;
    },
    onSuccess: () => {
      // Invalidate and refetch product types list
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
    },
    onError: (error: any) => {
      console.error('Error creating product type:', error);
    },
  });
};

// Update ProductType Mutation
export const useUpdateProductType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productTypeData }: { id: string; productTypeData: Partial<CreateProductTypeData> }) => {
      const response = await apiService.updateProductType(id, productTypeData);
      return response.data.data?.productType;
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch product types list
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
      // Update the specific product type cache
      queryClient.invalidateQueries({ queryKey: ['product-type', variables.id] });
    },
    onError: (error: any) => {
      console.error('Error updating product type:', error);
    },
  });
};

// Delete ProductType Mutation
export const useDeleteProductType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiService.deleteProductType(id);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache and refetch list
      queryClient.removeQueries({ queryKey: ['product-type', deletedId] });
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
    },
    onError: (error: any) => {
      console.error('Error deleting product type:', error);
    },
  });
};

// Generate Spaces Mutation
export const useGenerateSpaces = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productTypeId, count }: { productTypeId: string; count: number }) => {
      const response = await apiService.generateSpaces(productTypeId, count);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate spaces and product types to refresh the data
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
    },
    onError: (error: any) => {
      console.error('Error generating spaces:', error);
    },
  });
};