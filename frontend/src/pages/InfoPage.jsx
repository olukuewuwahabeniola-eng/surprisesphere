import { Link, useParams } from 'react-router-dom';

const pages = {
  about: {
    eyebrow: 'The shop',
    title: 'About Us',
    paragraphs: [
      'Surprise Fashion Sphere is a Nigerian fashion shop for bags, footwear, headwear, autogele, clothing and accessories.',
      'Your beauty is our priority.',
      'Orders are placed through WhatsApp from your bag. The shop confirms availability, then shares payment and delivery arrangements.',
    ],
  },
  faqs: {
    eyebrow: 'Customer care',
    title: 'FAQs',
    paragraphs: [
      'You can browse the shop, add pieces to your bag, adjust quantities and remove items on this device.',
      'When you are ready, use Proceed to Order on WhatsApp. That sends your bag details to the store.',
      'This website does not process online payments. Payment and delivery are arranged after the shop confirms your WhatsApp enquiry.',
    ],
  },
  shipping: {
    eyebrow: 'Customer care',
    title: 'Shipping & Delivery',
    paragraphs: [
      'Delivery across Nigeria is part of how the shop works.',
      'Fees, cities and timelines are confirmed on WhatsApp after your order enquiry.',
      'No delivery charge is taken on this website.',
    ],
  },
  returns: {
    eyebrow: 'Customer care',
    title: 'Returns & Exchanges',
    paragraphs: [
      'Returns and exchanges are handled directly with the shop after an order is confirmed on WhatsApp.',
      'Ask for the current returns window when the store shares payment and delivery instructions.',
    ],
  },
  terms: {
    eyebrow: 'Customer care',
    title: 'Terms & Conditions',
    paragraphs: [
      'This website is the Surprise Fashion Sphere shopfront.',
      'Adding pieces to your bag does not place an order and does not take payment.',
      'Opening WhatsApp with your bag details is an enquiry. The shop confirms availability before payment and delivery are arranged.',
      'Prices shown are in Nigerian naira.',
    ],
  },
  missing: {
    eyebrow: 'Surprise Fashion Sphere',
    title: 'That page is not here',
    paragraphs: ['This address is not part of the shop yet.'],
  },
};

export default function InfoPage({ slug }) {
  const params = useParams();
  const page = pages[slug || params.slug] || pages.missing;

  return (
    <article className="plain-page">
      <div className="container narrow">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{page.title}</h1>
        {page.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <Link className="button button-wine" to="/">
          Back to the shop
        </Link>
      </div>
    </article>
  );
}
