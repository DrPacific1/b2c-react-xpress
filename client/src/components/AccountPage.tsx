import { useEffect, useState } from 'react';
import DashboardNav from './DashboardNav';

interface UserProfile {
  name?: string;
  email?: string;
  picture?: string;
  nickname?: string;
  user_metadata?: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phone?: string;
    newsletter?: boolean;
    jobTitle?: string;
  };
}

type Tab = 'account' | 'orders' | 'enquiries';

const mockOrders = [
  { id: 'ORR-2024-001', invoiceId: 'INV-001', date: '15/03/2024', status: 'Delivered', items: '3x SHS, 2x RHS', total: 249.50 },
  { id: 'ORR-2024-002', invoiceId: 'INV-002', date: '02/04/2024', status: 'Shipped', items: '5x Round Precision Tube', total: 124.00 },
  { id: 'ORR-2024-003', invoiceId: 'INV-003', date: '28/04/2024', status: 'Processing', items: '1x Oval Rail', total: 38.70 },
];

const stores = [
  'Brisbane', 'Sydney', 'Melbourne', 'Perth', 'Adelaide', 'Townsville', 'Darwin', 'Hobart',
];

export default function AccountPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('account');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [resetSending, setResetSending] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const [selectedStore, setSelectedStore] = useState(stores[0]);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquirySent, setEnquirySent] = useState(false);

  useEffect(() => {
    fetch('/api/user', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((data: UserProfile) => {
        setUser(data);
        setFirstName(data.user_metadata?.firstName || '');
        setLastName(data.user_metadata?.lastName || '');
        setCompanyName(data.user_metadata?.companyName || '');
        setPhone(data.user_metadata?.phone || '');
        setNewsletter(data.user_metadata?.newsletter || false);
        setJobTitle(data.user_metadata?.jobTitle || '');
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/user/metadata', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ firstName, lastName, companyName, phone, newsletter, jobTitle }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaveMessage('Changes saved successfully.');
      setEditing(false);
    } catch {
      setSaveMessage('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    setResetSending(true);
    setResetMessage('');
    try {
      const res = await fetch('/api/user/reset-password', { method: 'POST', credentials: 'include' });
      if (res.ok) setResetMessage('Password reset email sent! Check your inbox.');
      else throw new Error();
    } catch {
      setResetMessage('Failed to send reset email. Please try again.');
    } finally {
      setResetSending(false);
    }
  }

  function handleSendEnquiry(e: React.FormEvent) {
    e.preventDefault();
    setEnquirySent(true);
    setEnquiryMessage('');
  }

  if (loading) {
    return (
      <div className="dashboard">
        <DashboardNav />
        <div className="account-page"><p>Loading...</p></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard">
        <DashboardNav />
        <div className="account-page">
          <p>You are not logged in.</p>
          <a href="/login" className="btn btn-action">Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <DashboardNav />
      <div className="account-page">
        <div className="account-card">
          <div className="account-header">
            <h1 className="account-title">
              {activeTab === 'account' && 'MY ACCOUNT'}
              {activeTab === 'orders' && 'MY ORDERS'}
              {activeTab === 'enquiries' && 'ENQUIRIES'}
            </h1>
            <a href="/logout" className="btn-logout">LOGOUT &rarr;</a>
          </div>

          <div className="account-tabs">
            <button className={`account-tab ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
              <span className="tab-indicator" />
              Account
            </button>
            <button className={`account-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
              <span className="tab-indicator" />
              Orders
            </button>
            <button className={`account-tab ${activeTab === 'enquiries' ? 'active' : ''}`} onClick={() => setActiveTab('enquiries')}>
              <span className="tab-indicator" />
              Enquiries
            </button>
          </div>

          <div className="account-tab-content">
            {activeTab === 'account' && (
              <>
                <form className="account-form" onSubmit={handleSaveDetails}>
                  <h2 className="account-section-title">ACCOUNT DETAILS</h2>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>FIRST NAME</label>
                      <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Enter your first name" disabled={!editing} />
                    </div>
                    <div className="form-field">
                      <label>LAST NAME</label>
                      <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Enter your last name" disabled={!editing} />
                    </div>
                    <div className="form-field full-width">
                      <label>EMAIL</label>
                      <input type="email" value={user.email || ''} disabled />
                    </div>
                    <div className="form-field">
                      <label>PHONE</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter your phone number" disabled={!editing} />
                    </div>
                    <div className="form-field">
                      <label>COMPANY</label>
                      <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Enter your company name" disabled={!editing} />
                    </div>
                    <div className="form-field">
                      <label>JOB TITLE</label>
                      <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Enter your job title" disabled={!editing} />
                    </div>
                    <div className="form-field full-width">
                      <label className="checkbox-label">
                        <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} disabled={!editing} />
                        Newsletter
                      </label>
                    </div>
                  </div>
                  <div className="account-form-actions">
                    <button type="button" className="btn btn-action" onClick={() => setEditing(true)} disabled={editing}>
                      EDIT &rarr;
                    </button>
                    <button type="submit" className="btn btn-action" disabled={!editing || saving}>
                      {saving ? 'Saving...' : 'SAVE &rarr;'}
                    </button>
                  </div>
                  {saveMessage && <p className={`form-message ${saveMessage.includes('Failed') ? 'error' : ''}`}>{saveMessage}</p>}
                </form>

                <div className="account-password-section">
                  <h2 className="account-section-title">ACCOUNT PASSWORD</h2>
                  <p className="password-description">Click below to receive a secure password reset link via email.</p>
                  <button type="button" className="btn btn-action" onClick={handleResetPassword} disabled={resetSending}>
                    {resetSending ? 'Sending...' : 'RESET PASSWORD →'}
                  </button>
                  {resetMessage && <p className={`form-message ${resetMessage.includes('Failed') ? 'error' : ''}`}>{resetMessage}</p>}
                </div>
              </>
            )}

            {activeTab === 'orders' && (
              <div className="orders-section">
                <table className="order-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Order ID</th>
                      <th>Invoice ID</th>
                      <th>Status</th>
                      <th>PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.date}</td>
                        <td>{order.id}</td>
                        <td>{order.invoiceId}</td>
                        <td><span className={`order-status status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                        <td><button className="pdf-download-btn">&darr;</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="order-pagination">
                  <button disabled>&laquo;</button>
                  <button disabled>&lsaquo;</button>
                  <span>Page 1 of 1</span>
                  <button disabled>&rsaquo;</button>
                  <button disabled>&raquo;</button>
                </div>
              </div>
            )}

            {activeTab === 'enquiries' && (
              <form className="account-form enquiry-form" onSubmit={handleSendEnquiry}>
                {enquirySent ? (
                  <div className="enquiry-success">
                    <p>Your enquiry has been sent successfully. The store will contact you shortly.</p>
                    <button type="button" className="btn btn-action" onClick={() => setEnquirySent(false)}>Send Another &rarr;</button>
                  </div>
                ) : (
                  <>
                    <div className="form-grid">
                      <div className="form-field full-width">
                        <label>SELECT STORE</label>
                        <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>
                          {stores.map((store) => (
                            <option key={store} value={store}>{store}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-field full-width">
                        <label>MESSAGE</label>
                        <textarea
                          value={enquiryMessage}
                          onChange={(e) => setEnquiryMessage(e.target.value)}
                          placeholder="Type your enquiry here..."
                          rows={5}
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-action">SEND ENQUIRY &rarr;</button>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
