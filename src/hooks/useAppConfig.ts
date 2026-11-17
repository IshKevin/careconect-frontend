import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/api';

// Public settings chosen by admins (GET /misc/configuration): support email, whether sign-up is open,
// and maintenance mode. Defaults keep the app usable if the request fails.
export type AppConfig = {
  supportEmail: string;
  allowSelfSignup: boolean;
  maintenance: { enabled: boolean; message: string | null };
};

const DEFAULTS: AppConfig = { supportEmail: 'support@isanomed.org', allowSelfSignup: true, maintenance: { enabled: false, message: null } };

export function useAppConfig() {
  const query = useQuery({
    queryKey: ['app-config'],
    queryFn: async () => (await api.get<Partial<AppConfig>>('/misc/configuration')).data,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
  return { ...DEFAULTS, ...(query.data ?? {}), isLoading: query.isLoading } as AppConfig & { isLoading: boolean };
}
