import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSync, FaClock, FaDatabase, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import cacheService from '../utils/cacheService';

const CacheStatusIndicator = ({ 
  cacheInfo, 
  cacheUsed, 
  onRefresh, 
  onClearCache, 
  showDetails = false,
  className = "" 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (ms) => {
    if (ms < 1000) return 'Just now';
    if (ms < 60000) return `${Math.floor(ms / 1000)}s ago`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
    return `${Math.floor(ms / 3600000)}h ago`;
  };

  const formatTimeRemaining = (ms) => {
    if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m`;
    return `${Math.floor(ms / 3600000)}h`;
  };

  const getStatusColor = () => {
    if (!cacheInfo) return 'text-gray-400';
    if (cacheInfo.isExpired) return 'text-red-400';
    if (cacheInfo.timeRemaining < 60000) return 'text-yellow-400'; // Less than 1 minute
    return 'text-green-400';
  };

  const getStatusIcon = () => {
    if (!cacheInfo) return <FaDatabase className="text-gray-400" />;
    if (cacheInfo.isExpired) return <FaExclamationTriangle className="text-red-400" />;
    if (cacheInfo.timeRemaining < 60000) return <FaClock className="text-yellow-400" />;
    return <FaCheckCircle className="text-green-400" />;
  };

  if (!cacheUsed && !cacheInfo) {
    return null; // Don't show indicator if no cache is being used
  }

  return (
    <div className={`cache-status-indicator ${className}`}>
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="cache-status-btn"
        >
          <AnimatePresence mode="wait">
            {isRefreshing ? (
              <motion.div
                key="refreshing"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <FaSync className="text-blue-400" />
              </motion.div>
            ) : (
              <motion.div
                key="status"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {getStatusIcon()}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="cache-tooltip"
            >
              <div className="tooltip-content">
                <div className="tooltip-header">
                  <span className="tooltip-title">Cache Status</span>
                  {cacheUsed && (
                    <span className="cache-used-badge">Cached</span>
                  )}
                </div>
                
                {cacheInfo ? (
                  <div className="tooltip-details">
                    <div className="tooltip-row">
                      <span>Age:</span>
                      <span className={getStatusColor()}>
                        {formatTime(cacheInfo.age)}
                      </span>
                    </div>
                    <div className="tooltip-row">
                      <span>Expires in:</span>
                      <span className={getStatusColor()}>
                        {cacheInfo.isExpired ? 'Expired' : formatTimeRemaining(cacheInfo.timeRemaining)}
                      </span>
                    </div>
                    <div className="tooltip-row">
                      <span>Status:</span>
                      <span className={getStatusColor()}>
                        {cacheInfo.isExpired ? 'Expired' : 'Valid'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="tooltip-details">
                    <span className="text-gray-400">No cache data</span>
                  </div>
                )}

                <div className="tooltip-actions">
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="tooltip-action-btn refresh-btn"
                  >
                    <FaSync className={isRefreshing ? 'animate-spin' : ''} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                  
                  {onClearCache && (
                    <button
                      onClick={onClearCache}
                      className="tooltip-action-btn clear-btn"
                    >
                      Clear Cache
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detailed view (optional) */}
      {showDetails && cacheInfo && (
        <div className="cache-details">
          <div className="cache-detail-item">
            <FaClock className="detail-icon" />
            <span>Last updated: {formatTime(cacheInfo.age)}</span>
          </div>
          <div className="cache-detail-item">
            <FaDatabase className="detail-icon" />
            <span>Status: {cacheInfo.isExpired ? 'Expired' : 'Valid'}</span>
          </div>
          {!cacheInfo.isExpired && (
            <div className="cache-detail-item">
              <FaSync className="detail-icon" />
              <span>Expires in: {formatTimeRemaining(cacheInfo.timeRemaining)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CacheStatusIndicator; 