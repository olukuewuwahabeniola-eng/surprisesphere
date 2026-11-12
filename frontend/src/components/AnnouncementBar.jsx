export default function AnnouncementBar({ message }) {
  const text = message || 'Fast & Reliable Delivery Across Nigeria  |  Shop with Confidence';

  return (
    <div className="announcement" role="region" aria-label="Store announcement">
      <div className="announcement-marquee" aria-hidden="true">
        <div className="announcement-track">
          <p>{text}</p>
          <p>{text}</p>
          <p>{text}</p>
          <p>{text}</p>
        </div>
      </div>
      <p className="sr-only">{text}</p>
    </div>
  );
}
