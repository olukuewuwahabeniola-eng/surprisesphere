export default function TestimonialGallery({
  photos = [],
  title = 'Loved by Our Customers',
  eyebrow = 'Testimonials',
  emptyMessage = '',
}) {
  if (!Array.isArray(photos) || photos.length === 0) {
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

  return (
    <section className="section testimonial-section" aria-labelledby="testimonials-title">
      <div className="container">
        <div className="section-head" data-reveal>
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="testimonials-title">{title}</h2>
          </div>
        </div>
        <div className="testimonial-gallery">
          {photos.map((photo) => (
            <figure key={photo.id} className="testimonial-card" data-reveal>
              <img src={photo.url} alt={photo.caption || 'Customer review screenshot'} />
              {photo.caption ? <figcaption>{photo.caption}</figcaption> : null}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
