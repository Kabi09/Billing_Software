import { useEffect, useState } from "react";
import api from "../api";
import { useToast } from "../ToastProvider";

import { useAuth } from "../AuthProvider";


export default function Categories() {
  const { user } = useAuth();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await api.get("/category");
      setCategories(res.data.category || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load categories.");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setName("");
    setDesc("");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!name.trim()) {
      const msg = "Category name is required.";
      setMessage(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/category/${editingId}`, {
          name: name.trim(),
          desc: desc.trim(),
        });
        setMessage("Category updated.");
        toast.success("Category updated.");
      } else {
        await api.post("/category", {
          name: name.trim(),
          desc: desc.trim(),
        });
        setMessage("Category added.");
        toast.success("Category added.");
      }
      resetForm();
      fetchCategories();
    } catch (e) {
      console.error(e);
      setMessage("Failed to save category.");
      toast.error("Failed to save category.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat._id);
    setName(cat.name);
    setDesc(cat.description || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }
    try {
      await api.delete(`/category/${id}`);
      setMessage("Category deleted.");
      toast.success("Category deleted.");
      fetchCategories();
    } catch (e) {
      console.error(e);
      setMessage("Failed to delete category.");
      toast.error("Failed to delete category.");
    }
  };

  return (
    <div className="page">
  <h2 style={{ fontSize: "28px", marginBottom: "20px", fontWeight: "700" }}>Categories</h2>

  {user?.role === "admin" && (
    <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
      <h3 style={{ fontSize: "22px", marginBottom: "20px", fontWeight: "600" }}>
        {editingId ? "Edit Category" : "Add Category"}
      </h3>
      
      <form onSubmit={handleSubmit} className="form" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "16px", fontWeight: "500" }}>
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
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
          Description
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Short description"
            style={{
              fontSize: "16px",
              padding: "12px 14px",
              border: "1px solid var(--border)", // Fixed
              background: "var(--bg)", // Fixed
              color: "var(--text)", // Fixed
              borderRadius: "8px",
              outline: "none",
              width: "100%",
              minHeight: "100px",
              fontFamily: "inherit"
            }}
          />
        </label>

        <div className="form-actions" style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{ padding: "12px 24px", fontSize: "16px", fontWeight: "600", borderRadius: "8px", border: "none", cursor: "pointer", backgroundColor: "#2563eb", color: "white" }}
          >
            {loading ? "Saving..." : editingId ? "Update Category" : "Add Category"}
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

  <div className="card" style={{ padding: "20px" }}>
    <h3 style={{ fontSize: "20px", marginBottom: "16px", fontWeight: "600" }}>Category List</h3>
    <div className="table-wrapper">
      <table className="simple-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "16px" }}>
        <thead>
          <tr style={{ background: "var(--accent-soft)", textAlign: "left" }}> {/* Fixed */}
            <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600", color: "var(--text)" }}>#</th>
            <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600", color: "var(--text)" }}>Name</th>
            <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600", color: "var(--text)" }}>Description</th>
            {user?.role === "admin" && (
              <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", fontWeight: "600", color: "var(--text)" }}>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {categories.length ? (
            categories.map((c, idx) => (
              <tr key={c._id} style={{ borderBottom: "1px solid var(--border)" }}> {/* Fixed */}
                <td style={{ padding: "12px", color: "var(--muted)" }}>{idx + 1}</td>
                <td style={{ padding: "12px", fontWeight: "500", color: "var(--text)" }}>{c.name}</td>
                <td style={{ padding: "12px", color: "var(--muted)" }}>{c.description}</td>

                {user?.role === "admin" && (
                  <td style={{ padding: "12px" }}>
                    <div className="table-actions" style={{ display: "flex", gap: "8px" }}>
                      <button 
                        onClick={() => handleEdit(c)}
                        style={{ padding: "6px 14px", fontSize: "14px", borderRadius: "6px", border: "none", background: "#dbeafe", color: "#1e40af", fontWeight: "600", cursor: "pointer" }}
                      >
                        Edit
                      </button>
                      <button
                        className="danger"
                        onClick={() => handleDelete(c._id)}
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
              <td colSpan={user?.role === "admin" ? 4 : 3} style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                No categories found.
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
