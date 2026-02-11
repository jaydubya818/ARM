/**
 * Toast notification system
 * Simple event-based toast manager
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

type ToastListener = (toast: Toast) => void

class ToastManager {
  private listeners: ToastListener[] = [];

  private toastCounter = 0;

  subscribe(listener: ToastListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  show(type: ToastType, message: string, duration = 5000) {
    const toast: Toast = {
      id: `toast-${++this.toastCounter}`,
      type,
      message,
      duration,
    };
    this.listeners.forEach((listener) => listener(toast));
  }

  success(message: string, duration?: number) {
    this.show('success', message, duration);
  }

  error(message: string, duration?: number) {
    this.show('error', message, duration);
  }

  warning(message: string, duration?: number) {
    this.show('warning', message, duration);
  }

  info(message: string, duration?: number) {
    this.show('info', message, duration);
  }
}

export const toast = new ToastManager();
