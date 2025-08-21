import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

interface AIRecommendation {
  spaceId: string;
  spaceName: string;
  confidence: number;
  reason: string;
  suggestedTimes: {
    startTime: string;
    endTime: string;
  }[];
}

interface UseAIIntegrationProps {
  enabled?: boolean;
  locationId?: string;
  attendeeCount?: number;
  purpose?: string;
  preferredDate?: string;
}

const fetchAIRecommendations = async (params: {
  locationId: string;
  attendeeCount?: number;
  purpose?: string;
  preferredDate?: string;
}): Promise<AIRecommendation[]> => {
  const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api';
  const queryParams = new URLSearchParams();
  
  queryParams.append('locationId', params.locationId);
  if (params.attendeeCount) queryParams.append('attendeeCount', params.attendeeCount.toString());
  if (params.purpose) queryParams.append('purpose', params.purpose);
  if (params.preferredDate) queryParams.append('date', params.preferredDate);

  const response = await fetch(`${apiUrl}/ai/recommendations?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('cosynq_token')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch AI recommendations: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data?.recommendations || [];
};

export function useAIIntegration({
  enabled = false,
  locationId,
  attendeeCount,
  purpose,
  preferredDate
}: UseAIIntegrationProps = {}) {
  
  const {
    data: recommendations = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['ai-recommendations', locationId, attendeeCount, purpose, preferredDate],
    queryFn: () => fetchAIRecommendations({
      locationId: locationId!,
      attendeeCount,
      purpose,
      preferredDate
    }),
    enabled: enabled && !!locationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1
  });

  const getRecommendationForSpace = useCallback((spaceId: string) => {
    return recommendations.find(rec => rec.spaceId === spaceId);
  }, [recommendations]);

  const getTopRecommendations = useCallback((limit: number = 3) => {
    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }, [recommendations]);

  const hasRecommendations = recommendations.length > 0;

  return {
    recommendations,
    isLoading,
    isError,
    error,
    hasRecommendations,
    getRecommendationForSpace,
    getTopRecommendations,
    refresh: refetch
  };
}