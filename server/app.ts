import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { ManagementClient } from 'auth0';

declare module 'express-session' {
  interface SessionData {
    user: any;
    accessToken: string;
    idToken: string;
    stepUpAction?: string;
  }
}

const app = express();

app.set('trust proxy', 1);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const baseURL = process.env.BASE_URL || 'http://localhost:3000';
const isSecure = baseURL.startsWith('https://');

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: clientUrl,
  credentials: true,
}));

app.use(session({
  secret: process.env.SECRET || 'dev-secret-replace-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isSecure,
    httpOnly: true,
    sameSite: isSecure ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

function requiresAuth(): express.RequestHandler {
  return (req, res, next) => {
    if (!req.session?.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    next();
  };
}

const management = new ManagementClient({
  domain: (process.env.ISSUER_BASE_URL || '').replace('https://', ''),
  clientId: process.env.CLIENT_ID || '',
  clientSecret: process.env.CLIENT_SECRET || '',
});

// --- Auth routes ---

app.get('/login', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.CLIENT_ID || '',
    response_type: 'code',
    scope: 'openid profile email',
    redirect_uri: `${baseURL}/callback`,
    response_mode: 'query',
    prompt: 'login',
  });
  if (process.env.AUTH0_AUDIENCE) {
    params.set('audience', process.env.AUTH0_AUDIENCE);
  }
  if (req.query.screen_hint) {
    params.set('screen_hint', req.query.screen_hint as string);
  }
  if (req.query.invitation) {
    params.set('invitation', req.query.invitation as string);
  }
  if (req.query.organization) {
    params.set('organization', req.query.organization as string);
  }
  res.redirect(`${process.env.ISSUER_BASE_URL}/authorize?${params.toString()}`);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).json({ error: 'Missing authorization code' });
    return;
  }

  try {
    const tokenResponse = await fetch(`${process.env.ISSUER_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${baseURL}/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error('[callback] token exchange failed:', err);
      res.status(401).json({ error: 'Token exchange failed' });
      return;
    }

    const tokens = await tokenResponse.json();
    req.session.accessToken = tokens.access_token;
    req.session.idToken = tokens.id_token;

    const userInfoResponse = await fetch(`${process.env.ISSUER_BASE_URL}/userinfo`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (userInfoResponse.ok) {
      req.session.user = await userInfoResponse.json();
    } else {
      const payload = tokens.id_token?.split('.')[1];
      if (payload) {
        req.session.user = JSON.parse(Buffer.from(payload, 'base64url').toString());
      }
    }

    if (req.session.stepUpAction === 'reset-password') {
      delete req.session.stepUpAction;
      await fetch(`${process.env.ISSUER_BASE_URL}/dbconnections/change_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.CLIENT_ID,
          email: req.session.user.email,
          connection: 'Username-Password-Authentication',
        }),
      });
      res.redirect(`${clientUrl}/dashboard?passwordReset=sent`);
      return;
    }

    res.redirect(`${clientUrl}/dashboard`);
  } catch (err: any) {
    console.error('[callback] error:', err.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.get('/step-up/reset-password', requiresAuth(), (req, res) => {
  req.session.stepUpAction = 'reset-password';
  const params = new URLSearchParams({
    client_id: process.env.CLIENT_ID || '',
    response_type: 'code',
    scope: 'openid profile email',
    redirect_uri: `${baseURL}/callback`,
    response_mode: 'query',
    prompt: 'login',
    acr_values: 'http://schemas.openid.net/pape/policies/2007/06/multi-factor',
  });
  if (process.env.AUTH0_AUDIENCE) {
    params.set('audience', process.env.AUTH0_AUDIENCE);
  }
  res.redirect(`${process.env.ISSUER_BASE_URL}/authorize?${params.toString()}`);
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    const params = new URLSearchParams({
      client_id: process.env.CLIENT_ID || '',
      returnTo: clientUrl,
    });
    res.redirect(`${process.env.ISSUER_BASE_URL}/v2/logout?${params.toString()}`);
  });
});

app.get('/', (req, res) => {
  res.redirect(`${clientUrl}/dashboard`);
});

// --- API routes ---

app.get('/api/debug/config', (req, res) => {
  res.json({
    hasAudience: !!process.env.AUTH0_AUDIENCE,
    audience: process.env.AUTH0_AUDIENCE,
    baseURL: process.env.BASE_URL,
    clientUrl: process.env.CLIENT_URL,
  });
});

app.get('/api/status', (req, res) => {
  res.json({ isAuthenticated: !!req.session?.user });
});

app.get('/api/auth/token', requiresAuth(), (req, res) => {
  res.json({
    accessToken: req.session.accessToken || null,
    idToken: req.session.idToken || null,
  });
});

app.get('/api/user', requiresAuth(), async (req, res) => {
  try {
    const userId = req.session.user.sub;
    const user = await management.users.get(userId);
    const meta = user.user_metadata || {};
    const normalized = {
      firstName: meta.firstName || '',
      lastName: meta.lastName || '',
      companyName: meta.companyName || meta.company_name || '',
      phone: meta.phone || meta.phone_number || '',
      jobTitle: meta.jobTitle || meta.job_title || '',
      newsletter: meta.newsletter || false,
    };
    const { orgId, isAdmin } = await getOrgAdmin(req);
    res.json({ ...req.session.user, user_metadata: normalized, org_id: orgId, isAdmin });
  } catch (err: any) {
    console.error('[GET /api/user]', err.statusCode, err.message);
    res.json(req.session.user);
  }
});

app.patch('/api/user/metadata', requiresAuth(), async (req, res) => {
  try {
    const { firstName, lastName, companyName, phone, newsletter, jobTitle } = req.body;
    const userId = req.session.user.sub;
    await management.users.update(userId, {
      user_metadata: { firstName, lastName, companyName, phone, newsletter, jobTitle },
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[PATCH /api/user/metadata]', err.statusCode, err.message);
    res.status(500).json({ error: err.message || 'Failed to update metadata' });
  }
});

app.post('/api/user/reset-password', requiresAuth(), async (req, res) => {
  try {
    const email = req.session.user.email;
    const response = await fetch(`${process.env.ISSUER_BASE_URL}/dbconnections/change_password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.CLIENT_ID,
        email,
        connection: 'Username-Password-Authentication',
      }),
    });
    if (!response.ok) throw new Error('Failed to trigger password reset');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send reset email' });
  }
});

async function getOrgAdmin(req: any): Promise<{ orgId: string | null; isAdmin: boolean }> {
  const orgId = req.session.user?.org_id;
  if (!orgId) return { orgId: null, isAdmin: false };
  try {
    const userId = req.session.user.sub;
    const members = await management.organizations.getMembers({ id: orgId });
    const member = (members.data || members).find((m: any) => m.user_id === userId);
    const roles = member?.roles || [];
    const isAdmin = roles.some((r: any) => r.name === 'admin' || r.name === 'org_admin');
    return { orgId, isAdmin };
  } catch {
    return { orgId, isAdmin: false };
  }
}

app.get('/api/org/me', requiresAuth(), async (req, res) => {
  const orgId = req.session.user?.org_id;
  if (!orgId) {
    res.json({ org_id: null, isAdmin: false });
    return;
  }
  try {
    const org = await management.organizations.get({ id: orgId });
    const { isAdmin } = await getOrgAdmin(req);
    res.json({
      org_id: orgId,
      name: org.data.name,
      display_name: org.data.display_name,
      metadata: org.data.metadata,
      isAdmin,
    });
  } catch (err: any) {
    console.error('[GET /api/org/me]', err.message);
    res.json({ org_id: orgId, isAdmin: false });
  }
});

app.get('/api/org/members', requiresAuth(), async (req, res) => {
  const { orgId, isAdmin } = await getOrgAdmin(req);
  if (!orgId || !isAdmin) { res.status(403).json({ error: 'Forbidden' }); return; }
  try {
    const members = await management.organizations.getMembers({ id: orgId });
    const memberList = members.data || members;
    const withRoles = await Promise.all(
      (memberList as any[]).map(async (m: any) => {
        try {
          const roles = await management.organizations.getMemberRoles({ id: orgId, userId: m.user_id });
          return { ...m, roles: roles.data || roles };
        } catch {
          return { ...m, roles: [] };
        }
      })
    );
    res.json(withRoles);
  } catch (err: any) {
    console.error('[GET /api/org/members]', err.message);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

app.post('/api/org/members/invite', requiresAuth(), async (req, res) => {
  const { orgId, isAdmin } = await getOrgAdmin(req);
  if (!orgId || !isAdmin) { res.status(403).json({ error: 'Forbidden' }); return; }
  try {
    const { email, role } = req.body;
    const invitation: any = {
      id: orgId,
      body: {
        inviter: { name: req.session.user.name || 'Admin' },
        invitee: { email },
        client_id: process.env.CLIENT_ID!,
        send_invitation_email: true,
      },
    };
    if (role) {
      const allRoles = await management.organizations.getRoles({ id: orgId });
      const roleObj = (allRoles.data || allRoles).find((r: any) => r.name === role);
      if (roleObj) invitation.body.roles = [roleObj.id];
    }
    await management.organizations.createInvitation(invitation);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[POST /api/org/members/invite]', err.message);
    res.status(500).json({ error: err.message || 'Failed to send invitation' });
  }
});

app.get('/api/org/invitations', requiresAuth(), async (req, res) => {
  const { orgId, isAdmin } = await getOrgAdmin(req);
  if (!orgId || !isAdmin) { res.status(403).json({ error: 'Forbidden' }); return; }
  try {
    const invitations = await management.organizations.getInvitations({ id: orgId });
    res.json(invitations.data || invitations);
  } catch (err: any) {
    console.error('[GET /api/org/invitations]', err.message);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

app.delete('/api/org/invitations/:invitationId', requiresAuth(), async (req, res) => {
  const { orgId, isAdmin } = await getOrgAdmin(req);
  if (!orgId || !isAdmin) { res.status(403).json({ error: 'Forbidden' }); return; }
  try {
    await management.organizations.deleteInvitation({ id: orgId, invitation_id: req.params.invitationId });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE /api/org/invitations]', err.message);
    res.status(500).json({ error: 'Failed to revoke invitation' });
  }
});

app.delete('/api/org/members/:userId', requiresAuth(), async (req, res) => {
  const { orgId, isAdmin } = await getOrgAdmin(req);
  if (!orgId || !isAdmin) { res.status(403).json({ error: 'Forbidden' }); return; }
  try {
    await management.organizations.deleteMembers({ id: orgId, members: [req.params.userId] });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE /api/org/members]', err.message);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

app.post('/api/org/members/:userId/roles', requiresAuth(), async (req, res) => {
  const { orgId, isAdmin } = await getOrgAdmin(req);
  if (!orgId || !isAdmin) { res.status(403).json({ error: 'Forbidden' }); return; }
  try {
    await management.organizations.addMemberRoles({ id: orgId, userId: req.params.userId, body: { roles: req.body.roles } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[POST /api/org/members/roles]', err.message);
    res.status(500).json({ error: 'Failed to add role' });
  }
});

app.delete('/api/org/members/:userId/roles', requiresAuth(), async (req, res) => {
  const { orgId, isAdmin } = await getOrgAdmin(req);
  if (!orgId || !isAdmin) { res.status(403).json({ error: 'Forbidden' }); return; }
  try {
    await management.organizations.deleteMemberRoles({ id: orgId, userId: req.params.userId, body: { roles: req.body.roles } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE /api/org/members/roles]', err.message);
    res.status(500).json({ error: 'Failed to remove role' });
  }
});

app.get('/api/org/roles', requiresAuth(), async (req, res) => {
  const { orgId, isAdmin } = await getOrgAdmin(req);
  if (!orgId || !isAdmin) { res.status(403).json({ error: 'Forbidden' }); return; }
  try {
    const roles = await management.organizations.getRoles({ id: orgId });
    res.json(roles.data || roles);
  } catch (err: any) {
    console.error('[GET /api/org/roles]', err.message);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

app.get('/api/org/sso/connections', requiresAuth(), async (req, res) => {
  const { orgId, isAdmin } = await getOrgAdmin(req);
  if (!orgId || !isAdmin) { res.status(403).json({ error: 'Forbidden' }); return; }
  try {
    const connections = await management.organizations.getEnabledConnections({ id: orgId });
    res.json(connections.data || connections);
  } catch (err: any) {
    console.error('[GET /api/org/sso/connections]', err.message);
    res.status(500).json({ error: 'Failed to fetch SSO connections' });
  }
});

app.post('/api/org/sso/ticket', requiresAuth(), async (req, res) => {
  const { orgId, isAdmin } = await getOrgAdmin(req);
  if (!orgId || !isAdmin) { res.status(403).json({ error: 'Forbidden' }); return; }
  try {
    const { connection_id } = req.body;
    const ticket = await management.selfServiceProfiles.createSsoTicket({
      id: orgId,
      body: {
        connection_id: connection_id || undefined,
        enabled_organizations: [{ organization_id: orgId }],
        enabled_clients: [{ client_id: process.env.CLIENT_ID! }],
      } as any,
    });
    res.json({ ticket: (ticket.data || ticket).ticket });
  } catch (err: any) {
    console.error('[POST /api/org/sso/ticket]', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate SSO ticket' });
  }
});

app.delete('/api/org/sso/connections/:connectionId', requiresAuth(), async (req, res) => {
  const { orgId, isAdmin } = await getOrgAdmin(req);
  if (!orgId || !isAdmin) { res.status(403).json({ error: 'Forbidden' }); return; }
  try {
    await management.organizations.deleteEnabledConnection({ id: orgId, connectionId: req.params.connectionId });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE /api/org/sso/connections]', err.message);
    res.status(500).json({ error: 'Failed to remove SSO connection' });
  }
});

export default app;
