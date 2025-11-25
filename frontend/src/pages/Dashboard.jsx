import { useEffect, useRef, useState } from "react";
import api from "../api";
import BillPreview from "./BillPreview"; // Import separate component
import IndianCurrency from "../components/IndianCurrency";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTodayOrders, setShowTodayOrders] = useState(false);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [allOrders, setAllOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // 🔹 Refs for Scrolling
  const billRef = useRef(null);      // Scroll to Bill
  const todayRef = useRef(null);     // Scroll to Today's Orders
  const allOrdersRef = useRef(null); // Scroll to All Orders

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/dashboard");
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllOrders = async () => {
    try {
      const res = await api.get("/order");
      setAllOrders(res.data.orders || res.data.order || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleTodayOrders = () => {
    const newState = !showTodayOrders;
    setShowTodayOrders(newState);
    setShowAllOrders(false);
    setSelectedOrder(null);

    // Scroll Logic
    if (newState) {
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const handleToggleAllOrders = () => {
    const newState = !showAllOrders;
    setShowAllOrders(newState);
    setShowTodayOrders(false);
    setSelectedOrder(null);

    if (newState && !allOrders.length) {
      fetchAllOrders();
    }

    // Scroll Logic
    if (newState) {
      setTimeout(() => {
        allOrdersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  // 🔹 helper: row click → set order + scroll to bill
  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    // small delay so React first renders bill, then scroll
    setTimeout(() => {
      billRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handlePrintBill = () => {
    window.print();
  };

  if (loading) {
    return <div className="card">Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="card">No dashboard data.</div>;
  }

  const { today, overall, monthly, yearly, topProducts, categorySales } = data;
  const todayOrders = today?.orders || [];

  const currentYearStats =
    yearly?.data?.find((y) => y.year === monthly?.year) || null;

  return (
   <div className="page" style={{ paddingBottom: "40px" }}>
  <h2 style={{ fontSize: "28px", marginBottom: "24px", fontWeight: "800", letterSpacing: "-0.5px", color: "var(--text)" }}>
    Dashboard Overview
  </h2>

  {/* Summary cards */}
  <div className="grid grid-3" style={{ gap: "24px" }}>
    
    {/* Card 1: Today's Revenue - Blue Theme */}
    <div
      className="card clickable-card"
      onClick={handleToggleTodayOrders}
      style={{
        position: "relative",
        overflow: "hidden",
        background: "var(--bg-card)", // Fixed for Dark Mode
        border: "1px solid var(--border)",
        borderTop: "4px solid #3b82f6", 
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 10px 30px -10px rgba(59, 130, 246, 0.15)", 
        transition: "all 0.3s ease"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 20px 40px -10px rgba(59, 130, 246, 0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(59, 130, 246, 0.15)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <h3 style={{ fontSize: "16px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 10px 0" }}>Today's Revenue</h3>
          <p className="big-number" style={{ fontSize: "36px", fontWeight: "800", color: "var(--text)", margin: 0 }}>
             <span style={{ color: "#3b82f6" }}><IndianCurrency amount={today?.revenue ?? 0} /></span>
          </p>
        </div>
        <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: "8px 12px", borderRadius: "12px", color: "#3b82f6", fontWeight: "bold", fontSize: "14px" }}>
          {today?.ordersCount ?? 0} Orders
        </div>
      </div>
      <p className="hint-text" style={{ marginTop: "20px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)" }}>
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: showTodayOrders ? "#ef4444" : "#22c55e" }}></span>
        Click to {showTodayOrders ? "hide" : "view"} details
      </p>
    </div>

    {/* Card 2: Overall Revenue - Purple Theme */}
    <div
      className="card clickable-card"
      onClick={handleToggleAllOrders}
      style={{
        position: "relative",
        overflow: "hidden",
        background: "var(--bg-card)", // Fixed for Dark Mode
        border: "1px solid var(--border)",
        borderTop: "4px solid #8b5cf6", 
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 10px 30px -10px rgba(139, 92, 246, 0.15)",
        transition: "all 0.3s ease"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 20px 40px -10px rgba(139, 92, 246, 0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(139, 92, 246, 0.15)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <h3 style={{ fontSize: "16px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 10px 0" }}>Overall Revenue</h3>
          <p className="big-number" style={{ fontSize: "36px", fontWeight: "800", color: "var(--text)", margin: 0 }}>
            <span style={{ color: "#8b5cf6" }}><IndianCurrency amount={overall?.totalRevenue ?? 0} /></span>
          </p>
        </div>
        <div style={{ background: "rgba(139, 92, 246, 0.1)", padding: "8px 12px", borderRadius: "12px", color: "#8b5cf6", fontWeight: "bold", fontSize: "14px" }}>
          All Time
        </div>
      </div>
      <p style={{ marginTop: "10px", fontWeight: "500", color: "var(--text)" }}>{overall?.totalOrders ?? 0} Total Orders</p>
      <p className="hint-text" style={{ marginTop: "5px", fontSize: "14px", color: "var(--muted)" }}>
        Click to {showAllOrders ? "hide" : "view"} history
      </p>
    </div>

    {/* Card 3: Year Stats - Green Theme */}
    <div className="card" style={{
        background: "var(--bg-card)", // Fixed for Dark Mode
        border: "1px solid var(--border)",
        borderTop: "4px solid #10b981", 
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 10px 30px -10px rgba(16, 185, 129, 0.15)"
      }}>
      <h3 style={{ fontSize: "16px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 15px 0" }}>Current Year ({monthly?.year})</h3>
      
      <div style={{ marginBottom: "15px" }}>
        <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>Revenue</p>
        <p style={{ fontSize: "28px", fontWeight: "800", color: "#10b981", margin: 0 }}>
          <IndianCurrency amount={currentYearStats?.revenue ?? 0} />
        </p>
      </div>
      
      <div>
        <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>Orders</p>
        <p style={{ fontSize: "24px", fontWeight: "700", color: "var(--text)", margin: 0 }}>
          {currentYearStats?.orders ?? 0}
        </p>
      </div>
    </div>
  </div>

  {/* Today Orders table */}
  {showTodayOrders && (
    <div className="card" ref={todayRef} style={{ marginTop: "30px", padding: "24px", borderRadius: "16px", background: "var(--bg-card)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
      <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "20px", color: "var(--text)" }}>Today&apos;s Orders</h3>
      {todayOrders.length ? (
        <div className="table-wrapper" style={{ borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
          <table className="simple-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--accent-soft)", textAlign: "left" }}>
                <th style={{ padding: "16px", fontSize: "13px", textTransform: "uppercase", color: "var(--muted)", fontWeight: "600", letterSpacing: "0.5px" }}>#</th>
                <th style={{ padding: "16px", fontSize: "13px", textTransform: "uppercase", color: "var(--muted)", fontWeight: "600", letterSpacing: "0.5px" }}>Bill No</th>
                <th style={{ padding: "16px", fontSize: "13px", textTransform: "uppercase", color: "var(--muted)", fontWeight: "600", letterSpacing: "0.5px" }}>Customer</th>
                <th style={{ padding: "16px", fontSize: "13px", textTransform: "uppercase", color: "var(--muted)", fontWeight: "600", letterSpacing: "0.5px" }}>Amount</th>
                <th style={{ padding: "16px", fontSize: "13px", textTransform: "uppercase", color: "var(--muted)", fontWeight: "600", letterSpacing: "0.5px" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {todayOrders.map((o, idx) => (
                <tr
                  key={o._id || idx}
                  className="clickable-row"
                  onClick={() => handleSelectOrder(o)}
                  style={{ borderTop: "1px solid var(--border)", transition: "background 0.2s" }}
                >
                  <td style={{ padding: "16px", color: "var(--muted)" }}>{idx + 1}</td>
                  <td style={{ padding: "16px", fontWeight: "600", color: "var(--accent)" }}>{o.sno}</td>
                  <td style={{ padding: "16px", fontWeight: "500", color: "var(--text)" }}>{o.customerName || <span style={{fontStyle:"italic", color:"var(--muted)"}}>Walk-in</span>}</td>
                  <td style={{ padding: "16px", fontWeight: "700", color: "var(--text)" }}><IndianCurrency amount={o.overallTotal ?? o.totalAmount} /></td>
                  <td style={{ padding: "16px", color: "var(--muted)", fontSize: "14px" }}>
                    {o.createdAt
                      ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : o.date
                      ? new Date(o.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)", background: "var(--accent-soft)", borderRadius: "12px" }}>
          <p style={{fontSize: "16px"}}>No orders placed today.</p>
        </div>
      )}
    </div>
  )}

  {/* All orders table */}
  {showAllOrders && (
    <div className="card" ref={allOrdersRef} style={{ marginTop: "30px", padding: "24px", borderRadius: "16px", background: "var(--bg-card)" }}>
      <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "20px", color: "var(--text)" }}>All Orders History</h3>
      {allOrders.length ? (
        <div className="table-wrapper" style={{ borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
          <table className="simple-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--accent-soft)" }}>
                <th style={{ padding: "16px", fontSize: "13px", textTransform: "uppercase", color: "var(--muted)" }}>#</th>
                <th style={{ padding: "16px", fontSize: "13px", textTransform: "uppercase", color: "var(--muted)" }}>Bill No</th>
                <th style={{ padding: "16px", fontSize: "13px", textTransform: "uppercase", color: "var(--muted)" }}>Customer</th>
                <th style={{ padding: "16px", fontSize: "13px", textTransform: "uppercase", color: "var(--muted)" }}>Total</th>
                <th style={{ padding: "16px", fontSize: "13px", textTransform: "uppercase", color: "var(--muted)" }}>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.map((o, idx) => (
                <tr
                  key={o._id}
                  className="clickable-row"
                  onClick={() => handleSelectOrder(o)}
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <td style={{ padding: "16px", color: "var(--muted)" }}>{idx + 1}</td>
                  <td style={{ padding: "16px", fontWeight: "600", color: "var(--accent)" }}>{o.sno}</td>
                  <td style={{ padding: "16px", fontWeight: "500", color: "var(--text)" }}>{o.customerName || "Walk-in"}</td>
                  <td style={{ padding: "16px", fontWeight: "700", color: "var(--text)" }}><IndianCurrency amount={o.overallTotal} /></td>
                  <td style={{ padding: "16px", color: "var(--muted)", fontSize: "14px" }}>
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ color: "var(--text)" }}>No orders available.</p>
      )}
    </div>
  )}

  {/* Selected order bill preview */}
  {selectedOrder && (
    <div ref={billRef} style={{ marginTop: "30px", border: "2px dashed var(--accent)", borderRadius: "16px", padding: "20px", background: "var(--bg-card)" }}>
      <BillPreview 
        order={selectedOrder} 
        onPrint={handlePrintBill} 
      />
    </div>
  )}

  {/* Top products & category sales */}
  <div className="grid grid-2" style={{ gap: "24px", marginTop: "30px" }}>
    <div className="card" style={{ padding: "24px", borderRadius: "16px", height: "100%", background: "var(--bg-card)" }}>
      <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "var(--text)" }}>
        🔥 Top Products
      </h3>
      <div className="table-wrapper" style={{ maxHeight: "300px", overflowY: "auto" }}>
        <table className="simple-table" style={{ width: "100%" }}>
          <thead style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 1 }}>
            <tr style={{ borderBottom: "2px solid var(--border)" }}>
              <th style={{ padding: "12px", color: "var(--muted)" }}>Name</th>
              <th style={{ padding: "12px", color: "var(--muted)" }}>Sales</th>
              <th style={{ padding: "12px", color: "var(--muted)" }}>Stock</th>
            </tr>
          </thead>
          <tbody>
            {topProducts && topProducts.length ? (
              topProducts.map((p, i) => (
                <tr key={p.name} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px", fontWeight: "500", color: "var(--text)" }}>{i+1}. {p.name}</td>
                  <td style={{ padding: "12px", fontWeight: "700", color: "var(--text)" }}>{p.sales}</td>
                  <td style={{ padding: "12px", color: p.stock < 10 ? "#ef4444" : "var(--muted)" }}>{p.stock}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    <div className="card" style={{ padding: "24px", borderRadius: "16px", height: "100%", background: "var(--bg-card)" }}>
      <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "var(--text)" }}>
        📊 Category Sales
      </h3>
      <div className="table-wrapper" style={{ maxHeight: "300px", overflowY: "auto" }}>
        <table className="simple-table" style={{ width: "100%" }}>
          <thead style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 1 }}>
            <tr style={{ borderBottom: "2px solid var(--border)" }}>
              <th style={{ padding: "12px", color: "var(--muted)" }}>Category</th>
              <th style={{ padding: "12px", color: "var(--muted)" }}>Items</th>
              <th style={{ padding: "12px", color: "var(--muted)" }}>Rev</th>
            </tr>
          </thead>
          <tbody>
            {categorySales && categorySales.length ? (
              categorySales.map((c) => (
                <tr key={c.category} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px", fontWeight: "500", color: "var(--text)" }}>
                    <span style={{ padding: "4px 8px", background: "var(--accent-soft)", borderRadius: "6px", fontSize: "13px" }}>{c.category}</span>
                  </td>
                  <td style={{ padding: "12px", color: "var(--text)" }}>{c.itemsSold}</td>
                  <td style={{ padding: "12px", fontWeight: "600", color: "#10b981" }}><IndianCurrency amount={c.revenue}/></td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  {/* Monthly Sales Chart - FIXED AMOUNT DISPLAY */}
  {/* Monthly Sales Chart - CLEAN & MODERN */}
<div
  className="card"
  style={{
    marginTop: "30px",
    padding: "24px",
    borderRadius: "16px",
    background: "var(--bg-card)",
  }}
>
  <h3
    style={{
      fontSize: "20px",
      fontWeight: "700",
      marginBottom: "25px",
      color: "var(--text)",
    }}
  >
    📈 Monthly Sales Trend ({monthly?.year})
  </h3>

  {monthly?.data && monthly.data.length ? (
    (() => {
      const maxRevenue = Math.max(...monthly.data.map((x) => x.revenue));
      const MAX_BAR_HEIGHT = 240;

      return (
        <div
          className="bar-row"
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "22px",
            height: "380px",
            paddingTop: "40px",
            paddingBottom: "15px",
            overflowX: "auto",
          }}
        >
          {monthly.data.map((m, i) => {
            const monthIndex = (m.monthNumber || m.month || m.monthIndex) - 1;
            const monthName = MONTH_NAMES[monthIndex]?.substring(0, 3) || "N/A";

            // Auto Scaling
            const height = Math.max(
              15,
              Math.round((m.revenue / maxRevenue) * MAX_BAR_HEIGHT)
            );

            return (
              <div
                key={i}
                className="bar-item"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: "0 0 auto",
                  minWidth: "70px",
                }}
              >
                {/* Amount Label */}
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    marginBottom: "12px",
                    padding: "5px 10px",
                    color: "#1e40af",
                    background: "rgba(59, 130, 246, 0.08)",
                    borderRadius: "6px",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <IndianCurrency amount={m.revenue} />
                </div>

                {/* Bar */}
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-end",
                  }}
                >
                  <div
                    style={{
                      height: `${height}px`,
                      width: "38px",
                      background:
                        "linear-gradient(180deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)",
                      borderRadius: "12px 12px 0 0",
                      position: "relative",
                      boxShadow: "0px 4px 15px rgba(59, 130, 246, 0.35)",
                      transition: "height 0.8s cubic-bezier(0.25, 1, 0.5, 1)",
                    }}
                  >
                    {/* Shine */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "45%",
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, transparent 100%)",
                        borderRadius: "12px 12px 0 0",
                      }}
                    ></div>
                  </div>
                </div>

                {/* Month label */}
                <div
                  style={{
                    marginTop: "14px",
                    fontSize: "14px",
                    fontWeight: "600",
                    letterSpacing: "0.5px",
                    color: "var(--muted)",
                  }}
                >
                  {monthName}
                </div>
              </div>
            );
          })}
        </div>
      );
    })()
  ) : (
    <div
      style={{
        padding: "40px",
        textAlign: "center",
        color: "var(--muted)",
        background: "var(--accent-soft)",
        borderRadius: "12px",
      }}
    >
      <p>No monthly data available.</p>
    </div>
  )}
</div>


  <div className="card" style={{ marginTop: "30px", padding: "24px", borderRadius: "16px", background: "var(--bg-card)" }}>
    <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "15px", color: "var(--text)" }}>Yearly Archive</h3>
    <div className="table-wrapper">
      <table className="simple-table" style={{ width: "100%" }}>
        <thead>
          <tr style={{ background: "var(--accent-soft)" }}>
            <th style={{ padding: "12px", color: "var(--muted)" }}>Year</th>
            <th style={{ padding: "12px", color: "var(--muted)" }}>Orders</th>
            <th style={{ padding: "12px", color: "var(--muted)" }}>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {yearly?.data && yearly.data.length ? (
            yearly.data.map((y) => (
              <tr key={y.year} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px", fontWeight: "bold", color: "var(--text)" }}>{y.year}</td>
                <td style={{ padding: "12px", color: "var(--text)" }}>{y.orders}</td>
                <td style={{ padding: "12px", fontWeight: "600", color: "var(--text)" }}><IndianCurrency amount={y.revenue}/></td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>No data</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>
  );
}