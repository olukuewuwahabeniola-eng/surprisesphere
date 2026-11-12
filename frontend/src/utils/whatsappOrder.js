import { formatNaira } from './money';

export function cartLineKey(item) {
  return `${item.id}::${item.size || ''}::${item.colour || ''}`;
}

export function lineSubtotal(item) {
  return Number(item.price || 0) * Number(item.qty || 0);
}

function variationLabel(item) {
  const parts = [];
  if (item.size) {
    parts.push(`Size: ${item.size}`);
  }
  if (item.colour) {
    parts.push(`Colour: ${item.colour}`);
  }
  return parts.join(' | ');
}

export function buildWhatsAppOrderMessage(cart, grandTotal) {
  const lines = [
    'Hello Surprise Fashion Sphere,',
    '',
    'I would like to order the following:',
    '',
  ];

  cart.forEach((item, index) => {
    const variation = variationLabel(item);
    lines.push(`${index + 1}. ${item.name}`);
    if (variation) {
      lines.push(`   ${variation}`);
    }
    lines.push(`   Qty: ${item.qty}`);
    lines.push(`   Price: ${formatNaira(item.price)} each`);
    lines.push(`   Subtotal: ${formatNaira(lineSubtotal(item))}`);
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
