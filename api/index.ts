import express from 'express';
import cors from 'cors';
import { auth, requiresAuth } from 'express-openid-connect';
import { ManagementClient } from 'auth0';

const app = express();

app.set('trust proxy', 1);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(express.json());

app.use(cors({
  origin: clientUrl,
  credentials: true,
}));

app.use(
  auth({
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SECRET || 'dev-secret-replace-me',
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    clientID: process.env.CLIENT_ID || '',
    clientSecret: process.env.CLIENT_SECRET || '',
    issuerBaseURL: process.env.ISSUER_BASE_URL || '',
    authorizationParams: {
      response_type: 'code',
      scope: 'openid profile email',
    },
    transactionCookie: {
      sameSite: 'None',
      secure: true,
    },
    session: {
      cookie: {
        sameSite: 'None',
        secure: true,
      },
    },
  })
);

const management = new ManagementClient({
  domain: (process.env.ISSUER_BASE_URL || '').replace('https://', ''),
  clientId: process.env.CLIENT_ID || '',
  clientSecret: process.env.CLIENT_SECRET || '',
});

app.get('/', (req, res) => {
  res.redirect(`${clientUrl}/dashboard`);
});

app.get('/api/user', requiresAuth(), async (req, res) => {
  try {
    const userId = req.oidc.user!.sub;
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
    res.json({ ...req.oidc.user, user_metadata: normalized });
  } catch (err: any) {
    console.error('[GET /api/user]', err.statusCode, err.message);
    res.json(req.oidc.user);
  }
});

app.patch('/api/user/metadata', requiresAuth(), async (req, res) => {
  try {
    const { firstName, lastName, companyName, phone, newsletter, jobTitle } = req.body;
    const userId = req.oidc.user!.sub;
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
    const email = req.oidc.user!.email;
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

app.get('/api/status', (req, res) => {
  res.json({ isAuthenticated: req.oidc.isAuthenticated() });
});

export default app;
