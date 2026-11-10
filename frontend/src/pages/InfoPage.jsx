import { Link, useParams } from 'react-router-dom';

const pages = {
  about: {
    eyebrow: 'The shop',
    title: 'About Us',
    paragraphs: [
      'Surprise Fashion Sphere is a Nigerian fashion shop for bags, footwear, headwear, autogele, clothing and accessories.',
      'Your beauty is our priority.',
      'A studio address and direct phone line will be added here when the business publishes them.',
    ],
  },
  faqs: {
    eyebrow: 'Customer care',
    title: 'FAQs',
    paragraphs: [
      'You can browse the homepage, search the pieces shown there, and keep a bag or wishlist on this device.',
      'Customer accounts, the full catalogue, delivery fees and online payment are not open yet.',
      'When payment opens, an order will be marked paid only after the payment is verified. This page does not take payment.',
    ],
  },
  shipping: {
    eyebrow: 'Customer care',
    title: 'Shipping & Delivery',
    paragraphs: [
      'Delivery across Nigeria is part of how the shop is meant to work.',
      'Fees, cities and timelines are not listed yet, because those rates have not been set.',
      'A delivery charge will be shown at checkout before any payment is taken.',
    ],
  },
  returns: {
    eyebrow: 'Customer care',
    title: 'Returns & Exchanges',
    paragraphs: [
      'A returns and exchanges policy will be published before the shop takes paid orders.',
      'No return window is offered from this preview.',
    ],
  },
  terms: {
    eyebrow: 'Customer care',
    title: 'Terms & Conditions',
    paragraphs: [
      'This website is the Surprise Fashion Sphere shopfront.',
      'Adding a piece to the bag on this device does not place an order and does not take payment.',
      'Prices shown are in Nigerian naira. The full terms will be completed before orders are accepted.',
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
