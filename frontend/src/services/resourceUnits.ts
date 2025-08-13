import apiService from './api';
import { ResourceUnit } from '../../shared/types';

export interface ResourceUnitsResponse {
  success: boolean;
  data: {
    units: ResourceUnit[];
  };
  message?: string;
}

export const resourceUnitsService = {
  /**
   * Get resource units for a specific space
   */
  async getResourceUnits(spaceId: string): Promise<ResourceUnitsResponse> {
    try {
      const response = await apiService.getSpaceResourceUnits(spaceId);
      return response.data as ResourceUnitsResponse;
    } catch (error: any) {
      console.error('Failed to fetch resource units:', error);
      
      // If endpoint doesn't exist yet, return empty array
      if (error.response?.status === 404) {
        return {
          success: true,
          data: { units: [] }
        };
      }
      
      throw error;
    }
  }
};