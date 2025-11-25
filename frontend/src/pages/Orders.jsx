import { useEffect, useRef, useState } from "react";
import api from "../api";
import jsPDF from "jspdf";
import "jspdf-autotable";
import logo from "../public/img/logo.png";
import { useToast } from "../ToastProvider";
import ordersound from "../public/order.mp3";
import { useAuth } from "../AuthProvider";

// Import separate components
import OrderForm from "./OrderForm";
import BillPreview from "./BillPreview";

import IndianCurrency from "../components/IndianCurrency";

const SHOP_NAME = import.meta.env.VITE_SHOP_NAME || "AK Shop";
const SHOP_ADDRESS = import.meta.env.VITE_SHOP_ADDRESS || "Nil";
const SHOP_PHONE = import.meta.env.VITE_SHOP_PHONE || "Nil";

export default function Orders() {
  const toast = useToast();
  const { user } = useAuth();
  
  // Data State
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Form State
  const [customerName, setCustomerName] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  const [editingOrderId, setEditingOrderId] = useState(null);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [lastOrder, setLastOrder] = useState(null);

  // 🔹 Refs for Scrolling (Scroll Fix)
  const formRef = useRef(null); // Top Form
  const billRef = useRef(null); // Bottom Bill

  // 🔊 sound
  const orderSoundRef = useRef(null);

  useEffect(() => {
    orderSoundRef.current = new Audio(ordersound);
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/product");
      setProducts(res.data.products || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load products.");
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get("/order");
      let list = res.data.orders || res.data.order || [];
      // sort date DESC
      list = [...list].sort((a, b) => {
        const ad = new Date(a.createdAt || a.date || 0);
        const bd = new Date(b.createdAt || b.date || 0);
        return bd - ad;
      });
      setOrders(list);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load orders.");
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setOrderItems([]);
    setEditingOrderId(null);
    setMessage("");
  };

  // ---------- Place / Update order Logic ----------
  const handlePlaceOrder = async () => {
    try {
      setMessage("");
      if (!orderItems.length) {
        const msg = "Please add at least one product.";
        setMessage(msg);
        toast.error(msg);
        return;
      }

      setLoading(true);

      const payload = {
        customerName: customerName || null,
        products: orderItems.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
        })),
      };

      let res;
      const isEdit = Boolean(editingOrderId);

      if (isEdit) {
        res = await api.put(`/order/${editingOrderId}`, payload);
      } else {
        res = await api.post("/order", payload);
      }

      const orderFromApi =
        res.data.order || res.data.orderUpdate || res.data.updatedOrder;

      if (orderFromApi) {
        setLastOrder(orderFromApi);
        
        // 🔹 Scroll to Bill automatically after placing order
        setTimeout(() => {
          billRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }

      const successMsg = isEdit
        ? "Order updated successfully."
        : "Order placed successfully.";
      setMessage(successMsg);
      toast.success(successMsg);

      if (!isEdit && orderSoundRef.current) {
        try {
          orderSoundRef.current.currentTime = 0;
          orderSoundRef.current.play();
        } catch {
          // ignore
        }
      }

      resetForm();
      fetchOrders();
    } catch (e) {
      console.error(e);
      setMessage("Failed to save order.");
      toast.error("Failed to save order.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Edit existing order ----------
  const handleEditOrder = (order) => {
    setEditingOrderId(order._id);
    setCustomerName(order.customerName || "");
    const items = (order.products || []).map((p) => ({
      _id: p.productId || p.productId?._id || p._id,
      name: p.name,
      barcode: p.barcode,
      price: p.price,
      quantity: p.quantity,
      total: p.total,
    }));
    setOrderItems(items);
    setLastOrder(order);
    
    // 🔹 Scroll to Top (Form)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // ---------- Delete order ----------
  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) {
      return;
    }
    try {
      await api.delete(`/order/${id}`);
      toast.success("Order deleted.");
      if (lastOrder && lastOrder._id === id) {
        setLastOrder(null);
      }
      fetchOrders();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete order.");
    }
  };

  const handlePrintBill = () => {
    window.print();
  };

  const handleViewBill = (order) => {
    setLastOrder(order);
    
    // 🔹 Scroll to Bottom (Bill)
    setTimeout(() => {
      billRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // ---------- Download Handlers ----------
  const handleDownloadOrdersPdf = () => {
    if (!orders.length) {
      alert("No orders to download.");
      return;
    }
    const doc = new jsPDF();
    try {
      if (logo) doc.addImage(logo, "PNG", 10, 6, 18, 18);
    } catch (e) { console.warn("Logo add failed", e); }

    doc.setFontSize(14);
    doc.text(SHOP_NAME, 105, 14, { align: "center" });
    doc.setFontSize(10);
    doc.text(SHOP_ADDRESS, 105, 20, { align: "center" });
    doc.text(`Phone: ${SHOP_PHONE}`, 105, 26, { align: "center" });

    const rows = [];
    orders.forEach((order) => {
      const dateStr = order.createdAt
        ? new Date(order.createdAt).toLocaleString()
        : order.date
        ? new Date(order.date).toLocaleString()
        : "";

      if (order.products && order.products.length) {
        order.products.forEach((p) => {
          rows.push([
            order.sno,
            order.customerName || "Walk-in",
            dateStr,
            p.name,
            p.price,
            p.quantity,
            p.total,
          ]);
        });
      } else {
        rows.push([order.sno, order.customerName || "Walk-in", dateStr, "-", "-", "-", order.overallTotal]);
      }
    });

    doc.autoTable({
      startY: 32,
      head: [["Bill No", "Customer", "Date & Time", "Product", "Price", "Qty", "Total"]],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
      columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 30 }, 2: { cellWidth: 40 }, 3: { cellWidth: 40 }, 4: { cellWidth: 18 }, 5: { cellWidth: 12 }, 6: { cellWidth: 22 } },
    });
    doc.save("orders.pdf");
  };

  const handleDownloadOrdersExcel = () => {
    if (!orders.length) {
      alert("No orders to download.");
      return;
    }
    const header = ["Bill No", "Customer", "Date & Time", "Product", "Price", "Qty", "Total"];
    const rows = [];
    orders.forEach((order) => {
      const rawDate = order.createdAt || order.date;
      const dateStr = rawDate ? new Date(rawDate).toLocaleString().replace(/,/g, " ") : "";
      if (order.products && order.products.length) {
        order.products.forEach((p) => {
          rows.push([
            order.sno,
            (order.customerName || "Walk-in").replace(/,/g, " "),
            dateStr,
            p.name.replace(/,/g, " "),
            p.price,
            p.quantity,
            p.total,
          ]);
        });
      } else {
        rows.push([order.sno, (order.customerName || "Walk-in").replace(/,/g, " "), dateStr, "-", "-", "-", order.overallTotal]);
      }
    });
    const csvContent = [header, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "orders.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <h2>Bills / Orders</h2>

      {/* Component 1: Order Form */}
      {/* 🔹 WRAPPED IN DIV WITH REF for Scrolling */}
      <div ref={formRef}>
        <OrderForm
          products={products}
          customerName={customerName}
          setCustomerName={setCustomerName}
          orderItems={orderItems}
          setOrderItems={setOrderItems}
          onPlaceOrder={handlePlaceOrder}
          loading={loading}
          editingOrderId={editingOrderId}
          onCancelEdit={resetForm}
          message={message}
        />
      </div>

      {/* Component 2: Bill Preview */}
      {/* 🔹 WRAPPED IN DIV WITH REF for Scrolling */}
      <div ref={billRef}>
        <BillPreview 
          order={lastOrder} 
          onPrint={handlePrintBill} 
        />
      </div>

      {/* Order List Table */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3>All Orders</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={handleDownloadOrdersPdf}>Download PDF</button>
            <button className="secondary" onClick={handleDownloadOrdersExcel}>Download Excel</button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="simple-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Bill No</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length ? (
                orders.map((o, idx) => (
                  <tr key={o._id}>
                    <td>{idx + 1}</td>
                    <td>{o.sno}</td>
                    <td>{o.customerName || "Walk-in"}</td>
                    <td><IndianCurrency amount={o.overallTotal} /></td>
                    <td>
                      {o.createdAt
                        ? new Date(o.createdAt).toLocaleString()
                        : o.date
                        ? new Date(o.date).toLocaleString()
                        : ""}
                    </td>
                    <td>
                      <div className="table-actions">
                        {/* 🔹 View Bill click will now trigger scroll */}
                        <button onClick={() => handleViewBill(o)}>View Bill</button>
                        
                        {/* 🔹 Edit click will now trigger scroll */}
                        <button onClick={() => handleEditOrder(o)}>Edit</button>
                        
                        {user?.role === "admin" && (
                          <button className="danger" onClick={() => handleDeleteOrder(o._id)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6}>No orders.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}