import logo from "../public/img/logo.png";
import IndianCurrency from "../components/IndianCurrency";

const SHOP_NAME = import.meta.env.VITE_SHOP_NAME || "AK Shop";
const SHOP_ADDRESS = import.meta.env.VITE_SHOP_ADDRESS || "Nil";
const SHOP_PHONE = import.meta.env.VITE_SHOP_PHONE || "Nil";
const DEV_COMPANY = import.meta.env.VITE_DEV_COMPANY_NAME || "Nil";
const DEV_WEB=import.meta.env.VITE_DEV_WEB || "Nil"

export default function BillPreview({ order, onPrint }) {
  if (!order) return null;

  return (
    <div className="bill-container">
      <h3>Bill Preview (Smart Wrap)</h3>
      <button onClick={onPrint} style={{ marginBottom: "15px" }}>
        Print 58mm Bill
      </button>

      {/* Bill Slip */}
      <div className="bill-slip" id="bill-slip">
        
        {/* Header */}
        <div className="bill-header">
          {logo && <img src={logo} alt="logo" className="bill-logo" />}
          <h2 className="shop-name">{SHOP_NAME}</h2>
          <p className="shop-address">{SHOP_ADDRESS}</p>
          <p className="shop-phone">Ph: {SHOP_PHONE}</p>
        </div>

        <div className="dotted-line"></div>

        {/* Meta Info */}
        <div className="bill-meta">
          <div className="flex-row">
            <span>NO: <b>{order.sno}</b></span>
            <span>{new Date(order.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
          <div className="flex-row">
             <span>TO: <b>{order.customerName || "Walk-in"}</b></span>
             <span>{new Date(order.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        </div>

        <div className="dotted-line"></div>

        {/* Items List */}
        <div className="bill-items">
          <div className="items-header flex-row">
            <span>ITEM</span>
            <span>TOTAL</span>
          </div>
          <div className="solid-line"></div>

          {order.products?.map((p, idx) => (
            <div key={idx} className="item-row">
              {/* Name */}
              <div className="item-name">{p.name}</div>
              
              {/* Qty & Total (Smart Layout) */}
              <div className="item-numbers">
                <div className="qty-rate">
                   {p.quantity} x <IndianCurrency amount={p.price} />
                </div>
                {/* Total will wrap to next line if needed */}
                <div className="line-total">
                  <IndianCurrency amount={p.total} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="solid-line"></div>

        {/* Grand Total */}
        <div className="total-section">
          <div className="total-label">Grand Total</div>
          <div className="total-amount">
            <IndianCurrency amount={order.overallTotal}/>/-
          </div>
        </div>

        <div className="dotted-line"></div>

        {/* Footer */}
        <div className="bill-footer">
          <p>Thank you! Visit again</p>
          <p className="dev-credit">Soft by {DEV_COMPANY}</p>
          <p className="dev-credit">{DEV_WEB}</p>
        </div>
      </div>
    </div>
  );
}