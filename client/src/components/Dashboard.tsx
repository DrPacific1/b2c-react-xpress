import { useState } from 'react';
import DashboardNav from './DashboardNav';
import ProductSidebar from './ProductSidebar';
import ProductGrid from './ProductGrid';
import DebugTab from './DebugTab';
import AdminConsoleTab from './AdminConsoleTab';
import SSOTab from './SSOTab';
import { useUser } from '../hooks/useUser';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'debug', label: 'Debug' },
  { id: 'admin', label: 'Admin Console', adminOnly: true },
  { id: 'sso', label: 'SSO', adminOnly: true },
] as const;

export default function Dashboard() {
  const { user, isAdmin, orgInfo, loading } = useUser();
  const [activeTab, setActiveTab] = useState('dashboard');

  const visibleTabs = TABS.filter(tab => !('adminOnly' in tab) || isAdmin);

  if (loading) {
    return (
      <div className="dashboard">
        <DashboardNav />
        <div className="dashboard-body">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <DashboardNav />
      <nav className="tab-nav">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'dashboard' && (
        <div className="dashboard-body">
          <ProductSidebar />
          <main className="dashboard-main">
            <ProductGrid />
          </main>
        </div>
      )}

      {activeTab === 'debug' && user && <DebugTab user={user} />}
      {activeTab === 'admin' && isAdmin && user && <AdminConsoleTab user={user} orgInfo={orgInfo} />}
      {activeTab === 'sso' && isAdmin && <SSOTab />}
    </div>
  );
}
