// Single source of truth for order pricing math.
// Used by:
//  - server: /api/orders POST (authoritative totals stored on the Order)
//  - client: cart and checkout summaries (preview)
//
// `lines` is an array of { price, quantity, delivery, tax } where:
//   - price:    unit price (post-discount price the customer actually pays)
//   - quantity: number of units
//   - delivery: { free?: boolean, fee?: number } — admin-controlled on each Product
//   - tax:      { rate?: number, included?: boolean } — admin-controlled
//
// Returns:
//   itemsPrice, shippingPrice, taxPrice, totalPrice
//
// Conventions:
//  - Shipping: if EVERY item ships free we charge 0; otherwise we charge the
//    largest single per-product fee (one parcel, one delivery — the customer
//    is not double-billed for combining items).
//  - Tax: each item's `tax.rate` is applied to its line subtotal. If the
//    product price is already tax-inclusive we don't add tax for that line.

export function computeOrderTotals(lines) {
  let itemsPrice = 0;
  let taxPrice = 0;
  let allFreeDelivery = true;
  let maxDeliveryFee = 0;

  for (const line of lines) {
    const qty = Number(line.quantity) || 0;
    const unit = Number(line.price) || 0;
    const subtotal = unit * qty;
    itemsPrice += subtotal;

    const tx = line.tax || {};
    const rate = Number(tx.rate) || 0;
    const included = tx.included !== false; // default to inclusive when admin didn't set
    if (!included && rate > 0) {
      taxPrice += (subtotal * rate) / 100;
    }

    const d = line.delivery || {};
    if (d.free) {
      // contributes nothing to shipping
    } else {
      allFreeDelivery = false;
      const fee = Number(d.fee) || 0;
      if (fee > maxDeliveryFee) maxDeliveryFee = fee;
    }
  }

  const shippingPrice = allFreeDelivery ? 0 : maxDeliveryFee;

  // Round to whole rupees for currency display
  itemsPrice = Math.round(itemsPrice);
  taxPrice = Math.round(taxPrice);
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  return { itemsPrice, shippingPrice, taxPrice, totalPrice };
}
