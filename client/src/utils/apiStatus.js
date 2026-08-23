// API status tracking to avoid unnecessary calls
let apiStatus = {
  isOnline: true,
  lastCheck: 0,
  retryCount: 0
};

const API_CHECK_INTERVAL = 30000; // 30 seconds
const MAX_RETRIES = 3;

export const checkApiStatus = async () => {
  const now = Date.now();
  
  // If we checked recently and API was online, assume it's still online
  if (apiStatus.isOnline && (now - apiStatus.lastCheck) < API_CHECK_INTERVAL) {
    return apiStatus.isOnline;
  }
  
  try {
    // Simple health check
    const response = await fetch('http://localhost:3001/api/dashboard/stats', {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (response.ok) {
      apiStatus.isOnline = true;
      apiStatus.retryCount = 0;
    } else {
      apiStatus.isOnline = false;
      apiStatus.retryCount++;
    }
  } catch (error) {
    console.log('API health check failed:', error.message);
    apiStatus.isOnline = false;
    apiStatus.retryCount++;
  }
  
  apiStatus.lastCheck = now;
  
  // If we've failed too many times, stay offline for longer
  if (apiStatus.retryCount >= MAX_RETRIES) {
    apiStatus.isOnline = false;
  }
  
  return apiStatus.isOnline;
};

export const isApiOnline = () => apiStatus.isOnline;
