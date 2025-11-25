import { useState } from "react";
import IndianCurrency from "../components/IndianCurrency";

export default function OrderForm({
  products,
  customerName,
  setCustomerName,
  orderItems,
  setOrderItems,
  onPlaceOrder,
  loading,
  editingOrderId,
  onCancelEdit,
  message,
}) {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // --- Search Logic ---
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const text = value.toLowerCase();
    const filtered = products
      .filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(text);
        const barcodeMatch = p.barcode
          ? p.barcode.toString().includes(text)
          : false;
        return nameMatch || barcodeMatch;
      })
      .slice(0, 8);
    setSuggestions(filtered);
  };

  const addProductToOrder = (product) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item._id === product._id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          _id: product._id,
          name: product.name,
          barcode: product.barcode,
          price: product.price,
          quantity: 1,
          total: product.price,
        },
      ];
    });
    setSearchText("");
    setSuggestions([]);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      const trimmed = searchText.trim();
      if (!trimmed) return;

      const barcodeMatch = products.find(
        (p) => p.barcode && p.barcode.toString() === trimmed
      );
      if (barcodeMatch) {
        addProductToOrder(barcodeMatch);
        return;
      }
      if (suggestions.length > 0) {
        addProductToOrder(suggestions[0]);
      }
    }
  };

  // --- Item Modification ---
  const handleQuantityChange = (id, newQty) => {
    const qty = Number(newQty);
    if (isNaN(qty) || qty <= 0) return;
    setOrderItems((prev) =>
      prev.map((item) =>
        item._id === id
          ? {
              ...item,
              quantity: qty,
              total: qty * item.price,
            }
          : item
      )
    );
  };

  const handleRemoveItem = (id) => {
    setOrderItems((prev) => prev.filter((item) => item._id !== id));
  };

  const overallTotal = orderItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="card" style={{ padding: "20px" }}> 
  <h3 style={{ fontSize: "22px", marginBottom: "16px" }}>
    {editingOrderId ? "Edit Order" : "Create Bill"}
  </h3>

  <div className="addOrder">
    <p className="label" style={{ fontSize: "16px", marginBottom: "6px", fontWeight: "500" }}>
      Customer name
    </p>
    <input
      type="text"
      placeholder="Enter customer name"
      className="customerName"
      style={{
        fontSize: "16px",
        padding: "12px 14px", 
        width: "100%",
        maxWidth: "700px",
        height: "48px",
        border: "1px solid var(--border)", // Fixed
        background: "var(--bg)", // Fixed
        color: "var(--text)" // Fixed
      }}
      value={customerName}
      onChange={(e) => setCustomerName(e.target.value)}
    />

    <p className="label" style={{ marginTop: 16, fontSize: "16px", marginBottom: "6px", fontWeight: "500" }}>
      Product name or Barcode
    </p>
    <input
      type="text"
      placeholder="Type product name or barcode"
      className="customerName"
      style={{
        fontSize: "16px",
        padding: "12px 14px",
        width: "100%",
        maxWidth: "700px",
        height: "48px",
        border: "1px solid var(--border)", // Fixed
        background: "var(--bg)", // Fixed
        color: "var(--text)" // Fixed
      }}
      value={searchText}
      onChange={handleSearchChange}
      onKeyDown={handleSearchKeyDown}
    />

    {suggestions.length > 0 && (
      <div className="suggestionsBox" style={{ maxWidth: "700px" }}>
        {suggestions.map((p) => (
          <div
            key={p._id}
            className="suggestionItem"
            onClick={() => addProductToOrder(p)}
            style={{ padding: "10px 14px" }}
          >
            <div>
              <strong style={{ fontSize: "16px" }}>{p.name}</strong>{" "}
              {p.barcode && (
                <span style={{ fontSize: 13, color: "var(--muted)" }}>
                  (Barcode: {p.barcode})
                </span>
              )}
            </div>
            <div style={{ fontSize: 14 }}>
              <IndianCurrency amount={p.price} />
            </div>
          </div>
        ))}
      </div>
    )}
  </div>

  {orderItems.length > 0 && (
    <div className="orderItems" style={{ marginTop: "24px" }}>
      <h4 style={{ fontSize: "18px", marginBottom: "12px" }}>Selected Products</h4>
      <div className="table-wrapper">
        <table className="simple-table" style={{ fontSize: "16px" }}>
          <thead>
            <tr style={{ background: "var(--accent-soft)" }}> {/* Fixed */}
              <th style={{ padding: "12px" }}>#</th>
              <th style={{ padding: "12px" }}>Name</th>
              <th style={{ padding: "12px" }}>Barcode</th>
              <th style={{ padding: "12px" }}>Price</th>
              <th style={{ padding: "12px" }}>Qty</th>
              <th style={{ padding: "12px" }}>Total</th>
              <th style={{ padding: "12px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.map((item, index) => (
              <tr key={item._id} style={{ borderBottom: "1px solid var(--border)" }}> {/* Fixed */}
                <td style={{ padding: "12px" }}>{index + 1}</td>
                <td style={{ padding: "12px", fontWeight: "500" }}>{item.name}</td>
                <td style={{ padding: "12px", color: "var(--muted)" }}>{item.barcode}</td>
                <td style={{ padding: "12px" }}>
                  <IndianCurrency amount={item.price} />
                </td>
                
                <td style={{ padding: "12px" }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "6px",
                    background: "var(--bg)", // Fixed
                    padding: "4px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)", // Fixed
                    width: "fit-content"
                  }}>
                    <button
                      onClick={() => handleQuantityChange(item._id, Number(item.quantity) - 1)}
                      disabled={item.quantity <= 1}
                      style={{
                        padding: "0",
                        width: "32px",
                        height: "32px",
                        fontSize: "20px",
                        fontWeight: "bold",
                        background: item.quantity <= 1 ? "var(--muted)" : "#ef4444", 
                        color: "white",
                        borderRadius: "6px",
                        border: "none",
                        cursor: item.quantity <= 1 ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}
                    >
                      −
                    </button>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item._id, e.target.value)}
                      style={{
                        width: "45px",
                        textAlign: "center",
                        fontSize: "16px",
                        fontWeight: "bold",
                        height: "32px",
                        border: "none",
                        background: "transparent",
                        color: "var(--text)", // Fixed
                        outline: "none"
                      }}
                    />

                    <button
                      onClick={() => handleQuantityChange(item._id, Number(item.quantity) + 1)}
                      style={{
                        padding: "0",
                        width: "32px",
                        height: "32px",
                        fontSize: "20px",
                        fontWeight: "bold",
                        background: "#10b981", 
                        color: "white",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}
                    >
                      +
                    </button>
                  </div>
                </td>

                <td style={{ padding: "12px", fontWeight: "bold" }}>
                  <IndianCurrency amount={item.total} />
                </td>
                <td style={{ padding: "12px" }}>
                  <button
                    onClick={() => handleRemoveItem(item._id)}
                    className="danger"
                    style={{
                      padding: "8px 14px",
                      fontSize: "14px",
                      borderRadius: "8px",
                      backgroundColor: "#fee2e2",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                      fontWeight: "600"
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ textAlign: "right", marginTop: 16, fontSize: "20px" }}>
        <strong>
          Overall Total: <IndianCurrency amount={overallTotal} />
        </strong>
      </p>

      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <button
          onClick={onPlaceOrder}
          disabled={loading || orderItems.length === 0}
          style={{ padding: "12px 24px", fontSize: "16px", fontWeight: "600" }}
        >
          {loading ? "Saving..." : editingOrderId ? "Update Order" : "Place Order"}
        </button>
        {editingOrderId && (
          <button
            type="button"
            className="secondary"
            onClick={onCancelEdit}
            style={{ padding: "12px 24px", fontSize: "16px" }}
          >
            Cancel Edit
          </button>
        )}
      </div>
    </div>
  )}

  {message && <p className="info-text" style={{ fontSize: "16px" }}>{message}</p>}
</div>
  );
}