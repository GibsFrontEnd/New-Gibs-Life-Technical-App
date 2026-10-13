
//@ts-nocheck

import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/UI/use-toast';

export const useSimpleSessionTimeout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const resetTimer = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('user');
      localStorage.removeItem('unEncryptedUser');
      localStorage.removeItem('agentId');

      toast({
        title: 'Session Expired',
        description: 'Your session has expired due to inactivity.',
        variant: 'destructive',
      });

      navigate('/login', { replace: true });
    }, 10 * 60 * 1000); // 10 minutes
  }, [navigate, toast]);

  useEffect(() => {
    resetTimer();

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'click', 'scroll'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer]);

  return { resetTimer };
};