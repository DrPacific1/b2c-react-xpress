import { useState, useEffect } from 'react';

interface OrgInfo {
  org_id: string | null;
  display_name?: string;
  name?: string;
  metadata?: Record<string, any>;
  isAdmin: boolean;
}

interface Member {
  user_id: string;
  name?: string;
  email?: string;
  picture?: string;
  roles?: { id: string; name: string }[];
}

interface Invitation {
  id: string;
  invitee?: { email: string };
  inviter?: { name: string };
  roles?: { id: string; name: string }[];
  created_at?: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

export default function AdminConsoleTab({ user, orgInfo }: { user: any; orgInfo: OrgInfo }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [membersRes, invitationsRes, rolesRes] = await Promise.all([
        fetch('/api/org/members', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/org/invitations', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/org/roles', { credentials: 'include' }).then(r => r.json()),
      ]);
      setMembers(Array.isArray(membersRes) ? membersRes : []);
      setInvitations(Array.isArray(invitationsRes) ? invitationsRes : []);
      setRoles(Array.isArray(rolesRes) ? rolesRes : []);
    } catch {
      setError('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const clearMessages = () => { setError(null); setSuccess(null); };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    clearMessages();
    try {
      const res = await fetch('/api/org/members/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole || undefined }),
      });
      const result = await res.json();
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(`Invitation sent to ${inviteEmail}${inviteRole ? ` with role: ${inviteRole}` : ''}`);
        setInviteEmail('');
        setInviteRole('');
        fetchAll();
      }
    } catch {
      setError('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteInvitation = async (invitationId: string, email: string) => {
    if (!confirm(`Revoke invitation to ${email}?`)) return;
    clearMessages();
    try {
      const res = await fetch(`/api/org/invitations/${encodeURIComponent(invitationId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await res.json();
      if (result.error) setError(result.error);
      else { setSuccess(`Invitation to ${email} revoked`); fetchAll(); }
    } catch {
      setError('Failed to revoke invitation');
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from the organization?`)) return;
    clearMessages();
    try {
      await fetch(`/api/org/members/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setSuccess(`${name} has been removed`);
      fetchAll();
    } catch {
      setError('Failed to remove member');
    }
  };

  const handleAddRole = async (userId: string, roleId: string, roleName: string) => {
    clearMessages();
    try {
      await fetch(`/api/org/members/${encodeURIComponent(userId)}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roles: [roleId] }),
      });
      setSuccess(`Added "${roleName}" role`);
      fetchAll();
    } catch {
      setError('Failed to add role');
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string, roleName: string) => {
    clearMessages();
    try {
      await fetch(`/api/org/members/${encodeURIComponent(userId)}/roles`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roles: [roleId] }),
      });
      setSuccess(`Removed "${roleName}" role`);
      fetchAll();
    } catch {
      setError('Failed to remove role');
    }
  };

  if (loading) {
    return (
      <div className="tab-panel">
        <div className="debug-card"><p className="debug-card-desc">Loading organization data...</p></div>
      </div>
    );
  }

  return (
    <div className="tab-panel">
      {error && <div className="admin-alert admin-alert-error">{error}</div>}
      {success && <div className="admin-alert admin-alert-success">{success}</div>}

      <div className="debug-card">
        <h3 className="debug-card-title">Organization</h3>
        <div className="admin-org-grid">
          <div>
            <div className="admin-label">Name</div>
            <div className="admin-value">{orgInfo.display_name || orgInfo.name}</div>
          </div>
          <div>
            <div className="admin-label">Organization ID</div>
            <div className="admin-value admin-mono">{orgInfo.org_id}</div>
          </div>
          {orgInfo.metadata?.address && (
            <div>
              <div className="admin-label">Address</div>
              <div className="admin-value">{orgInfo.metadata.address}</div>
            </div>
          )}
          {orgInfo.metadata?.abn && (
            <div>
              <div className="admin-label">ABN</div>
              <div className="admin-value">{orgInfo.metadata.abn}</div>
            </div>
          )}
        </div>
      </div>

      <div className="debug-card">
        <h3 className="debug-card-title">Invite Members</h3>
        <p className="debug-card-desc">Send an invitation email to add new members to your organization.</p>
        <form onSubmit={handleInvite} className="admin-invite-form">
          <div className="admin-invite-row">
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
              className="admin-input"
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              className="admin-select"
            >
              <option value="">No role</option>
              {roles.map(role => (
                <option key={role.id} value={role.name}>{role.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={inviting}>
            {inviting ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>

      <div className="debug-card">
        <h3 className="debug-card-title">Pending Invitations</h3>
        {invitations.length === 0 ? (
          <div className="debug-note">No pending invitations.</div>
        ) : (
          <div className="admin-list">
            {invitations.map(inv => (
              <div key={inv.id} className="admin-list-item">
                <div className="admin-list-item-info">
                  <div className="admin-list-item-title">{inv.invitee?.email || 'Unknown'}</div>
                  <div className="admin-list-item-meta">
                    <span>Invited by {inv.inviter?.name || 'admin'}</span>
                    {inv.roles && inv.roles.length > 0 && (
                      <span className="admin-role-badge">{inv.roles.map(r => r.name).join(', ')}</span>
                    )}
                    {inv.created_at && <span>{new Date(inv.created_at).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="admin-list-item-actions">
                  <span className="admin-badge admin-badge-pending">Pending</span>
                  <button
                    className="admin-btn admin-btn-danger admin-btn-sm"
                    onClick={() => handleDeleteInvitation(inv.id, inv.invitee?.email || '')}
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="debug-card">
        <h3 className="debug-card-title">Organization Members</h3>
        <p className="debug-card-desc">{members.length} member{members.length !== 1 ? 's' : ''} enrolled.</p>
        {members.length === 0 ? (
          <div className="debug-note">No members found.</div>
        ) : (
          <div className="admin-list">
            {members.map(member => {
              const memberRoles = member.roles || [];
              const isCurrentUser = member.user_id === user.sub;
              return (
                <div key={member.user_id} className="admin-list-item">
                  <div className="admin-list-item-info">
                    <div className="admin-member-row">
                      {member.picture ? (
                        <img src={member.picture} alt="" className="admin-avatar" />
                      ) : (
                        <div className="admin-avatar-placeholder">
                          {(member.name || member.email || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="admin-list-item-title">
                          {member.name || member.email}
                          {isCurrentUser && <span className="admin-you-badge">(you)</span>}
                        </div>
                        <div className="admin-list-item-meta">{member.email}</div>
                        {memberRoles.length > 0 && (
                          <div className="admin-roles-row">
                            {memberRoles.map(role => (
                              <span key={role.id} className="admin-role-badge">{role.name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {!isCurrentUser && (
                    <div className="admin-list-item-actions">
                      <div className="admin-role-actions">
                        {roles.map(role => {
                          const hasRole = memberRoles.some(r => r.id === role.id);
                          return (
                            <button
                              key={role.id}
                              className={`admin-btn admin-btn-sm ${hasRole ? 'admin-btn-danger' : 'admin-btn-primary'}`}
                              onClick={() =>
                                hasRole
                                  ? handleRemoveRole(member.user_id, role.id, role.name)
                                  : handleAddRole(member.user_id, role.id, role.name)
                              }
                            >
                              {hasRole ? `Remove ${role.name}` : `Assign ${role.name}`}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        onClick={() => handleRemoveMember(member.user_id, member.name || member.email || '')}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
