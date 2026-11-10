import { Link } from 'react-router-dom';

export default function PromoBanners({ promos }) {
  return (
    <section className="section" id="collections" aria-label="Collections">
      <div className="container promo-grid">
        {promos.map((promo) => (
          <article key={promo.id} className={`promo promo-${promo.tone}`}>
            <img src={promo.image} alt={promo.alt} />
            <div className="promo-copy">
              <h2>{promo.title}</h2>
              <p>{promo.kicker}</p>
              <Link className={promo.tone === 'wine' ? 'button button-cream' : 'button button-wine'} to={promo.href}>
                {promo.cta} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
