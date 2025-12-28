/**
 * Custom hook for Supabase real-time subscriptions
 * 
 * Provides a consistent pattern for subscribing to real-time database changes.
 */

import { useEffect, useRef } from 'react';

/**
 * Hook for subscribing to real-time updates
 * 
 * @param subscribeFn - Function that sets up the subscription and returns an unsubscribe function
 * @param callback - Callback function to handle updates
 * @param deps - Dependencies array (like useEffect)
 * 
 * @example
 * ```typescript
 * useRealtimeSubscription(
 *   (callback) => playerService.subscribeToPlayers(clubId, callback),
 *   (players) => setPlayers(players),
 *   [clubId]
 * );
 * ```
 */
export function useRealtimeSubscription<T>(
  subscribeFn: (callback: (data: T) => void) => () => void,
  callback: (data: T) => void,
  deps: React.DependencyList = []
) {
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const unsubscribe = subscribeFn((data) => {
      callbackRef.current(data);
    });

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}









