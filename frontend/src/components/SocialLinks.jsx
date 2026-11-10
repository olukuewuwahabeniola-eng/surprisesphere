function SocialItem({ href, label }) {
  if (!href) {
    return <span>{label}</span>;
  }

  return (
    <a href={href} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

export default function SocialLinks({ className = 'social-links' }) {
  const tiktok = import.meta.env.VITE_TIKTOK_URL;
  const whatsapp = import.meta.env.VITE_WHATSAPP_URL;

  return (
    <p className={className}>
      <SocialItem href={tiktok} label="TikTok" />
      <span aria-hidden="true"> · </span>
      <SocialItem href={whatsapp} label="WhatsApp" />
    </p>
  );
}
