import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { CreateSpaceData } from '@shared/types';

export const SPACES_QUERY_KEY = 'spaces';
export const SPACE_STATS_QUERY_KEY = 'space-stats';
export const SPACE_AVAILABILITY_QUERY_KEY = 'space-availability';

export function useSpaces(params?: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
  isActive?: boolean;
  minCapacity?: number;
  maxCapacity?: number;
  amenities?: string;
}) {
  return useQuery({
    queryKey: [SPACES_QUERY_KEY, params],
    queryFn: () => apiService.getSpaces(params),
    select: (response) => response.data.data,
    staleTime: 30000, // 30 seconds
  });
}

export function useSpace(id: string) {
  return useQuery({
    queryKey: [SPACES_QUERY_KEY, id],
    queryFn: () => apiService.getSpace(id),
    select: (response) => response.data.data?.space,
    enabled: !!id,
  });
}

export function useSpaceStats() {
  return useQuery({
    queryKey: [SPACE_STATS_QUERY_KEY],
    queryFn: () => apiService.getSpaceStats(),
    select: (response) => response.data.data,
    staleTime: 60000, // 1 minute
  });
}

export function useSpaceAvailability(params: {
  spaceId?: string;
  startDate: string;
  endDate: string;
}) {
  return useQuery({
    queryKey: [SPACE_AVAILABILITY_QUERY_KEY, params],
    queryFn: () => apiService.getSpaceAvailability(params),
    select: (response) => response.data.data,
    enabled: !!(params.startDate && params.endDate),
    staleTime: 300000, // 5 minutes
  });
}

export function useCreateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (spaceData: CreateSpaceData) => 
      apiService.createSpace(spaceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SPACES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SPACE_STATS_QUERY_KEY] });
    },
    onError: (error: any) => {
      console.error('Space creation error:', error);
      if (error.response?.data) {
        console.error('Error response:', error.response.data);
      }
    },
  });
}

export function useUpdateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSpaceData> }) => {
      console.log('Updating space:', id, 'with data:', data);
      return apiService.updateSpace(id, data);
    },
    onSuccess: (response, { id }) => {
      console.log('Space update successful:', response);
      queryClient.invalidateQueries({ queryKey: [SPACES_QUERY_KEY] });
      queryClient.setQueryData([SPACES_QUERY_KEY, id], response.data);
      queryClient.invalidateQueries({ queryKey: [SPACE_STATS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SPACE_AVAILABILITY_QUERY_KEY] });
    },
    onError: (error: any, { id, data }) => {
      console.error('Space update error:', error);
      console.error('Space ID:', id);
      console.error('Update data that failed:', data);
      if (error.response?.data) {
        console.error('Error response from server:', error.response.data);
      }
    },
  });
}

export function useDeleteSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteSpace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SPACES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SPACE_STATS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SPACE_AVAILABILITY_QUERY_KEY] });
    },
    onError: (error: any) => {
      console.error('Space deletion error:', error);
      if (error.response?.data) {
        console.error('Error response:', error.response.data);
      }
    },
  });
}