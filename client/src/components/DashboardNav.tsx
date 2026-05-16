import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import CartPanel from './CartPanel';

export default function DashboardNav() {
  const { cartCount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <header className="dash-header">
        <div className="dash-topbar">
          <div className="dash-logo">
            <span className="dash-logo-text">Orrcon</span>
            <span className="dash-logo-sub">Steel</span>
            <span className="dash-logo-dist">Distribution</span>
          </div>

          <div className="dash-search">
            <input type="text" placeholder="Search for products" />
          </div>

          <div className="dash-topbar-right">
            <a href="tel:1300677266" className="dash-phone">
              1300 677 266
            </a>
            <button className="dash-cart-btn" onClick={() => setCartOpen(true)}>
              TRADE CART{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>

        <nav className="dash-nav">
          <div className="dash-nav-left">
            <Link to="/dashboard" className="dash-nav-item dash-nav-products">
              PRODUCTS
            </Link>
          </div>
          <div className="dash-nav-right">
            <Link to="/account" className="dash-nav-item dash-nav-account">
              MY ACCOUNT
            </Link>
          </div>
        </nav>
      </header>

      <CartPanel open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
