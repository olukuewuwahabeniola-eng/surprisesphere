import { formatNaira } from './money';

export function cartLineKey(item) {
  return `${item.id}::${item.size || ''}::${item.colour || ''}`;
}

export function lineSubtotal(item) {
  return Number(item.price || 0) * Number(item.qty || 0);
}

function variationLines(item) {
  const lines = [];
  if (item.colour) {
    lines.push(`Colour: ${item.colour}`);
  }
  if (item.size) {
    lines.push(`Size: ${item.size}`);
  }
  return lines;
}

export function buildWhatsAppOrderMessage(cart, grandTotal) {
  const lines = [
    'Hello Surprise Fashion Sphere,',
    '',
    'I would like to order the following:',
    '',
  ];

  cart.forEach((item, index) => {
    lines.push(`${index + 1}. Product: ${item.name}`);
    variationLines(item).forEach((line) => {
      lines.push(`   ${line}`);
    });
    lines.push(`   Quantity: ${item.qty}`);
    lines.push(`   Price: ${formatNaira(item.price)}`);
    if (Number(item.qty) > 1) {
      lines.push(`   Subtotal: ${formatNaira(lineSubtotal(item))}`);
    }
    lines.push('');
  });

  lines.push(`Grand total: ${formatNaira(grandTotal)}`);
  lines.push('');
  lines.push(
    'Please confirm product availability and share payment and delivery instructions. Thank you.',
  );

  return lines.join('\n');
}

export function buildWhatsAppOrderUrl(whatsappNumber, cart, grandTotal) {
  const digits = String(whatsappNumber || '').replace(/\D/g, '');
  if (!digits || !cart.length) {
    return '';
  }
  const text = buildWhatsAppOrderMessage(cart, grandTotal);
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppProductOrderUrl(whatsappNumber, productLine) {
  if (!productLine) {
    return '';
  }
  const cart = [productLine];
  const total = lineSubtotal(productLine);
  return buildWhatsAppOrderUrl(whatsappNumber, cart, total);
}
