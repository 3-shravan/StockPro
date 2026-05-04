import { useQuery } from '@tanstack/react-query';
import { movementsApi } from '../api/movements.api';

export const movementKeys = {
  all: ['movements'] as const,
};

export const useMovements = () => {
  return useQuery({
    queryKey: movementKeys.all,
    queryFn: movementsApi.getAll,
  });
};
