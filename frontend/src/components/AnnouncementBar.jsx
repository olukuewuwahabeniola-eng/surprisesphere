import SocialLinks from './SocialLinks';

export default function AnnouncementBar({ message }) {
  return (
    <div className="announcement">
      <div className="announcement-inner">
        <p>{message || 'Fast & Reliable Delivery Across Nigeria  |  Shop with Confidence'}</p>
        <SocialLinks />
      </div>
    </div>
  );
}
