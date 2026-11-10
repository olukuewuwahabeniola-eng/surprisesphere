import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Hero({ slides }) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || slides.length < 2) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slide) {
    return null;
  }

  return (
    <section className="hero" aria-roledescription="carousel" aria-label="Featured">
      <div className="container">
        <article className="hero-card">
          <div className="hero-copy">
            <h1>{slide.title}</h1>
            <p>{slide.subtitle}</p>
            <Link className="button button-wine" to={slide.href}>
              {slide.cta}
              <span aria-hidden="true"> →</span>
            </Link>
          </div>
          <div className="hero-photo">
            <img key={slide.id} src={slide.image} alt={slide.alt} />
          </div>
          <div className="dots" role="tablist" aria-label="Featured slides">
            {slides.map((item, dotIndex) => (
              <button
                key={item.id}
                type="button"
                className={dotIndex === index ? 'dot is-active' : 'dot'}
                aria-label={`Show slide ${dotIndex + 1}`}
                aria-selected={dotIndex === index}
                role="tab"
                onClick={() => setIndex(dotIndex)}
              />
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
