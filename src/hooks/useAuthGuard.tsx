// hooks/useAuthGuard.ts
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const useAuthGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('🔄 AuthGuard: Checking authentication...');
    console.log('📍 Current URL:', window.location.href);
    console.log('📍 Current path:', location.pathname);
    console.log('🏠 Window context:', window === window.top ? 'Main window' : 'Iframe');
    
    // ✅ STEP 1: Allow payment status page without auth
    if (location.pathname === '/payment/status' || location.pathname.startsWith('/payment/status')) {
      console.log('✅ Payment status page - Skipping auth check');
      return; // Don't check auth for payment status page
    }
    
    // ✅ STEP 2: Also allow login page
    if (location.pathname === '/login' || location.pathname === '/') {
      console.log('✅ Login/Home page - Skipping auth check');
      return;
    }
    
    const token = localStorage.getItem('token');
    console.log('🔑 Token in localStorage:', token ? 'EXISTS' : 'NULL/UNDEFINED');
    
    if (!token) {
      console.log('🚫 NO TOKEN FOUND - Redirecting to login');
      console.log('💾 localStorage content:', localStorage);
      
      // Clear any potential stale data
      localStorage.removeItem('userRole');
      localStorage.removeItem('user');
      localStorage.removeItem('unEncryptedUser');
      localStorage.removeItem('agentId');
      
      // Store where user was trying to go
      sessionStorage.setItem('redirectUrl', location.pathname + location.search);
      
      // Force redirect to login
      navigate('/login', { replace: true });
      return;
    }
    
    console.log('✅ Token found - Access granted');
    
  }, [navigate, location]); // ✅ Add location to dependencies
};