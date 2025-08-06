import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Location, CreateLocationData, LocationStats, AmenityType } from '@shared/types';

// Locations Query
export const useLocations = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  city?: string;
  state?: string;
  amenities?: string;
  minCapacity?: number;
  maxCapacity?: number;
  sortBy?: string;
  sortOrder?: string;
}) => {
  return useQuery({
    queryKey: ['locations', params],
    queryFn: async () => {
      const response = await apiService.getLocations(params);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Single Location Query
export const useLocation = (id: string | undefined) => {
  return useQuery({
    queryKey: ['location', id],
    queryFn: async () => {
      if (!id) throw new Error('Location ID is required');
      const response = await apiService.getLocation(id);
      return response.data.data?.location;
    },
    enabled: !!id,
  });
};

// Location Stats Query
export const useLocationStats = () => {
  return useQuery({
    queryKey: ['location-stats'],
    queryFn: async () => {
      const response = await apiService.getLocationStats();
      return response.data.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Location Hours Query
export const useLocationHours = (id: string | undefined) => {
  return useQuery({
    queryKey: ['location-hours', id],
    queryFn: async () => {
      if (!id) throw new Error('Location ID is required');
      const response = await apiService.checkLocationHours(id);
      return response.data.data;
    },
    enabled: !!id,
    refetchInterval: 1000 * 60, // Refetch every minute to keep hours current
  });
};

// Create Location Mutation
export const useCreateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (locationData: CreateLocationData) => {
      const response = await apiService.createLocation(locationData);
      return response.data.data?.location;
    },
    onSuccess: () => {
      // Invalidate and refetch locations list and stats
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['location-stats'] });
    },
  });
};

// Update Location Mutation
export const useUpdateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, locationData }: { id: string; locationData: Partial<CreateLocationData> }) => {
      const response = await apiService.updateLocation(id, locationData);
      return response.data.data?.location;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch locations list and stats
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['location-stats'] });
      // Update the specific location cache
      queryClient.invalidateQueries({ queryKey: ['location', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['location-hours', variables.id] });
    },
  });
};

// Delete Location Mutation
export const useDeleteLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiService.deleteLocation(id);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache and refetch list
      queryClient.removeQueries({ queryKey: ['location', deletedId] });
      queryClient.removeQueries({ queryKey: ['location-hours', deletedId] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['location-stats'] });
    },
  });
};

// Utility function to get amenity display names
export const getAmenityDisplayName = (amenity: AmenityType): string => {
  const displayNames: Record<AmenityType, string> = {
    'WiFi': 'WiFi',
    'AC': 'Air Conditioning',
    'Parking': 'Parking',
    'Coffee': 'Coffee & Tea',
    'Security': 'Security',
    'Reception': 'Reception',
    'Kitchen': 'Kitchen',
    'Printer': 'Printer',
    'Scanner': 'Scanner',
    'Whiteboard': 'Whiteboard',
    'Projector': 'Projector',
    'Conference_Room': 'Conference Room',
    'Phone_Booth': 'Phone Booth',
    'Lounge': 'Lounge',
    'Gym': 'Gym',
    'Shower': 'Shower',
    'Bike_Storage': 'Bike Storage',
    'Mail_Service': 'Mail Service',
    'Cleaning_Service': 'Cleaning Service',
    'Catering': 'Catering',
    'Event_Space': 'Event Space',
    'Terrace': 'Terrace',
    'Garden': 'Garden',
    'Handicap_Accessible': 'Wheelchair Accessible'
  };
  return displayNames[amenity] || amenity;
};

// Utility function to get amenity icons
export const getAmenityIcon = (amenity: AmenityType): string => {
  const icons: Record<AmenityType, string> = {
    'WiFi': '📶',
    'AC': '❄️',
    'Parking': '🚗',
    'Coffee': '☕',
    'Security': '🔐',
    'Reception': '🏢',
    'Kitchen': '🍳',
    'Printer': '🖨️',
    'Scanner': '📄',
    'Whiteboard': '📝',
    'Projector': '📽️',
    'Conference_Room': '🏛️',
    'Phone_Booth': '📞',
    'Lounge': '🛋️',
    'Gym': '💪',
    'Shower': '🚿',
    'Bike_Storage': '🚲',
    'Mail_Service': '📮',
    'Cleaning_Service': '🧹',
    'Catering': '🍽️',
    'Event_Space': '🎉',
    'Terrace': '🌤️',
    'Garden': '🌳',
    'Handicap_Accessible': '♿'
  };
  return icons[amenity] || '⭐';
};