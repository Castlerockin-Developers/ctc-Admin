// Cache Service Utility for CTC Admin Dashboard
// Handles localStorage caching with expiration, invalidation, and force refresh

class CacheService {
  constructor() {
    this.cachePrefix = 'ctc_';
    this.defaultExpiry = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  // Generate cache key with prefix
  generateKey(key) {
    return `${this.cachePrefix}${key}`;
  }

  // Set cache with expiration
  set(key, data, expiryMs = this.defaultExpiry) {
    try {
      const cacheData = {
        data: data,
        timestamp: Date.now(),
        expiry: expiryMs
      };
      localStorage.setItem(this.generateKey(key), JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Get cache data if not expired
  get(key) {
    try {
      const cached = localStorage.getItem(this.generateKey(key));
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = Date.now();
      const isExpired = (now - cacheData.timestamp) > cacheData.expiry;

      if (isExpired) {
        this.remove(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Cache get error:', error);
      this.remove(key);
      return null;
    }
  }

  // Remove specific cache
  remove(key) {
    try {
      localStorage.removeItem(this.generateKey(key));
      return true;
    } catch (error) {
      console.error('Cache remove error:', error);
      return false;
    }
  }

  // Clear all CTC cache
  clearAll() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.cachePrefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  // Check if cache exists and is valid
  has(key) {
    return this.get(key) !== null;
  }

  // Get cache age in milliseconds
  getAge(key) {
    try {
      const cached = localStorage.getItem(this.generateKey(key));
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      return Date.now() - cacheData.timestamp;
    } catch (error) {
      return null;
    }
  }

  // Get cache info (age, expiry, etc.)
  getInfo(key) {
    try {
      const cached = localStorage.getItem(this.generateKey(key));
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = Date.now();
      const age = now - cacheData.timestamp;
      const isExpired = age > cacheData.expiry;

      return {
        exists: true,
        age: age,
        expiry: cacheData.expiry,
        isExpired: isExpired,
        timeRemaining: isExpired ? 0 : cacheData.expiry - age
      };
    } catch (error) {
      return null;
    }
  }

  // Invalidate specific cache types
  invalidateCacheType(type) {
    const cacheTypes = {
      'dashboard': ['dashboard_data'],
      'students': ['students_data'],
      'exams': ['exam_data'],
      'results': ['result_data'],
      'all': ['dashboard_data', 'students_data', 'exam_data', 'result_data']
    };

    const keysToRemove = cacheTypes[type] || [];
    keysToRemove.forEach(key => this.remove(key));
  }

  // Clean up expired caches
  cleanup() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.cachePrefix)) {
          this.get(key.replace(this.cachePrefix, '')); // This will remove if expired
        }
      });
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  // Get cache statistics
  getStats() {
    try {
      const keys = Object.keys(localStorage);
      const ctcKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      let totalSize = 0;
      let validCaches = 0;
      let expiredCaches = 0;

      ctcKeys.forEach(key => {
        const cacheKey = key.replace(this.cachePrefix, '');
        const info = this.getInfo(cacheKey);
        if (info) {
          totalSize += JSON.stringify(localStorage.getItem(key)).length;
          if (info.isExpired) {
            expiredCaches++;
          } else {
            validCaches++;
          }
        }
      });

      return {
        totalCaches: ctcKeys.length,
        validCaches,
        expiredCaches,
        totalSize: `${(totalSize / 1024).toFixed(2)} KB`
      };
    } catch (error) {
      return null;
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Auto-cleanup on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    cacheService.cleanup();
  });
}

export default cacheService; 