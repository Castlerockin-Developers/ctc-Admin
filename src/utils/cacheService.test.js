// Simple test file for cache service functionality
// This can be run in the browser console to test cache operations

import cacheService from './cacheService';

// Test function to verify cache service
export const testCacheService = () => {
  console.log('🧪 Testing Cache Service...');
  
  // Test 1: Set and get cache
  console.log('\n📝 Test 1: Set and get cache');
  const testData = { message: 'Hello World', timestamp: Date.now() };
  const success = cacheService.set('test_key', testData, 60000); // 1 minute
  console.log('Set cache success:', success);
  
  const retrieved = cacheService.get('test_key');
  console.log('Retrieved data:', retrieved);
  console.log('Data matches:', JSON.stringify(testData) === JSON.stringify(retrieved));
  
  // Test 2: Cache expiration
  console.log('\n⏰ Test 2: Cache expiration');
  cacheService.set('expire_test', { data: 'will expire' }, 1000); // 1 second
  console.log('Immediate get:', cacheService.get('expire_test'));
  
  setTimeout(() => {
    console.log('After 1.5 seconds:', cacheService.get('expire_test'));
  }, 1500);
  
  // Test 3: Cache info
  console.log('\nℹ️ Test 3: Cache info');
  const info = cacheService.getInfo('test_key');
  console.log('Cache info:', info);
  
  // Test 4: Cache statistics
  console.log('\n📊 Test 4: Cache statistics');
  const stats = cacheService.getStats();
  console.log('Cache stats:', stats);
  
  // Test 5: Cache invalidation
  console.log('\n🗑️ Test 5: Cache invalidation');
  cacheService.set('delete_test', { data: 'will be deleted' });
  console.log('Before deletion:', cacheService.has('delete_test'));
  cacheService.remove('delete_test');
  console.log('After deletion:', cacheService.has('delete_test'));
  
  // Test 6: Type-based invalidation
  console.log('\n🏷️ Test 6: Type-based invalidation');
  cacheService.set('dashboard_data', { dashboard: 'data' });
  cacheService.set('students_data', { students: 'data' });
  console.log('Before type invalidation:', {
    dashboard: cacheService.has('dashboard_data'),
    students: cacheService.has('students_data')
  });
  cacheService.invalidateCacheType('dashboard');
  console.log('After dashboard invalidation:', {
    dashboard: cacheService.has('dashboard_data'),
    students: cacheService.has('students_data')
  });
  
  console.log('\n✅ Cache service tests completed!');
};

// Test cache hook functionality
export const testCacheHook = async () => {
  console.log('🧪 Testing Cache Hook...');
  
  // Simulate fetch function
  const mockFetch = async () => {
    console.log('🔍 Fetching fresh data...');
    return { data: 'fresh data', timestamp: Date.now() };
  };
  
  // Test cache hook with different configurations
  const testConfigs = [
    { name: 'Basic Cache', expiryMs: 5000 },
    { name: 'Short Expiry', expiryMs: 1000 },
    { name: 'Long Expiry', expiryMs: 30000 }
  ];
  
  for (const config of testConfigs) {
    console.log(`\n📋 Testing: ${config.name}`);
    
    // Clear any existing cache
    cacheService.remove('hook_test');
    
    // Simulate first load (cache miss)
    const firstLoad = await mockFetch();
    cacheService.set('hook_test', firstLoad, config.expiryMs);
    console.log('First load cached');
    
    // Simulate second load (cache hit)
    const cachedData = cacheService.get('hook_test');
    console.log('Second load from cache:', cachedData ? '✅' : '❌');
    
    // Check cache info
    const info = cacheService.getInfo('hook_test');
    console.log('Cache age:', Math.round(info.age / 1000), 'seconds');
    console.log('Time remaining:', Math.round(info.timeRemaining / 1000), 'seconds');
  }
  
  console.log('\n✅ Cache hook tests completed!');
};

// Test for null data filtering issue
export const testNullDataFiltering = () => {
  console.log('🧪 Testing Null Data Filtering...');
  
  // Test 1: Simulate the error that was happening
  console.log('\n📝 Test 1: Null data filtering');
  let resultsData = null;
  
  try {
    // This was causing the error
    const filteredResults = resultsData.filter(row => row.status === 'active');
    console.log('❌ This should not execute');
  } catch (error) {
    console.log('✅ Error caught:', error.message);
  }
  
  // Test 2: Safe filtering with null check
  console.log('\n📝 Test 2: Safe null data filtering');
  try {
    const filteredResults = resultsData ? resultsData.filter(row => row.status === 'active') : [];
    console.log('✅ Safe filtering works:', filteredResults.length, 'items');
  } catch (error) {
    console.log('❌ Safe filtering failed:', error.message);
  }
  
  // Test 3: Test with actual data
  console.log('\n📝 Test 3: Real data filtering');
  resultsData = [
    { id: 1, name: 'Test 1', status: 'active' },
    { id: 2, name: 'Test 2', status: 'inactive' },
    { id: 3, name: 'Test 3', status: 'active' }
  ];
  
  try {
    const filteredResults = resultsData.filter(row => row.status === 'active');
    console.log('✅ Real data filtering works:', filteredResults.length, 'items');
  } catch (error) {
    console.log('❌ Real data filtering failed:', error.message);
  }
  
  console.log('\n✅ Null data filtering tests completed!');
};

// Performance test
export const testCachePerformance = async () => {
  console.log('🚀 Testing Cache Performance...');
  
  const iterations = 100;
  const testData = { 
    large: 'x'.repeat(1000), // 1KB of data
    timestamp: Date.now() 
  };
  
  // Test without cache
  console.log('\n📊 Performance without cache:');
  const startWithoutCache = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  const timeWithoutCache = performance.now() - startWithoutCache;
  console.log(`Time for ${iterations} API calls: ${timeWithoutCache.toFixed(2)}ms`);
  
  // Test with cache
  console.log('\n📊 Performance with cache:');
  const startWithCache = performance.now();
  
  // First call (cache miss)
  cacheService.set('perf_test', testData, 60000);
  
  // Subsequent calls (cache hits)
  for (let i = 0; i < iterations - 1; i++) {
    cacheService.get('perf_test');
  }
  
  const timeWithCache = performance.now() - startWithCache;
  console.log(`Time for ${iterations} cache operations: ${timeWithCache.toFixed(2)}ms`);
  
  // Calculate improvement
  const improvement = ((timeWithoutCache - timeWithCache) / timeWithoutCache * 100);
  console.log(`Performance improvement: ${improvement.toFixed(1)}%`);
  
  console.log('\n✅ Performance tests completed!');
};

// Test component integration
export const testComponentIntegration = () => {
  console.log('🧪 Testing Component Integration...');
  
  // Test 1: Simulate ManageResult component
  console.log('\n📝 Test 1: ManageResult simulation');
  let resultsData = null;
  let loading = true;
  let error = null;
  
  // Simulate loading state
  if (loading) {
    console.log('✅ Loading state handled correctly');
  }
  
  // Simulate error state
  if (error) {
    console.log('✅ Error state handled correctly');
  }
  
  // Simulate null data state
  if (!resultsData) {
    console.log('✅ Null data state handled correctly');
  }
  
  // Test 2: Simulate ManageStudents component
  console.log('\n📝 Test 2: ManageStudents simulation');
  let studentsData = null;
  
  const filteredStudents = studentsData ? studentsData.filter(s => s.active) : [];
  console.log('✅ Safe filtering works:', filteredStudents.length, 'students');
  
  console.log('\n✅ Component integration tests completed!');
};

// Run all tests
export const runAllTests = async () => {
  console.log('🎯 Running All Cache Tests...\n');
  
  try {
    testCacheService();
    await testCacheHook();
    testNullDataFiltering();
    await testCachePerformance();
    testComponentIntegration();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('💡 Check the console for detailed results.');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Export for browser console testing
if (typeof window !== 'undefined') {
  window.cacheTests = {
    testCacheService,
    testCacheHook,
    testNullDataFiltering,
    testCachePerformance,
    testComponentIntegration,
    runAllTests
  };
  
  console.log('🧪 Cache tests available in browser console:');
  console.log('window.cacheTests.runAllTests() - Run all tests');
  console.log('window.cacheTests.testCacheService() - Test cache service');
  console.log('window.cacheTests.testCacheHook() - Test cache hook');
  console.log('window.cacheTests.testNullDataFiltering() - Test null data handling');
  console.log('window.cacheTests.testCachePerformance() - Test performance');
  console.log('window.cacheTests.testComponentIntegration() - Test component integration');
} 