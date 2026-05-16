import { useState } from 'react';

interface Category {
  name: string;
  children?: Category[];
}

const categories: Category[] = [
  {
    name: 'TUBULAR STEEL',
    children: [
      {
        name: 'STRUCTURAL TUBE & PIPE',
        children: [
          { name: 'Rectangular Hollow Section (RHS)' },
          { name: 'Square Hollow Section (SHS)' },
        ],
      },
      {
        name: 'PRECISION TUBE',
        children: [
          { name: 'Rectangular' },
          { name: 'Square' },
          { name: 'Round' },
        ],
      },
    ],
  },
  { name: 'STRUCTURAL & MERCHANT BAR' },
  { name: 'LIVESTOCK HANDLING' },
  { name: 'FENCING' },
];

function CategoryItem({ category, depth = 0 }: { category: Category; depth?: number }) {
  const [open, setOpen] = useState(depth === 0 && category.name === 'TUBULAR STEEL');
  const hasChildren = category.children && category.children.length > 0;

  return (
    <li className="sidebar-item" style={{ paddingLeft: `${depth * 1}rem` }}>
      <button
        className={`sidebar-link ${hasChildren ? 'has-children' : ''} ${open ? 'open' : ''}`}
        onClick={() => hasChildren && setOpen(!open)}
      >
        {hasChildren && <span className="sidebar-arrow">{open ? '▼' : '▶'}</span>}
        {category.name}
      </button>
      {hasChildren && open && (
        <ul className="sidebar-children">
          {category.children!.map((child) => (
            <CategoryItem key={child.name} category={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function ProductSidebar() {
  return (
    <aside className="product-sidebar">
      <h2 className="sidebar-title">PRODUCTS</h2>
      <ul className="sidebar-list">
        {categories.map((cat) => (
          <CategoryItem key={cat.name} category={cat} />
        ))}
      </ul>
    </aside>
  );
}
