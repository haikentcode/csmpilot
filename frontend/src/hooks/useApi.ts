import { useState, useEffect, useCallback } from 'react';
import { 
  apiService, 
  handleApiError, 
  isRetryableError,
  Customer,
  SimilarCustomer, 
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

// Hook with pagination support
export function usePaginatedData<T>(
  apiCall: (page: number, perPage: number) => Promise<PaginatedResponse<T>>,
  initialPage: number = 1,
  perPage: number = 10
) {
  const [page, setPage] = useState(initialPage);
  const [allData, setAllData] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { data, loading, error, retry } = useApi(
    () => apiCall(page, perPage),
    [page, perPage]
  );

  // Update state when new data arrives
  useEffect(() => {
    if (data) {
      const results = data.results || [];
      const totalCount = data.count || 0;
      const currentCount = (page - 1) * perPage + results.length;
      
      setAllData(prev => page === 1 ? results : [...prev, ...results]);
      setHasMore(currentCount < totalCount);
    }
  }, [data, page, perPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  const reset = useCallback(() => {
    setPage(1);
    setAllData([]);
    setHasMore(true);
  }, []);

  return {
    data: allData,
    loading,
    error,
    retry,
    loadMore,
    reset,
    hasMore,
    currentPage: page,
    totalPages: data ? Math.ceil(data.count / perPage) : 0,
    total: data?.count || 0,
  };
}

// Hook for managing multiple API calls
export function useMultipleApi<T extends Record<string, unknown>>(
  apiCalls: Record<keyof T, () => Promise<T[keyof T]>>,
  dependencies: unknown[] = []
) {
  const [data, setData] = useState<Partial<T>>({});
  const [loading, setLoading] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [errors, setErrors] = useState<Record<keyof T, string | null>>({} as Record<keyof T, string | null>);

  const execute = useCallback(async (keys?: (keyof T)[]) => {
    const keysToExecute = keys || Object.keys(apiCalls) as (keyof T)[];
    
    // Set loading states
    setLoading(prev => {
      const newLoading = { ...prev };
      keysToExecute.forEach(key => {
        newLoading[key] = true;
      });
      return newLoading;
    });

    // Clear errors
    setErrors(prev => {
      const newErrors = { ...prev };
      keysToExecute.forEach(key => {
        newErrors[key] = null;
      });
      return newErrors;
    });

    // Execute API calls
    const promises = keysToExecute.map(async (key) => {
      try {
        const result = await apiCalls[key]();
        setData(prev => ({ ...prev, [key]: result }));
      } catch (error) {
        setErrors(prev => ({ ...prev, [key]: handleApiError(error) }));
      } finally {
        setLoading(prev => ({ ...prev, [key]: false }));
      }
    });

    await Promise.allSettled(promises);
  }, [apiCalls]);

  const retry = useCallback((keys?: (keyof T)[]) => {
    execute(keys);
  }, [execute]);

  useEffect(() => {
    execute();
  }, [...dependencies, execute]);

  const isLoading = Object.values(loading).some(Boolean);
  const hasErrors = Object.values(errors).some(Boolean);

  return {
    data,
    loading,
    errors,
    isLoading,
    hasErrors,
    execute,
    retry,
  };
}

// Hook for debounced API calls (useful for search)
export function useDebouncedApi<T>(
  apiCall: (query: string) => Promise<T>,
  query: string,
  delay: number = 300
) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  return useApi(
    () => apiCall(debouncedQuery),
    [debouncedQuery],
    { immediate: debouncedQuery.length > 0 }
  );
}
