import { useCart } from '../contexts/CartContext';

interface CartPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function CartPanel({ open, onClose }: CartPanelProps) {
  const { cartItems, cartTotal, updateQuantity, removeFromCart } = useCart();

  if (!open) return null;

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className="cart-panel">
        <div className="cart-panel-header">
          <h2>Your Cart</h2>
          <button className="cart-panel-close" onClick={onClose}>&times;</button>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <p>Your cart is empty</p>
            <button className="btn btn-primary" onClick={onClose}>Continue Shopping</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.productId} className="cart-item">
                  <div className="cart-item-details">
                    <span className="cart-item-name">{item.name}</span>
                    <span className="cart-item-price">
                      ${item.price.toFixed(2)}{item.unit} &times; {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  <div className="cart-item-actions">
                    <div className="cart-item-qty">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                    </div>
                    <button className="cart-item-remove" onClick={() => removeFromCart(item.productId)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-subtotal">
                <span>Subtotal:</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <button className="cart-checkout-btn" onClick={() => alert('Checkout coming soon — payment integration in a future phase.')}>
                CHECKOUT
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
