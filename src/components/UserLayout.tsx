// components/UserLayout.tsx
import { ReactNode } from 'react';
import { useSimpleSessionTimeout } from '../hooks/use-sessiontimeout';
import { useAuthGuard } from '../hooks/useAuthGuard';

interface UserLayoutProps {
  children: ReactNode;
}

export const UserLayout = ({ children }: UserLayoutProps) => {

// Add authentication guard - this will redirect to login if not authenticated
    useAuthGuard();


  // This will activate session timeout for all pages using this layout
  useSimpleSessionTimeout();
  
  return <div>{children}</div>;
};