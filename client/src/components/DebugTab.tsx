import { useState, useEffect } from 'react';

function decodeJWT(token: string) {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function TokenSection({ title, description, token }: { title: string; description: string; token: string | null }) {
  const [copied, setCopied] = useState(false);
  const decoded = token ? decodeJWT(token) : null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="debug-card">
      <h3 className="debug-card-title">{title}</h3>
      <p className="debug-card-desc">{description}</p>
      {decoded && (
        <div className="debug-code-block">
          <button
            className={`debug-copy-btn ${copied ? 'copied' : ''}`}
            onClick={() => copyToClipboard(JSON.stringify(decoded, null, 2))}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <pre>{JSON.stringify(decoded, null, 2)}</pre>
        </div>
      )}
      {token && !decoded && (
        <div className="debug-note">
          This token is opaque (not a JWT) and cannot be decoded on the client.
        </div>
      )}
      {!token && <div className="debug-note">No token available.</div>}
    </div>
  );
}

export default function DebugTab({ user }: { user: any }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/token', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setAccessToken(data.accessToken || null);
        setIdToken(data.idToken || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="tab-panel">
        <div className="debug-card">
          <p className="debug-card-desc">Loading tokens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-panel">
      <TokenSection
        title="ID Token"
        description="Contains identity claims about the authenticated user (name, email, sub, etc.)."
        token={idToken}
      />
      <TokenSection
        title="Access Token"
        description="Used to call APIs on behalf of the user. May be a JWT or an opaque token depending on your Auth0 API configuration."
        token={accessToken}
      />
      <div className="debug-card">
        <h3 className="debug-card-title">User Info (from /userinfo)</h3>
        <p className="debug-card-desc">User profile data fetched from Auth0's userinfo endpoint during login.</p>
        <div className="debug-code-block">
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
