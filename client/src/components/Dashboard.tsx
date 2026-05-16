import DashboardNav from './DashboardNav';
import ProductSidebar from './ProductSidebar';
import ProductGrid from './ProductGrid';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <DashboardNav />
      <div className="dashboard-body">
        <ProductSidebar />
        <main className="dashboard-main">
          <ProductGrid />
        </main>
      </div>
    </div>
  );
}
