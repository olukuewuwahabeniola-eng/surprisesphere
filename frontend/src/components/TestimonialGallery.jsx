import { useEffect, useEffectEvent, useState } from 'react';

const HOLD_MS = 6000;
const FADE_MS = 1250;

export default function TestimonialGallery({
  photos = [],
  title = 'Loved by Our Customers',
  eyebrow = 'Testimonials',
  emptyMessage = '',
  loading = false,
  errorMessage = '',
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const list = Array.isArray(photos) ? photos.filter((photo) => photo?.url) : [];
  const count = list.length;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(media.matches);
    syncMotion();
    media.addEventListener?.('change', syncMotion);
    return () => media.removeEventListener?.('change', syncMotion);
  }, []);

  useEffect(() => {
    setIndex((current) => (count === 0 ? 0 : Math.min(current, count - 1)));
  }, [count]);

  const nextUrl = count >= 2 ? list[(index + 1) % count]?.url : '';

  useEffect(() => {
    if (!nextUrl) return undefined;
    const preload = new Image();
    preload.src = nextUrl;
    return undefined;
  }, [nextUrl]);

  const advance = useEffectEvent(() => {
    if (count < 2) return;
    setIndex((current) => (current + 1) % count);
  });

  useEffect(() => {
    if (paused || count < 2) return undefined;
    if (reducedMotion) {
      const timer = window.setInterval(() => advance(), HOLD_MS);
      return () => window.clearInterval(timer);
    }
    const timer = window.setInterval(() => advance(), HOLD_MS);
    return () => window.clearInterval(timer);
  }, [paused, count, reducedMotion]);

  if (loading) {
    return (
      <section className="section testimonial-section" aria-label={title} aria-busy="true">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h2>{title}</h2>
            </div>
          </div>
          <div className="testimonial-stage is-loading" aria-live="polite">
            <p className="testimonial-empty">Loading customer moments…</p>
          </div>
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="section testimonial-section" aria-label={title}>
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h2>{title}</h2>
            </div>
          </div>
          <p className="testimonial-empty" role="alert">
            {errorMessage}
          </p>
        </div>
      </section>
    );
  }

  if (count === 0) {
    if (!emptyMessage) {
      return null;
    }
    return (
      <section className="section testimonial-section" aria-label={title}>
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h2>{title}</h2>
            </div>
          </div>
          <p className="testimonial-empty">{emptyMessage}</p>
        </div>
      </section>
    );
  }

  const active = list[index] || list[0];

  return (
    <section className="section testimonial-section" aria-labelledby="testimonials-title">
      <div className="container">
        <div className="section-head" data-reveal>
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="testimonials-title">{title}</h2>
          </div>
        </div>

        <div
          className={`testimonial-showcase${paused ? ' is-paused' : ''}`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setPaused(false);
            }
          }}
        >
          <div
            className="testimonial-stage"
            aria-live="polite"
            aria-atomic="true"
            aria-roledescription="carousel"
            aria-label={title}
          >
            {list.map((photo, photoIndex) => {
              const isActive = photoIndex === index;
              return (
                <figure
                  key={photo.id}
                  className={`testimonial-slide${isActive ? ' is-active' : ''}`}
                  aria-hidden={!isActive}
                  style={{
                    transitionDuration: reducedMotion ? '0ms' : `${FADE_MS}ms`,
                  }}
                >
                  <img
                    src={photo.url}
                    alt={
                      isActive
                        ? photo.caption || `Customer review screenshot ${photoIndex + 1} of ${count}`
                        : ''
                    }
                    decoding="async"
                    loading={photoIndex === 0 ? 'eager' : 'lazy'}
                  />
                </figure>
              );
            })}
          </div>

          {active?.caption ? <p className="testimonial-caption">{active.caption}</p> : null}

          {count > 1 ? (
            <div className="testimonial-dots" role="tablist" aria-label="Testimonial screenshots">
              {list.map((photo, dot) => (
                <button
                  key={photo.id}
                  type="button"
                  role="tab"
                  aria-selected={dot === index}
                  className={`testimonial-dot${dot === index ? ' is-active' : ''}`}
                  aria-label={`Show screenshot ${dot + 1} of ${count}`}
                  onClick={() => setIndex(dot)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
