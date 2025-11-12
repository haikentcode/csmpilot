import { useState, useEffect, useCallback, useRef, useReducer } from 'react';
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

// Generic API hook with loading, error, and retry states
export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: unknown[] = [],
  options: {
    immediate?: boolean;
    retryOnMount?: boolean;
    fallbackData?: T;
  } = {}
) {
  const { immediate = true, retryOnMount = false, fallbackData } = options;
  
  const [data, setData] = useState<T | undefined>(fallbackData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (showLoading = true) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await apiCall();
      
      if (!abortControllerRef.current.signal.aborted) {
        setData(result);
        setRetryCount(0);
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        
        // Use fallback data if available and error is retryable
        if (fallbackData && isRetryableError(err)) {
          setData(fallbackData);
        }
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [apiCall, fallbackData]);

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    execute();
  }, [execute]);

  const refresh = useCallback(() => {
    execute(false); // Refresh without showing loading spinner
  }, [execute]);

  useEffect(() => {
    if (immediate || (retryOnMount && retryCount > 0)) {
      execute();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate, retryOnMount, retryCount, apiCall, fallbackData, ...dependencies]);

  return {
    data,
    loading,
    error,
    retry,
    refresh,
    execute,
    retryCount,
  };
}

// Specific hooks for different API endpoints
export function useCustomers(page: number = 1, perPage: number = 20) {
  return useApi(
    () => apiService.getCustomers(page, perPage),
    [page, perPage],
    {
      fallbackData: {
        customers: [],
        total: 0,
        page,
        per_page: perPage,
        total_pages: 0,
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
    { 
      immediate: !!customerId,
      fallbackData: {
        base_customer: '',
        similar_customers: [] as SimilarCustomer[]
      }
    }
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
        summary: 'Profile summary is currently unavailable. Please try again later.',
        risks: ['Service temporarily unavailable'],
        opportunities: ['Retry when service is restored'],
        talk_tracks: ['Acknowledge service interruption']
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

// Hook for health check
export function useHealthCheck() {
  return useApi(
    () => apiService.getHealth(),
    [],
    { 
      immediate: true,
      fallbackData: {
        status: 'unknown',
        message: 'Unable to check service status',
        version: '1.0.0'
      }
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
  
  // Use reducer for managing accumulated data state
  const [state, dispatch] = useReducer(
    (state: { allData: T[]; hasMore: boolean }, action: 
      | { type: 'SET_DATA'; data: T[]; page: number; totalPages: number }
      | { type: 'RESET' }
    ) => {
      switch (action.type) {
        case 'SET_DATA':
          return {
            allData: action.page === 1 
              ? action.data 
              : [...state.allData, ...action.data],
            hasMore: action.page < action.totalPages
          };
        case 'RESET':
          return { allData: [], hasMore: true };
        default:
          return state;
      }
    },
    { allData: [], hasMore: true }
  );

  const { data, loading, error, retry } = useApi(
    () => apiCall(page, perPage),
    [page, perPage]
  );

  // Update state when new data arrives
  useEffect(() => {
    if (data) {
      dispatch({
        type: 'SET_DATA',
        data: data.customers || [],
        page,
        totalPages: data.total_pages || 0
      });
    }
  }, [data, page]);

  const loadMore = useCallback(() => {
    if (!loading && state.hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, state.hasMore]);

  const reset = useCallback(() => {
    setPage(1);
    dispatch({ type: 'RESET' });
  }, []);

  return {
    data: state.allData,
    loading,
    error,
    retry,
    loadMore,
    reset,
    hasMore: state.hasMore,
    currentPage: page,
    totalPages: data?.total_pages || 0,
    total: data?.total || 0,
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