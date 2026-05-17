import { useState, useEffect } from 'react';

interface SSOConnection {
  connection_id: string;
  connection?: {
    name?: string;
    display_name?: string;
    strategy?: string;
  };
  assign_membership_on_login?: boolean;
}

export default function SSOTab() {
  const [connections, setConnections] = useState<SSOConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settingUp, setSettingUp] = useState(false);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/org/sso/connections', { credentials: 'include' });
      const data = await res.json();
      setConnections(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load SSO connections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConnections(); }, []);

  const clearMessages = () => { setError(null); setSuccess(null); };

  const handleSetup = async () => {
    setSettingUp(true);
    clearMessages();
    try {
      const res = await fetch('/api/org/sso/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.ticket) {
        window.open(data.ticket, '_blank');
        setSuccess('SSO setup wizard opened in a new tab.');
      }
    } catch {
      setError('Failed to generate SSO setup ticket');
    } finally {
      setSettingUp(false);
    }
  };

  const handleRemove = async (connectionId: string, name: string) => {
    if (!confirm(`Remove SSO connection "${name}"? Users will no longer be able to log in with this provider.`)) return;
    clearMessages();
    try {
      const res = await fetch(`/api/org/sso/connections/${encodeURIComponent(connectionId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else { setSuccess(`Connection "${name}" removed`); fetchConnections(); }
    } catch {
      setError('Failed to remove connection');
    }
  };

  const strategyLabel = (strategy?: string) => {
    const labels: Record<string, string> = {
      'okta': 'Okta',
      'waad': 'Microsoft Entra ID',
      'google-apps': 'Google Workspace',
      'samlp': 'SAML',
      'oidc': 'OpenID Connect',
      'adfs': 'AD FS',
      'pingfederate': 'PingFederate',
    };
    return strategy ? labels[strategy] || strategy : 'Unknown';
  };

  if (loading) {
    return (
      <div className="tab-panel">
        <div className="debug-card"><p className="debug-card-desc">Loading SSO connections...</p></div>
      </div>
    );
  }

  return (
    <div className="tab-panel">
      {error && <div className="admin-alert admin-alert-error">{error}</div>}
      {success && <div className="admin-alert admin-alert-success">{success}</div>}

      <div className="debug-card">
        <h3 className="debug-card-title">Enterprise SSO</h3>
        <p className="debug-card-desc">
          Configure single sign-on so your team can log in using your company's identity provider.
        </p>
        <button
          className="admin-btn admin-btn-primary"
          onClick={handleSetup}
          disabled={settingUp}
        >
          {settingUp ? 'Opening...' : 'Set Up Enterprise SSO'}
        </button>
      </div>

      <div className="debug-card">
        <h3 className="debug-card-title">Active Connections</h3>
        {connections.length === 0 ? (
          <div className="debug-note">No SSO connections configured yet.</div>
        ) : (
          <div className="admin-list">
            {connections.map(conn => {
              const name = conn.connection?.display_name || conn.connection?.name || conn.connection_id;
              const strategy = conn.connection?.strategy;
              return (
                <div key={conn.connection_id} className="admin-list-item">
                  <div className="admin-list-item-info">
                    <div className="admin-list-item-title">{name}</div>
                    <div className="admin-list-item-meta">
                      <span className="admin-role-badge">{strategyLabel(strategy)}</span>
                      {conn.assign_membership_on_login && (
                        <span className="admin-badge admin-badge-active">Auto-assign members</span>
                      )}
                    </div>
                  </div>
                  <div className="admin-list-item-actions">
                    <span className="admin-badge admin-badge-active">Active</span>
                    <button
                      className="admin-btn admin-btn-danger admin-btn-sm"
                      onClick={() => handleRemove(conn.connection_id, name)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
