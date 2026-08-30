import { CartIcon, CheckIcon } from "@/components/icons";
import type { Product } from "@/lib/store/types";
import { ProductArtwork } from "./ProductArtwork";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function ProductCard({
  product,
  inCart,
  onAdd
}: {
  product: Product;
  inCart: boolean;
  onAdd: () => void;
}) {
  return (
    <article className="product-card">
      <div className={`product-art ${product.accent}`}>
        <span className="product-eyebrow">{product.eyebrow}</span>
        <ProductArtwork visual={product.visual} />
      </div>
      <div className="product-copy">
        <span className="product-brand">GuardMart exclusive</span>
        <h3>{product.name}</h3>
        <div className="product-meta"><span className="rating">★ {product.rating} <small>({product.reviews})</small></span><span>{product.category}</span></div>
        <p>{product.description}</p>
        <div className="refund-line">
          <span className={product.refundable ? "refundable" : "nonrefundable"}>
            {product.refundable ? <CheckIcon /> : null}{product.refundLabel}
          </span>
        </div>
        <div className="product-footer">
          <div className="price-lockup"><strong>{currency.format(product.price)}</strong><small>when purchased in app</small></div>
          <button className={inCart ? "button secondary compact" : "button dark compact"} onClick={onAdd}>
            {inCart ? <CheckIcon /> : <CartIcon />}{inCart ? "Add another" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
