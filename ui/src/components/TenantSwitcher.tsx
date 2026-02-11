import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { CreateTenantModal } from './CreateTenantModal';

export function TenantSwitcher() {
  const { tenants, tenantId, setTenantId } = useTenant();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!tenants) return null;

  const current = tenants.find((t) => t._id === tenantId);
  const hasMultiple = tenants.length > 1;

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      {hasMultiple ? (
        <>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-arm-border bg-white hover:bg-gray-50 text-sm text-arm-text"
          >
            <span>{current?.name ?? 'Select tenant'}</span>
            <ChevronDown className={`w-4 h-4 transition ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 py-1 bg-white border border-arm-border rounded-lg shadow-lg z-50 min-w-[160px]">
              {tenants.map((t) => (
                <button
                  key={t._id}
                  onClick={() => {
                    setTenantId(t._id);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    t._id === tenantId ? 'bg-arm-accent/10 text-arm-accent font-medium' : 'text-arm-text'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <span className="px-3 py-1.5 text-sm text-arm-text">
          {current?.name ?? 'No tenant'}
        </span>
      )}
      <button
        onClick={() => setShowCreate(true)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-arm-border bg-white hover:bg-gray-50 text-sm text-arm-textMuted"
        title="Create tenant"
      >
        <Plus className="w-4 h-4" />
        Add tenant
      </button>
      {showCreate && (
        <CreateTenantModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => setOpen(false)}
        />
      )}
    </div>
  );
}
