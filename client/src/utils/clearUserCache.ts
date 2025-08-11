// Clear user cache utility
export const clearUserCache = () => {
  // Clear localStorage
  localStorage.removeItem('travelconnect_user');
  localStorage.removeItem('auth_storage');
  localStorage.removeItem('user_storage');
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Force reload to refresh all cached data
  window.location.reload();
};