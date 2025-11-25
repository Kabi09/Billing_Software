import { useEffect, useState, useRef } from "react"; // 1. useRef சேர்த்துள்ளேன்
import api from "../api";
import { useToast } from "../ToastProvider";
import { useAuth } from "../AuthProvider";
import IndianCurrency from "../components/IndianCurrency";

export default function Products() {
  const { user } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "",
    barcode: "",
    category: "",
    price: "",
    stock: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // 2. Refs for Scrolling
  const formRef = useRef(null);
  const listRef = useRef(null);

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
      
      // 3. Sorting: Newest First (Recent Add First)
      // createdAt வெச்சு sort பண்றோம். இல்லனா _id வெச்சு பண்ணலாம்.
      list = list.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // Descending order
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

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      barcode: "",
      category: "",
      price: "",
      stock: "",
    });
    setEditingId(null);
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
        setMessage("Product updated.");
        toast.success("Product updated.");
      } else {
        await api.post("/product", payload);
        setMessage("Product added.");
        toast.success("Product added.");
      }
      resetForm();
      fetchProducts();
      
    
      if (!editingId) {
          setTimeout(() => {
            listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
      } else {
        
         resetForm();
      }

    } catch (e) {
      console.error(e);
      setMessage("Failed to save product.");
      toast.error("Barcode is incorrect or duplicate barcode");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (prod) => {
    setEditingId(prod._id);
    setForm({
      name: prod.name,
      barcode: String(prod.barcode),
      category: prod.category?._id || prod.category,
      price: prod.price,
      stock: prod.stock,
    });
    
    // 5. Scroll to Top (Form) when Edit is clicked
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    try {
      await api.delete(`/product/${id}`);
      setMessage("Product deleted.");
      toast.success("Product deleted.");
      fetchProducts();
    } catch (e) {
      console.error(e);
      setMessage("Failed to delete product.");
      toast.error("Failed to delete product.");
    }
  };

  return (
    <div className="page">
  <h2 style={{ fontSize: "28px", marginBottom: "20px", fontWeight: "700" }}>Products</h2>

  {/* Form */}
  <div ref={formRef}>
    {user?.role === "admin" && (
      <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
        <h3 style={{ fontSize: "22px", marginBottom: "20px", fontWeight: "600" }}>
          {editingId ? "Edit Product" : "Add Product"}
        </h3>
        
        <form onSubmit={handleSubmit} className="form" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "16px", fontWeight: "500" }}>
              Name
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Product name"
                style={{
                  fontSize: "16px",
                  padding: "12px 14px",
                  border: "1px solid var(--border)", // Fixed
                  background: "var(--bg)", // Fixed
                  color: "var(--text)", // Fixed
                  borderRadius: "8px",
                  outline: "none",
                  width: "100%"
                }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "16px", fontWeight: "500" }}>
              Barcode
              <input
                type="text"
                name="barcode"
                value={form.barcode}
                onChange={handleChange}
                placeholder="Barcode number"
                style={{
                  fontSize: "16px",
                  padding: "12px 14px",
                  border: "1px solid var(--border)", // Fixed
                  background: "var(--bg)", // Fixed
                  color: "var(--text)", // Fixed
                  borderRadius: "8px",
                  outline: "none",
                  width: "100%"
                }}
              />
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "16px", fontWeight: "500" }}>
            Category
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              style={{
                fontSize: "16px",
                padding: "12px 14px",
                border: "1px solid var(--border)", // Fixed
                background: "var(--bg)", // Fixed
                color: "var(--text)", // Fixed
                borderRadius: "8px",
                outline: "none",
                width: "100%"
              }}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "16px", fontWeight: "500" }}>
              Price
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="0"
                style={{
                  fontSize: "16px",
                  padding: "12px 14px",
                  border: "1px solid var(--border)", // Fixed
                  background: "var(--bg)", // Fixed
                  color: "var(--text)", // Fixed
                  borderRadius: "8px",
                  outline: "none",
                  width: "100%"
                }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "16px", fontWeight: "500" }}>
              Stock
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="0"
                style={{
                  fontSize: "16px",
                  padding: "12px 14px",
                  border: "1px solid var(--border)", // Fixed
                  background: "var(--bg)", // Fixed
                  color: "var(--text)", // Fixed
                  borderRadius: "8px",
                  outline: "none",
                  width: "100%"
                }}
              />
            </label>
          </div>

          <div className="form-actions" style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{ padding: "12px 24px", fontSize: "16px", fontWeight: "600", borderRadius: "8px", border: "none", cursor: "pointer", backgroundColor: "#2563eb", color: "white" }}
            >
              {loading ? "Saving..." : editingId ? "Update Product" : "Add Product"}
            </button>
            {editingId && (
              <button
                type="button"
                className="secondary"
                onClick={resetForm}
                style={{ padding: "12px 24px", fontSize: "16px", fontWeight: "600", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer", backgroundColor: "transparent", color: "var(--text)" }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        {message && <p className="info-text" style={{ marginTop: "12px", fontSize: "15px", color: "var(--muted)" }}>{message}</p>}
      </div>
    )}
  </div>

  {/* Product list */}
  <div className="card" style={{ padding: "20px" }}>
    <h3 style={{ fontSize: "20px", marginBottom: "16px", fontWeight: "600" }}>Product List</h3>
    <div className="table-wrapper">
      <table className="simple-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "16px" }}>
        <thead>
          <tr style={{ background: "var(--accent-soft)", textAlign: "left" }}> {/* Fixed */}
            <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600", color: "var(--text)" }}>#</th>
            <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600", color: "var(--text)" }}>Name</th>
            <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600", color: "var(--text)" }}>Barcode</th>
            <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600", color: "var(--text)" }}>Category</th>
            <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600", color: "var(--text)" }}>Price</th>
            <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600", color: "var(--text)" }}>Stock</th>
            <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600", color: "var(--text)" }}>Sales</th>
            {user?.role === "admin" && <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600", color: "var(--text)" }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {products.length ? (
            products.map((p, idx) => (
              <tr key={p._id} style={{ borderBottom: "1px solid var(--border)" }}> {/* Fixed */}
                <td style={{ padding: "12px", color: "var(--muted)" }}>{idx + 1}</td>
                <td style={{ padding: "12px", fontWeight: "500", color: "var(--text)" }}>{p.name}</td>
                <td style={{ padding: "12px", color: "var(--muted)" }}>{p.barcode}</td>
                <td style={{ padding: "12px", color: "var(--muted)" }}>
                  {p.categoryDetails?.name || (typeof p.category === "object" ? p.category.name : "")}
                </td>
                <td style={{ padding: "12px", fontWeight: "800", fontSize: "17px", color: "#059669" }}> 
                   <IndianCurrency amount={p.price}/>
                </td>
                <td style={{ padding: "12px", fontWeight: "600", color: p.stock < 10 ? "#dc2626" : "var(--muted)" }}>{p.stock}</td>
                <td style={{ padding: "12px", color: "var(--muted)" }}>{p.sales}</td>

                {user?.role === "admin" && (
                  <td style={{ padding: "12px" }}>
                    <div className="table-actions" style={{ display: "flex", gap: "8px" }}>
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
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={user?.role === "admin" ? 8 : 7} style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>
  );
}