import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';

export default function ProductSection({ id, title, products, viewAllTo }) {
  return (
    <section className="section" id={id} aria-labelledby={`${id}-title`}>
      <div className="container">
        <div className="section-head" data-reveal>
          <h2 id={`${id}-title`}>{title}</h2>
          <Link className="view-all" to={viewAllTo}>
            View all <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="product-row">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
