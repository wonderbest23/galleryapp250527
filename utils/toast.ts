'use client';

import { useCallback } from 'react';

interface ToastOptions {
  title?: string;
  description?: string;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  variant?: 'solid' | 'bordered' | 'flat';
  timeout?: number;
  hideCloseButton?: boolean;
  icon?: React.ReactNode;
}

export function useToast() {
  const showToast = useCallback((options: ToastOptions) => {
    const message = options.description 
      ? `${options.title}\n${options.description}` 
      : options.title || '';
    
    if (typeof window !== 'undefined') {
      alert(message);
    }
  }, []);

  const success = useCallback((title: string, description?: string) => {
    showToast({
      title,
      description,
      color: 'success',
    });
  }, [showToast]);

  const error = useCallback((title: string, description?: string) => {
    showToast({
      title,
      description,
      color: 'danger',
    });
  }, [showToast]);

  const warning = useCallback((title: string, description?: string) => {
    showToast({
      title,
      description,
      color: 'warning',
    });
  }, [showToast]);

  const info = useCallback((title: string, description?: string) => {
    showToast({
      title,
      description,
      color: 'primary',
    });
  }, [showToast]);

  return {
    showToast,
    success,
    error,
    warning,
    info,
  };
} 