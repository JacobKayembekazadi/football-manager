/**
 * Custom hook for Supabase data fetching
 * 
 * Provides a consistent pattern for fetching data with loading and error states.
 */

import { useState, useEffect } from 'react';
import { isSupabaseConfigured } from '../services/supabaseClient';

interface UseSupabaseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching data from Supabase
 * 
 * @param queryFn - Async function that returns the data
 * @param deps - Dependencies array (like useEffect)
 * @returns Object with data, loading, error, and refetch function
 * 
 * @example
 * ```typescript
 * const { data: players, loading, error } = useSupabaseQuery(
 *   () => playerService.getPlayers(clubId),
 *   [clubId]
 * );
 * ```
 */
export function useSupabaseQuery<T>(
  queryFn: () => Promise<T>,
  deps: React.DependencyList = []
): UseSupabaseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    // If Supabase is not configured, skip the query and set loading to false immediately
    if (!isSupabaseConfigured()) {
      setLoading(false);
      setError(null); // Don't set error - just silently use defaults
      setData(null); // Will use default/fallback values from destructuring
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await queryFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData(null);
      // Don't block rendering on error - set loading to false
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

