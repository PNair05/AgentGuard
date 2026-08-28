import { PRODUCT_BY_ID } from "./catalog";
import type { CartItem } from "./types";

export function getCartDetails(cart: CartItem[]) {
  const items = cart.flatMap((line) => {
    const product = PRODUCT_BY_ID.get(line.productId);
    if (!product) return [];
    return [{ ...line, product, lineTotal: product.price * line.quantity }];
  });

  return {
    items,
    total: items.reduce((sum, item) => sum + item.lineTotal, 0),
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    refundable: items.every((item) => item.product.refundable)
  };
}

export const cartFingerprint = (cart: CartItem[]) =>
  cart
    .map((item) => `${item.productId}:${item.quantity}`)
    .sort()
    .join("|");
