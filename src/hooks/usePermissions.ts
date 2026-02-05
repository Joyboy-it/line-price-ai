import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Permission } from '@/lib/permissions';

interface UsePermissionsReturn {
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  isLoading: boolean;
  error: Error | null;
}

export function usePermissions(): UsePermissionsReturn {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPermissions() {
      if (status === 'loading') {
        return;
      }

      if (!session?.user) {
        setPermissions([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch('/api/permissions/me');
        
        if (!response.ok) {
          throw new Error('Failed to fetch permissions');
        }

        const data = await response.json();
        setPermissions(data.permissions || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setPermissions([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPermissions();
  }, [session, status]);

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  return {
    permissions,
    hasPermission,
    isLoading,
    error,
  };
}
