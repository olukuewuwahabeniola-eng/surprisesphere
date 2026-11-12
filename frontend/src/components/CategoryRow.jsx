import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

function CategoryCard({ category, duplicate = false }) {
  return (
    <Link
      id={duplicate ? undefined : `cat-${category.id}`}
      className="category-card"
      to={`/shop/${category.id}`}
      tabIndex={duplicate ? -1 : undefined}
      aria-hidden={duplicate ? true : undefined}
    >
      <span className="category-card-media">
        <img src={category.image} alt={duplicate ? '' : category.alt} draggable="false" />
      </span>
      <span>{category.name}</span>
    </Link>
  );
}

export default function CategoryRow({ categories = [] }) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const items = useMemo(
    () => (Array.isArray(categories) ? categories.filter(Boolean) : []),
    [categories],
  );

  const durationSeconds = Math.max(28, items.length * 4.5);

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className="section category-section"
      id="categories"
      aria-labelledby="category-heading"
      data-reveal
    >
      <div className="container">
        <h2 id="category-heading" className="sr-only">
          Shop by category
        </h2>
      </div>

      <div className="category-stage" aria-hidden="true">
        <p className="category-editorial">DISCOVER YOUR STYLE</p>
        <span className="category-spark category-spark-1" />
        <span className="category-spark category-spark-2" />
        <span className="category-spark category-spark-3" />
        <span className="category-spark category-spark-4" />
        <span className="category-light" />
      </div>

      <div
        className={reduceMotion ? 'category-marquee is-static' : 'category-marquee'}
        style={reduceMotion ? undefined : { '--category-duration': `${durationSeconds}s` }}
      >
        <div className="category-track">
          <div className="category-set">
            {items.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
          {!reduceMotion && (
            <div className="category-set" aria-hidden="true">
              {items.map((category) => (
                <CategoryCard key={`loop-${category.id}`} category={category} duplicate />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
