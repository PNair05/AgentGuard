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
        <div className="product-meta">
          <span>{product.category}</span>
          <span className="rating">★ {product.rating} <small>({product.reviews})</small></span>
        </div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="refund-line">
          <span className={product.refundable ? "refundable" : "nonrefundable"}>
            {product.refundable ? <CheckIcon /> : null}{product.refundLabel}
          </span>
        </div>
        <div className="product-footer">
          <strong>{currency.format(product.price)}</strong>
          <button className={inCart ? "button secondary compact" : "button dark compact"} onClick={onAdd}>
            {inCart ? <CheckIcon /> : <CartIcon />}{inCart ? "Add another" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
