import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

interface TenantContextValue {
  tenants: { _id: Id<"tenants">; name: string }[] | undefined;
  tenantId: Id<"tenants"> | undefined;
  setTenantId: (id: Id<"tenants">) => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const tenants = useQuery(api.tenants.list);
  const [selectedId, setSelectedId] = useState<Id<"tenants"> | undefined>();

  useEffect(() => {
    if (!tenants?.length) return;
    const firstId = tenants[0]._id;
    setSelectedId((prev) => {
      if (!prev || !tenants.some((t: { _id: Id<"tenants"> }) => t._id === prev)) return firstId;
      return prev;
    });
  }, [tenants]);

  const setTenantId = useCallback((id: Id<"tenants">) => {
    setSelectedId(id);
  }, []);

  const tenantId = selectedId ?? tenants?.[0]?._id;

  return (
    <TenantContext.Provider
      value={{
        tenants,
        tenantId,
        setTenantId,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}
