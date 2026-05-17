import { useEffect, useState } from 'react';

interface OrgInfo {
  org_id: string | null;
  isAdmin: boolean;
  display_name?: string;
  name?: string;
  metadata?: Record<string, any>;
}

export function useUser() {
  const [user, setUser] = useState<any>(null);
  const [orgInfo, setOrgInfo] = useState<OrgInfo>({ org_id: null, isAdmin: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/user', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/org/me', { credentials: 'include' }).then(r => r.json()),
    ])
      .then(([userData, orgData]) => {
        setUser(userData);
        setOrgInfo(orgData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return {
    user,
    orgId: orgInfo.org_id,
    isAdmin: orgInfo.isAdmin,
    orgInfo,
    loading,
  };
}
