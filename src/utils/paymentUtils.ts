// src/utils/paymentUtils.ts
export type UserType = 'agent' | 'customer' | 'admin' | 'unknown';

export const detectUserType = (): UserType => {
  console.log('🔍 Detecting user type...');
  
  // 1. Try URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const urlUserType = urlParams.get('userType');
  if (urlUserType) {
    const normalized = urlUserType.toLowerCase() as UserType;
    console.log('✅ Got userType from URL:', normalized);
    return normalized;
  }

  // 2. Try localStorage (from your auth system)
  const storedUserType = localStorage.getItem('userType');
  if (storedUserType) {
    const normalized = storedUserType.toLowerCase() as UserType;
    console.log('✅ Got userType from localStorage:', normalized);
    return normalized;
  }

  // 3. Check unEncryptedUser from your logs
  const unEncryptedUserStr = localStorage.getItem('unEncryptedUser');
  if (unEncryptedUserStr) {
    try {
      const userData = JSON.parse(unEncryptedUserStr);
      if (userData.userType) {
        const normalized = userData.userType.toLowerCase() as UserType;
        console.log('✅ Got userType from unEncryptedUser:', normalized);
        return normalized;
      }
    } catch (error) {
      console.error('Error parsing unEncryptedUser:', error);
    }
  }

  // 4. Default to customer
  console.log('⚠️ Using default userType: customer');
  return 'customer';
};
export const getDashboardPath = (): string => {
  const userType = localStorage.getItem('userType')?.toLowerCase();
  
  switch(userType) {
    case 'agent':
      return '/agent/dashboard';
    case 'admin':
      return '/admin/dashboard';
    case 'customer':
      return '/customer/dashboard';
    default:
      return '/dashboard';
  }
};

export const getDashboardButtonText = (): string => {
  return 'Back to Dashboard';
};