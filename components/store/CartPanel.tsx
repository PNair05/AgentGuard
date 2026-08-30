import { CartIcon, ChevronIcon, SparklesIcon, TrashIcon } from "@/components/icons";
import { useAgentGuardStore } from "@/lib/store/app-context";
import { getCartDetails } from "@/lib/store/selectors";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function CartPanel({ onViewActivity }: { onViewActivity: () => void }) {
  const { policy, snapshot, updateCartQuantity, removeFromCart } = useAgentGuardStore();
  const cart = getCartDetails(snapshot.cart);
  const latestOrder = snapshot.orders[0];

  return (
    <aside className="cart-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker"><CartIcon /> Same-day demo cart</span>
          <h2>Your cart</h2>
        </div>
        <span className="count-badge">{cart.count}</span>
      </div>

      {cart.items.length === 0 ? (
        <div className="empty-cart">
          <span className="empty-cart-icon"><CartIcon /></span>
          <h3>{latestOrder ? "Order placed" : "Your cart is clear"}</h3>
          <p>{latestOrder ? `${latestOrder.id} is confirmed. checkout_cart is now unavailable.` : "Add a product and checkout_cart will appear for the agent."}</p>
          {latestOrder ? <button className="text-button" onClick={onViewActivity}>View guard activity <ChevronIcon /></button> : null}
        </div>
      ) : (
        <>
          <div className="cart-lines">
            {cart.items.map(({ product, quantity, lineTotal }) => (
              <div className="cart-line" key={product.id}>
                <div className={`cart-thumb ${product.accent}`}>{product.name.slice(0, 1)}</div>
                <div className="cart-line-copy">
                  <strong>{product.name}</strong>
                  <span>{currency.format(lineTotal)}</span>
                  <div className="quantity-control" aria-label={`Quantity of ${product.name}`}>
                    <button onClick={() => updateCartQuantity(product.id, quantity - 1)} aria-label="Decrease quantity">−</button>
                    <span>{quantity}</span>
                    <button onClick={() => updateCartQuantity(product.id, quantity + 1)} aria-label="Increase quantity">+</button>
                  </div>
                </div>
                <button className="icon-button" onClick={() => removeFromCart(product.id)} aria-label={`Remove ${product.name}`}><TrashIcon /></button>
              </div>
            ))}
          </div>
          <div className="fulfillment-note"><strong>Ready for checkout</strong><span>Fictional pickup · Free</span></div>
          <div className="cart-total-row"><span>Estimated total</span><strong>{currency.format(cart.total)}</strong></div>
          <div className="agent-ready-card">
            <span className="ready-icon"><SparklesIcon /></span>
            <div><strong>Agent checkout ready</strong><p>Ask your browser agent to buy the cart. AgentGuard will evaluate this exact total.</p></div>
          </div>
          <p className="cart-security-note">No price is accepted from the agent. The cart is the source of truth.</p>
        </>
      )}

      <div className="session-meter">
        <div><span>Session spend</span><strong>{currency.format(snapshot.sessionSpent)}</strong></div>
        <div className="meter-track"><span style={{ width: `${Math.min(100, (snapshot.sessionSpent / Math.max(1, policy.sessionSpendLimit)) * 100)}%` }} /></div>
      </div>
    </aside>
  );
}
