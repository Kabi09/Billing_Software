import { useEffect, useState, useRef } from "react";
import api from "../api";
import { useToast } from "../ToastProvider";
import { useAuth } from "../AuthProvider";
import IndianCurrency from "../components/IndianCurrency";
import BarcodeSticker from "./BarcodeSticker"; // Import the new component (Path may vary)

export default function Products() {
  const { user } = useAuth();
  const toast = useToast();
  
  // Data States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // UI States
  const [isAutoGenerate, setIsAutoGenerate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  // --- Barcode Modal States ---
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    barcode: "",
    category: "",
    price: "",
    stock: "",
  });

  // Refs for Scrolling
  const formRef = useRef(null);
  const listRef = useRef(null);

  // --- Permissions Logic ---
  const isAdmin = user?.role === "admin";
  const isEmployee = user?.role === "employee";
  // Actions காலமை Admin மற்றும் Employee இருவருக்கும் காட்டு
  const showActionsColumn = isAdmin || isEmployee; 

  // --- Helper Functions ---
  const generateBarcode = () => {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
  };

  const handleAutoGenerateToggle = (e) => {
    const isChecked = e.target.checked;
    setIsAutoGenerate(isChecked);
    if (isChecked) {
      setForm((prev) => ({ ...prev, barcode: generateBarcode() }));
    } else {
      setForm((prev) => ({ ...prev, barcode: "" })); 
    }
  };

  // --- API Fetching ---
  const fetchCategories = async () => {
    try {
      const res = await api.get("/category");
      setCategories(res.data.category || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load categories.");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/product");
      let list = res.data.products || [];
      list = list.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      setProducts(list);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load products.");
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  // --- Form Handlers ---
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setForm({ name: "", barcode: "", category: "", price: "", stock: "" });
    setEditingId(null);
    setIsAutoGenerate(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.name.trim() || !form.barcode.trim()) {
      const msg = "Name, barcode, and category are required.";
      setMessage(msg);
      toast.error(msg);
      return;
    }
    if (!form.price || form.price <= 0) {
      const msg = "Price is required.";
      setMessage(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        barcode: form.barcode.trim(),
        category: form.category,
        price: Number(form.price),
        stock: form.stock ? Number(form.stock) : 0,
      };

      if (editingId) {
        await api.put(`/product/${editingId}`, payload);
        toast.success("Product updated.");
      } else {
        await api.post("/product", payload);
        toast.success("Product added.");
      }
      resetForm();
      fetchProducts();
      
      if (!editingId) {
          setTimeout(() => {
            listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
      } 
    } catch (e) {
      console.error(e);
      const errorMsg = e.response?.data?.message || "Failed to save product.";
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (prod) => {
    setEditingId(prod._id);
    setIsAutoGenerate(false); 
    setForm({
      name: prod.name,
      barcode: String(prod.barcode),
      category: prod.category?._id || prod.category,
      price: prod.price,
      stock: prod.stock,
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    try {
      await api.delete(`/product/${id}`);
      toast.success("Product deleted.");
      fetchProducts();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete product.");
    }
  };

  // --- Handle View Barcode Click ---
  const handleViewBarcode = (prod) => {
    setSelectedProduct(prod);
    setShowBarcodeModal(true);
  };

  return (
    <div className="page">
      <style>{`
        /* Modern Toggle Switch CSS */
        .switch { position: relative; display: inline-block; width: 50px; height: 26px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #2563eb; }
        input:checked + .slider:before { transform: translateX(24px); }
        .input-disabled { background-color: #eff6ff !important; color: #1e40af !important; font-weight: 600; border: 1px dashed #2563eb !important; cursor: not-allowed; }

        /* Modern Barcode Label Button */
        .btn-barcode {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 3px 6px rgba(37, 99, 235, 0.2);
          transition: all 0.2s ease;
          letter-spacing: 0.3px;
        }
        .btn-barcode:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 12px rgba(37, 99, 235, 0.3);
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }
        .btn-barcode:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
        }
      `}</style>

      <h2 style={{ fontSize: "28px", marginBottom: "20px", fontWeight: "700" }}>Products</h2>

      {/* Form Section - Only Admin can Add/Edit */}
      <div ref={formRef}>
        {isAdmin && (
          <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
            <h3 style={{ fontSize: "22px", marginBottom: "20px", fontWeight: "600" }}>
              {editingId ? "Edit Product" : "Add Product"}
            </h3>
            
            <form onSubmit={handleSubmit} className="form" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "16px", fontWeight: "500" }}>
                  Name
                  <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Product name"
                    style={{ fontSize: "16px", padding: "12px 14px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "8px", outline: "none", width: "100%" }} />
                </label>

                {/* Barcode Section */}
                <label style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "16px", fontWeight: "500" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      Barcode
                      <span style={{ fontSize: "12px", color: isAutoGenerate ? "#2563eb" : "#888", fontWeight: "normal" }}>
                        {isAutoGenerate ? "(Auto-Generated)" : "(Manual Input)"}
                      </span>
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "13px", color: isAutoGenerate ? "#888" : "#333" }}>Manual</span>
                      <label className="switch">
                        <input type="checkbox" checked={isAutoGenerate} onChange={handleAutoGenerateToggle} />
                        <span className="slider"></span>
                      </label>
                      <span style={{ fontSize: "13px", color: isAutoGenerate ? "#2563eb" : "#888" }}>Auto</span>
                    </div>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input type="text" name="barcode" value={form.barcode} onChange={handleChange} placeholder={isAutoGenerate ? "System generating..." : "Enter or Scan Barcode"} readOnly={isAutoGenerate} className={isAutoGenerate ? "input-disabled" : ""}
                      style={{ fontSize: "16px", padding: "12px 14px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "8px", outline: "none", width: "100%", paddingRight: isAutoGenerate ? "40px" : "14px" }} />
                    {isAutoGenerate && <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#2563eb", fontSize: "18px" }}>✨</span>}
                  </div>
                </label>
              </div>

              {/* Other Fields */}
              <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "16px", fontWeight: "500" }}>
                Category
                <select name="category" value={form.category} onChange={handleChange}
                  style={{ fontSize: "16px", padding: "12px 14px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "8px", outline: "none", width: "100%" }}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "16px", fontWeight: "500" }}>
                  Price
                  <input type="number" name="price" value={form.price} onChange={handleChange} onWheel={(e) => e.target.blur()} placeholder="0"
                    style={{ fontSize: "16px", padding: "12px 14px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "8px", outline: "none", width: "100%" }} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "16px", fontWeight: "500" }}>
                  Stock
                  <input type="number" name="stock" value={form.stock} onChange={handleChange} onWheel={(e) => e.target.blur()} placeholder="0"
                    style={{ fontSize: "16px", padding: "12px 14px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "8px", outline: "none", width: "100%" }} />
                </label>
              </div>

              <div className="form-actions" style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                <button type="submit" disabled={loading} style={{ padding: "12px 24px", fontSize: "16px", fontWeight: "600", borderRadius: "8px", border: "none", cursor: "pointer", backgroundColor: "#2563eb", color: "white" }}>
                  {loading ? "Saving..." : editingId ? "Update Product" : "Add Product"}
                </button>
                {editingId && (
                  <button type="button" className="secondary" onClick={resetForm} style={{ padding: "12px 24px", fontSize: "16px", fontWeight: "600", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer", backgroundColor: "transparent", color: "var(--text)" }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
            {message && <p className="info-text" style={{ marginTop: "12px", fontSize: "15px", color: "var(--muted)" }}>{message}</p>}
          </div>
        )}
      </div>

      {/* Product List Table */}
      <div className="card" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "20px", marginBottom: "16px", fontWeight: "600" }}>Product List</h3>
        <div className="table-wrapper">
          <table className="simple-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "16px" }}>
            <thead>
              <tr style={{ background: "var(--accent-soft)", textAlign: "left" }}>
                <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600" }}>#</th>
                <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600" }}>Name</th>
                <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600" }}>Barcode</th>
                <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600" }}>Category</th>
                <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600" }}>Price</th>
                <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600" }}>Stock</th>
                <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600" }}>Sales</th>
                {/* ACTIONS Header: Visible to Admin AND Employee */}
                {showActionsColumn && <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.length ? (
                products.map((p, idx) => (
                  <tr key={p._id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px", color: "var(--muted)" }}>{idx + 1}</td>
                    <td style={{ padding: "12px", fontWeight: "500" }}>{p.name}</td>
                    <td style={{ padding: "12px", color: "var(--muted)" }}>{p.barcode}</td>
                    <td style={{ padding: "12px", color: "var(--muted)" }}>
                      {p.categoryDetails?.name || (typeof p.category === "object" ? p.category.name : "")}
                    </td>
                    <td style={{ padding: "12px", fontWeight: "800", fontSize: "17px", color: "#059669" }}> 
                       <IndianCurrency amount={p.price}/>
                    </td>
                    <td style={{ padding: "12px", fontWeight: "600", color: p.stock < 10 ? "#dc2626" : "var(--muted)" }}>{p.stock}</td>
                    <td style={{ padding: "12px", color: "var(--muted)" }}>{p.sales}</td>

                    {/* ACTIONS Body: Visible to Admin AND Employee */}
                    {showActionsColumn && (
                      <td style={{ padding: "12px" }}>
                        <div className="table-actions" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          
                          {/* Label Button - VISIBLE TO BOTH */}
                          <button 
                            onClick={() => handleViewBarcode(p)}
                            title="Print Label"
                            className="btn-barcode"
                          >
                             <span style={{ display: "flex", gap: "2px", alignItems: "center", height: "12px" }}>
                                <span style={{ width: "2px", height: "100%", background: "white", borderRadius: "1px" }}></span>
                                <span style={{ width: "1px", height: "100%", background: "white", borderRadius: "1px" }}></span>
                                <span style={{ width: "3px", height: "100%", background: "white", borderRadius: "1px" }}></span>
                                <span style={{ width: "1px", height: "100%", background: "white", borderRadius: "1px" }}></span>
                             </span>
                             <span>Label</span>
                          </button>
                          
                          {/* Edit/Delete Buttons - ADMIN ONLY */}
                          {isAdmin && (
                            <>
                              <button 
                                onClick={() => handleEdit(p)}
                                style={{ padding: "6px 14px", fontSize: "14px", borderRadius: "6px", border: "none", background: "#dbeafe", color: "#1e40af", fontWeight: "600", cursor: "pointer" }}
                              >
                                Edit
                              </button>
                              <button
                                className="danger"
                                onClick={() => handleDelete(p._id)}
                                style={{ padding: "6px 14px", fontSize: "14px", borderRadius: "6px", border: "none", background: "#fee2e2", color: "#991b1b", fontWeight: "600", cursor: "pointer" }}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={showActionsColumn ? 8 : 7} style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- RENDER BARCODE MODAL --- */}
      {showBarcodeModal && selectedProduct && (
        <BarcodeSticker 
          product={selectedProduct} 
          onClose={() => setShowBarcodeModal(false)} 
        />
      )}

    </div>
  );
}