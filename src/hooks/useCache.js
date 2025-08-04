import { useState, useEffect, useCallback, useRef } from 'react';
import cacheService from '../utils/cacheService';

// Custom hook for managing cache state and operations
export const useCache = (cacheKey, fetchFunction, options = {}) => {
  const {
    enabled = true,
    expiryMs = 5 * 60 * 1000, // 5 minutes default
    autoRefresh = false,
    refreshInterval = 60 * 1000, // 1 minute
    onCacheHit = null,
    onCacheMiss = null,
    onError = null
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cacheUsed, setCacheUsed] = useState(false);
  const [cacheInfo, setCacheInfo] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Store fetchFunction in a ref to prevent infinite re-renders
  const fetchFunctionRef = useRef(fetchFunction);
  fetchFunctionRef.current = fetchFunction;

  // Get cache information
  const getCacheInfo = useCallback(() => {
    return cacheService.getInfo(cacheKey);
  }, [cacheKey]);

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    return cacheService.has(cacheKey);
  }, [cacheKey]);

  // Force refresh data
  const forceRefresh = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    setCacheUsed(false);
    
    try {
      const freshData = await fetchFunctionRef.current();
      setData(freshData);
      setLastUpdated(new Date());
      
      // Cache the fresh data
      cacheService.set(cacheKey, freshData, expiryMs);
      
      if (onCacheMiss) onCacheMiss(freshData);
    } catch (err) {
      setError(err);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, enabled, expiryMs, onCacheMiss, onError]);

  // Load data with cache support
  const loadData = useCallback(async (forceRefreshFlag = false) => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    // Try cache first (unless force refresh)
    if (!forceRefreshFlag && isCacheValid()) {
      const cachedData = cacheService.get(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setCacheUsed(true);
        setCacheInfo(getCacheInfo());
        setLastUpdated(new Date(cacheService.getAge(cacheKey)));
        setLoading(false);
        
        if (onCacheHit) onCacheHit(cachedData);
        return;
      }
    }

    // Fetch fresh data
    setCacheUsed(false);
    try {
      const freshData = await fetchFunctionRef.current();
      setData(freshData);
      setLastUpdated(new Date());
      
      // Cache the fresh data
      cacheService.set(cacheKey, freshData, expiryMs);
      setCacheInfo(getCacheInfo());
      
      if (onCacheMiss) onCacheMiss(freshData);
    } catch (err) {
      setError(err);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, enabled, expiryMs, isCacheValid, onCacheHit, onCacheMiss, onError, getCacheInfo]);

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    cacheService.remove(cacheKey);
    setCacheUsed(false);
    setCacheInfo(null);
  }, [cacheKey]);

  // Clear all cache
  const clearAllCache = useCallback(() => {
    cacheService.clearAll();
    setCacheUsed(false);
    setCacheInfo(null);
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return cacheService.getStats();
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!enabled || !autoRefresh) return;

    const interval = setInterval(async () => {
      // Only refresh if cache is expired or about to expire
      const info = getCacheInfo();
      if (!info || info.timeRemaining < 30000) { // Refresh if less than 30 seconds remaining
        try {
          const freshData = await fetchFunctionRef.current();
          setData(freshData);
          setLastUpdated(new Date());
          cacheService.set(cacheKey, freshData, expiryMs);
          if (onCacheMiss) onCacheMiss(freshData);
        } catch (err) {
          setError(err);
          if (onError) onError(err);
        }
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enabled, autoRefresh, refreshInterval, cacheKey, expiryMs, onCacheMiss, onError, getCacheInfo]);

  // Initial load - only run once when component mounts
  useEffect(() => {
    if (enabled) {
      loadData();
    }
  }, [enabled]); // Only depend on enabled, not loadData

  // Update cache info when data changes
  useEffect(() => {
    if (data) {
      setCacheInfo(getCacheInfo());
    }
  }, [data, getCacheInfo]);

  return {
    // Data and state
    data,
    loading,
    error,
    cacheUsed,
    cacheInfo,
    lastUpdated,
    
    // Actions
    loadData,
    forceRefresh,
    invalidateCache,
    clearAllCache,
    getCacheStats,
    
    // Utilities
    isCacheValid,
    getCacheInfo
  };
};

// Hook for managing multiple cache keys
export const useMultiCache = (cacheConfigs) => {
  const [cacheStates, setCacheStates] = useState({});

  const invalidateAll = useCallback(() => {
    cacheService.clearAll();
    setCacheStates({});
  }, []);

  const invalidateType = useCallback((type) => {
    cacheService.invalidateCacheType(type);
    setCacheStates({});
  }, []);

  const getStats = useCallback(() => {
    return cacheService.getStats();
  }, []);

  return {
    cacheStates,
    invalidateAll,
    invalidateType,
    getStats
  };
};

// Hook for cache consent management
export const useCacheConsent = () => {
  const [cacheAllowed, setCacheAllowed] = useState(() => {
    const consent = localStorage.getItem('ctc_cache_consent');
    return consent === 'true';
  });

  const [showConsent, setShowConsent] = useState(() => {
    const consent = localStorage.getItem('ctc_cache_consent');
    return consent === null;
  });

  const handleConsent = useCallback((accept) => {
    localStorage.setItem('ctc_cache_consent', accept ? 'true' : 'false');
    setCacheAllowed(accept);
    setShowConsent(false);
    
    // Clear cache if consent is denied
    if (!accept) {
      cacheService.clearAll();
    }
  }, []);

  const resetConsent = useCallback(() => {
    localStorage.removeItem('ctc_cache_consent');
    setShowConsent(true);
    setCacheAllowed(false);
    cacheService.clearAll();
  }, []);

  return {
    cacheAllowed,
    showConsent,
    handleConsent,
    resetConsent
  };
}; 