import { useQuery } from '@tanstack/react-query';
import { resourceUnitsService } from '../services/resourceUnits';
import { ResourceUnit } from '../../shared/types';

export function useResourceUnits(spaceId: string | null) {
  return useQuery({
    queryKey: ['resourceUnits', spaceId],
    queryFn: () => {
      if (!spaceId) {
        throw new Error('Space ID is required');
      }
      return resourceUnitsService.getResourceUnits(spaceId);
    },
    enabled: !!spaceId,
    select: (data) => ({
      ...data,
      activeUnits: data?.data?.units?.filter((unit: ResourceUnit) => unit.status === 'Active') || []
    }),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}