import { useState, useEffect, useCallback } from 'react';
import { 
  apiService, 
  handleApiError,
  ProfileSummary, 
  PaginatedResponse,
  GongMeeting
} from '../services/apiService';

// Simple generic API hook
export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: unknown[] = [],
  options: {
    immediate?: boolean;
    fallbackData?: T;
  } = {}
) {
  const { immediate = true, fallbackData } = options;
  
  const [data, setData] = useState<T | undefined>(fallbackData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      setData(result);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      if (fallbackData) {
        setData(fallbackData);
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall, fallbackData]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  const retry = useCallback(() => {
    execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    retry,
    execute,
  };
}

// Specific hooks for different API endpoints
export function useCustomers(page: number = 1) {
  return useApi(
    () => apiService.getCustomers(page),
    [page],
    {
      fallbackData: {
        count: 0,
        next: null,
        previous: null,
        results: [],
      } as PaginatedResponse<Customer>
    }
  );
}

export function useCustomerDetail(customerId: number | null) {
  return useApi(
    () => {
      if (!customerId) throw new Error('Customer ID is required');
      return apiService.getCustomerDetail(customerId);
    },
    [customerId],
    { immediate: !!customerId }
  );
}

export function useSimilarCustomers(customerId: number | null) {
  return useApi(
    () => {
      if (!customerId) throw new Error('Customer ID is required');
      return apiService.getSimilarCustomers(customerId);
    },
    [customerId],
    { immediate: !!customerId }
  );
}

export function useProfileSummary(customerId: number | null) {
  return useApi(
    () => {
      if (!customerId) throw new Error('Customer ID is required');
      return apiService.getProfileSummary(customerId);
    },
    [customerId],
    { 
      immediate: !!customerId,
      fallbackData: {
        customer: '',
        summary: 'Profile summary is currently unavailable.',
        risks: [],
        opportunities: [],
        talk_tracks: []
      } as ProfileSummary
    }
  );
}

export function useGongMeetings(customerId: number | null) {
  return useApi(
    () => {
      if (!customerId) throw new Error('Customer ID is required');
      return apiService.getGongMeetings(customerId);
    },
    [customerId],
    { 
      immediate: !!customerId,
      fallbackData: [] as GongMeeting[]
    }
  );
}
