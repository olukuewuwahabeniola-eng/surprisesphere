import { Link } from 'react-router-dom';

export default function CategoryRow({ categories }) {
  return (
    <section className="section" id="categories" aria-labelledby="category-heading">
      <div className="container">
        <h2 id="category-heading" className="sr-only">
          Shop by category
        </h2>
        <div className="category-row">
          {categories.map((category) => (
            <Link
              key={category.id}
              id={`cat-${category.id}`}
              className="category-card"
              to={`/shop/${category.id}`}
            >
              <img src={category.image} alt={category.alt} />
              <span>{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
