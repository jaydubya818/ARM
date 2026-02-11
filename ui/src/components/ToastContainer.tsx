import { useEffect, useState } from 'react';
import { toast, Toast } from '../lib/toast';

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((newToast) => {
      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss after duration
      if (newToast.duration) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, newToast.duration);
      }
    });

    return unsubscribe;
  }, []);

  const handleDismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`min-w-[300px] max-w-[500px] rounded-lg border shadow-lg p-4 flex items-start gap-3 animate-slide-in ${
            t.type === 'success'
              ? 'bg-arm-success border-green-600'
              : t.type === 'error'
                ? 'bg-arm-danger border-red-600'
                : t.type === 'warning'
                  ? 'bg-arm-warning border-yellow-600'
                  : 'bg-arm-blue border-blue-600'
          }`}
        >
          {/* Icon */}
          <div className="flex-shrink-0 text-white text-lg">
            {t.type === 'success' && '✓'}
            {t.type === 'error' && '✕'}
            {t.type === 'warning' && '⚠'}
            {t.type === 'info' && 'ℹ'}
          </div>

          {/* Message */}
          <div className="flex-1 text-white text-sm">{t.message}</div>

          {/* Dismiss button */}
          <button
            onClick={() => handleDismiss(t.id)}
            className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
