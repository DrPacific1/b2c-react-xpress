import { useState } from 'react';
import { useCart } from '../contexts/CartContext';

interface Product {
  id: number;
  category: string;
  subcategory: string;
  name: string;
  price: number;
  originalPrice?: number;
  unit: string;
}

const products: Product[] = [
  { id: 1, category: 'Tubular Steel', subcategory: 'Structural Tube and Pipe', name: 'Square Hollow Section (SHS)', price: 45.90, unit: '/m' },
  { id: 2, category: 'Tubular Steel', subcategory: 'Structural Tube and Pipe', name: 'Rectangular Hollow Section (RHS)', price: 52.30, originalPrice: 61.50, unit: '/m' },
  { id: 3, category: 'Tubular Steel', subcategory: 'Structural Tube and Pipe', name: 'Oval Rail', price: 38.70, unit: '/m' },
  { id: 4, category: 'Tubular Steel', subcategory: 'Precision Tube', name: 'Rectangular Precision Tube', price: 29.90, originalPrice: 35.00, unit: '/m' },
  { id: 5, category: 'Tubular Steel', subcategory: 'Precision Tube', name: 'Square Precision Tube', price: 27.50, unit: '/m' },
  { id: 6, category: 'Tubular Steel', subcategory: 'Precision Tube', name: 'Round Precision Tube', price: 24.80, unit: '/m' },
];

function ProductCard({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  function handleAdd() {
    addToCart(
      { productId: product.id, name: product.name, price: product.price, unit: product.unit },
      quantity
    );
    setQuantity(1);
  }

  return (
    <div className="product-card">
      <div className="product-img">
        <div className="product-img-placeholder" />
      </div>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <span className="product-subcategory">{product.subcategory}</span>
        <a href="#" className="product-name">{product.name}</a>

        <div className="product-price-block">
          {product.originalPrice && (
            <span className="product-original-price">${product.originalPrice.toFixed(2)}</span>
          )}
          <span className="product-current-price">${product.price.toFixed(2)}</span>
          <span className="product-unit">{product.unit}</span>
        </div>

        <div className="product-quantity">
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button>
          <span>{quantity}</span>
          <button onClick={() => setQuantity((q) => q + 1)}>+</button>
        </div>

        <button className="product-add-btn" onClick={handleAdd}>
          ADD TO CART
        </button>
      </div>
    </div>
  );
}

export default function ProductGrid() {
  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
