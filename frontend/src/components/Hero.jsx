import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const CROSSFADE_MS = 1100;
const HOLD_MS = 6500;

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
    }, HOLD_MS);

    return () => window.clearInterval(timer);
  }, [index, slides.length]);

  function goTo(nextIndex) {
    if (nextIndex === index) {
      return;
    }
    setIndex(nextIndex);
  }

  if (!slide) {
    return null;
  }

  return (
    <section className="hero" aria-roledescription="carousel" aria-label="Featured">
      <div className="container">
        <article className="hero-stage">
          <div className="hero-media" aria-hidden="true">
            {slides.map((item, mediaIndex) => (
              <img
                key={item.id}
                className={mediaIndex === index ? 'hero-frame is-active' : 'hero-frame'}
                src={item.image}
                alt=""
                style={{ transitionDuration: `${CROSSFADE_MS}ms` }}
              />
            ))}
          </div>

          <div className="hero-veil" aria-hidden="true" />

          <div className="hero-copy" key={slide.id}>
            <p className="hero-brand">Surprise Fashion Sphere</p>
            <h1>{slide.title}</h1>
            <p className="hero-subtitle">{slide.subtitle}</p>
            <Link className="button button-wine hero-cta" to={slide.href}>
              <span>{slide.cta || 'Shop Now'}</span>
              <span className="hero-cta-arrow" aria-hidden="true">
                →
              </span>
            </Link>
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
                onClick={() => goTo(dotIndex)}
              />
            ))}
          </div>

          <p className="sr-only" aria-live="polite">
            {slide.title}. {slide.subtitle}
          </p>
        </article>
      </div>
    </section>
  );
}
