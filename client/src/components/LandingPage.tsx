import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <main className="landing">
      <section className="landing-hero">
        <h1 className="landing-hero-title">Buy Steel Direct — No Middleman</h1>
        <p className="landing-hero-subtitle">
          Trade pricing for sole traders &amp; small business. Browse our full range,
          order online, and get steel delivered to your site.
        </p>
        <div className="hero-actions">
          <a href="/login" className="btn btn-primary">
            Login
          </a>
          <a href="/login?screen_hint=signup" className="btn btn-secondary">
            Create Account
          </a>
        </div>
      </section>

      <section className="value-props">
        <div className="value-prop-card">
          <div className="value-prop-icon">$</div>
          <h3>Trade Pricing</h3>
          <p>No retail markup. Get wholesale rates direct from the distributor.</p>
        </div>
        <div className="value-prop-card">
          <div className="value-prop-icon">&#9889;</div>
          <h3>Fast Delivery</h3>
          <p>Next-day metro dispatch. Regional delivery within 3-5 business days.</p>
        </div>
        <div className="value-prop-card">
          <div className="value-prop-icon">&#9986;</div>
          <h3>Cut-to-Length</h3>
          <p>Custom lengths available on all tubular and structural steel products.</p>
        </div>
      </section>

      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Sign Up</h4>
            <p>Create your trade account in under 2 minutes</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h4>Browse</h4>
            <p>Explore our full product catalogue with live pricing</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h4>Order</h4>
            <p>Add to cart and checkout with your trade account</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h4>Delivery</h4>
            <p>Steel delivered direct to your site or workshop</p>
          </div>
        </div>
      </section>

      <section className="trust-signals">
        <div className="trust-item">
          <span className="trust-number">50+</span>
          <span className="trust-label">Years Experience</span>
        </div>
        <div className="trust-item">
          <span className="trust-number">20+</span>
          <span className="trust-label">Locations Nationwide</span>
        </div>
        <div className="trust-item">
          <span className="trust-number">100%</span>
          <span className="trust-label">Australian Owned</span>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <p>Orrcon Steel Distribution &mdash; A BlueScope Company</p>
          <p className="footer-sub">Supplying quality steel to Australian trades since 1974</p>
        </div>
      </footer>
    </main>
  );
}
