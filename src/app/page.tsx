"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Item {
  id: number;
  name: string;
  category: string;
  unit: string;
  price: number | null;
  pack_price: number | null;
  pack_qty: number | null;
  aliases: string;
  source_row: number;
  needs_review: string;
}

interface CartItem {
  item: Item;
  qty: number;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

type TabType = "lookup" | "manage";

export default function Home() {
  // ===== State =====
  const [activeTab, setActiveTab] = useState<TabType>("lookup");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  // Manage tab state
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [manageSearch, setManageSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<Item>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    category: "",
    unit: "piece",
    pack_price: "",
    pack_qty: "",
  });

  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toastId = useRef(0);

  // ===== Toast System =====
  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      const id = ++toastId.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  // ===== Load Categories on Mount =====
  useEffect(() => {
    fetch("/api/items?all=true")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categories || []);
        setAllItems(data.items || []);
      });
  }, []);

  // ===== Search & Category Browsing =====
  useEffect(() => {
    let isCancelled = false;

    if (searchQuery.trim()) {
      setLoading(true);
      const timer = setTimeout(() => {
        const params = new URLSearchParams({ q: searchQuery.trim() });
        if (selectedCategory && selectedCategory !== "all") {
          params.set("category", selectedCategory);
        }

        fetch(`/api/items?${params}`)
          .then((r) => r.json())
          .then((data) => {
            if (!isCancelled) {
              setSearchResults(data.items || []);
              setShowDropdown(true);
              setHighlightIndex(-1);
              setLoading(false);
            }
          })
          .catch(() => {
            if (!isCancelled) setLoading(false);
          });
      }, 200);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    }

    // No search query: dropdown should stay closed
    setShowDropdown(false);
    setHighlightIndex(-1);

    if (selectedCategory) {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory === "all") {
        params.set("all", "true");
      } else {
        params.set("category", selectedCategory);
      }

      fetch(`/api/items?${params}`)
        .then((r) => r.json())
        .then((data) => {
          if (!isCancelled) {
            setSearchResults(data.items || []);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!isCancelled) setLoading(false);
        });
    } else {
      setSearchResults([]);
      setLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [searchQuery, selectedCategory]);

  // ===== Click Outside to Close Dropdown =====
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ===== Cart Operations =====
  const addToCart = (item: Item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { item, qty: 1 }];
    });
    showToast(`Added "${item.name}" to order`, "success");
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const updateQty = (itemId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.item.id === itemId ? { ...c, qty: Math.max(0, c.qty + delta) } : c
        )
        .filter((c) => c.qty > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
    showToast("Order cleared", "info");
  };

  const cartTotal = cart.reduce(
    (sum, c) => sum + (c.item.price || 0) * c.qty,
    0
  );
  const cartItemCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const isInCart = (itemId: number) => cart.some((c) => c.item.id === itemId);

  // ===== Keyboard Navigation =====
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : searchResults.length - 1
      );
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      addToCart(searchResults[highlightIndex]);
      setShowDropdown(false);
      setSearchQuery("");
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  // ===== Manage: Update Item =====
  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditValues({
      name: item.name,
      price: item.price,
      category: item.category,
      unit: item.unit,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      const res = await fetch(`/api/items/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });

      if (res.ok) {
        const data = await res.json();
        setAllItems((prev) =>
          prev.map((i) => (i.id === editingId ? data.item : i))
        );
        setEditingId(null);
        showToast("Item updated & saved to CSV!", "success");
      } else {
        showToast("Failed to update item", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  // ===== Manage: Delete Item =====
  const deleteItem = async (id: number) => {
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAllItems((prev) => prev.filter((i) => i.id !== id));
        setCart((prev) => prev.filter((c) => c.item.id !== id));
        showToast("Item deleted from CSV", "success");
      } else {
        showToast("Failed to delete item", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  // ===== Manage: Add Item =====
  const addNewItem = async () => {
    if (!newItem.name || !newItem.price) {
      showToast("Name and price are required", "error");
      return;
    }

    try {
      const res = await fetch("/api/items/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      if (res.ok) {
        const data = await res.json();
        setAllItems((prev) => [...prev, data.item]);
        if (
          data.item.category &&
          !categories.includes(data.item.category)
        ) {
          setCategories((prev) =>
            [...prev, data.item.category].sort()
          );
        }
        setNewItem({
          name: "",
          price: "",
          category: "",
          unit: "piece",
          pack_price: "",
          pack_qty: "",
        });
        setShowAddForm(false);
        showToast(`"${data.item.name}" added to CSV!`, "success");
      } else {
        showToast("Failed to add item", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  // ===== Filtered Manage Items =====
  const filteredManageItems = manageSearch
    ? allItems.filter(
        (i) =>
          i.name.toLowerCase().includes(manageSearch.toLowerCase()) ||
          i.category.toLowerCase().includes(manageSearch.toLowerCase())
      )
    : allItems;

  // ===== Format Price =====
  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return "N/A";
    return `₱${price.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // ===== Highlight Match =====
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
  };

  // ===== Render =====
  return (
    <div className="app-container">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>
              {toast.type === "success"
                ? "✓"
                : toast.type === "error"
                  ? "✕"
                  : "ℹ"}
            </span>
            {toast.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="app-header">
        <h1 className="app-logo">⚡ Samelix</h1>
        <p className="app-subtitle">
          Supplies Pricelist — Search, Order & Manage
        </p>
      </header>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-value">{allItems.length}</div>
          <div className="stat-label">Total Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{categories.length}</div>
          <div className="stat-label">Categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{cartItemCount}</div>
          <div className="stat-label">In Order</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatPrice(cartTotal)}</div>
          <div className="stat-label">Order Total</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "lookup" ? "active" : ""}`}
          onClick={() => setActiveTab("lookup")}
        >
          🔍 Price Lookup
        </button>
        <button
          className={`tab ${activeTab === "manage" ? "active" : ""}`}
          onClick={() => setActiveTab("manage")}
        >
          ⚙️ Manage Items
        </button>
      </div>

      {/* ===== LOOKUP TAB ===== */}
      {activeTab === "lookup" && (
        <div className="main-grid">
          {/* Left: Search & Results */}
          <div>
            {/* Search Bar */}
            <div className="autocomplete-wrapper">
              <div className="search-wrapper" style={{ marginBottom: 0 }}>
                <span className="search-icon">🔍</span>
                <input
                  ref={searchRef}
                  id="item-search"
                  type="text"
                  className="search-input"
                  placeholder="Type an item name... (e.g. bond paper, scissors, pencil)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() =>
                    searchResults.length > 0 && setShowDropdown(true)
                  }
                  onKeyDown={handleSearchKeyDown}
                  autoComplete="off"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="autocomplete-dropdown" ref={dropdownRef}>
                  {searchResults.slice(0, 15).map((item, idx) => (
                    <div
                      key={item.id}
                      className={`autocomplete-item ${
                        idx === highlightIndex ? "highlighted" : ""
                      }`}
                      onClick={() => {
                        addToCart(item);
                        setShowDropdown(false);
                        setSearchQuery("");
                        searchRef.current?.focus();
                      }}
                    >
                      <div>
                        <div className="autocomplete-item-name">
                          {highlightMatch(item.name, searchQuery)}
                        </div>
                        <span
                          className="item-category-tag"
                          style={{ marginTop: 4, display: "inline-block" }}
                        >
                          {item.category}
                        </span>
                      </div>
                      <span className="autocomplete-item-price">
                        {item.price !== null ? formatPrice(item.price) : "N/A"}
                      </span>
                    </div>
                  ))}
                  {searchResults.length > 15 && (
                    <div
                      style={{
                        padding: "10px 16px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                        fontSize: "0.82rem",
                      }}
                    >
                      +{searchResults.length - 15} more results...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Category Filters */}
            <div
              className="category-filters"
              style={{ marginTop: 16 }}
            >
              <button
                className={`category-chip ${
                  selectedCategory === "all" ? "active" : ""
                }`}
                onClick={() =>
                  setSelectedCategory((prev) =>
                    prev === "all" ? "" : "all"
                  )
                }
              >
                All Items
                {allItems.length > 0 && (
                  <span className="category-count">
                    ({allItems.length})
                  </span>
                )}
              </button>
              {categories.map((cat) => {
                const count = allItems.filter(
                  (i) =>
                    (i.category || "").toLowerCase() ===
                    cat.toLowerCase()
                ).length;
                return (
                  <button
                    key={cat}
                    className={`category-chip ${
                      selectedCategory === cat ? "active" : ""
                    }`}
                    onClick={() =>
                      setSelectedCategory((prev) =>
                        prev === cat ? "" : cat
                      )
                    }
                  >
                    {cat}
                    {count > 0 && (
                      <span className="category-count">
                        ({count})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Results Panel */}
            <div className="panel">
              <div className="panel-header">
                <h2 className="panel-title">
                  <span className="icon">
                    {searchQuery ? "🔍" : selectedCategory ? "📂" : "📦"}
                  </span>
                  {searchQuery
                    ? `Results for "${searchQuery}"${
                        selectedCategory && selectedCategory !== "all"
                          ? ` in ${selectedCategory}`
                          : ""
                      }`
                    : selectedCategory
                      ? selectedCategory === "all"
                        ? "Browse Items — All Items"
                        : `Browse Items — ${selectedCategory}`
                      : "Browse Items"}
                </h2>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {selectedCategory && (
                    <button
                      type="button"
                      className="btn-clear-filter"
                      onClick={() => setSelectedCategory("")}
                      title="Clear category filter"
                    >
                      ✕ Clear filter
                    </button>
                  )}
                  {searchResults.length > 0 && (
                    <span className="panel-badge">
                      {searchResults.length}
                    </span>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="empty-state">
                  <div className="spinner"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="results-grid">
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      className={`item-card ${
                        isInCart(item.id) ? "in-cart" : ""
                      }`}
                      onClick={() => addToCart(item)}
                    >
                      <div className="item-info">
                        <div className="item-name">
                          {searchQuery
                            ? highlightMatch(item.name, searchQuery)
                            : item.name}
                        </div>
                        <div className="item-meta">
                          <span
                            className="item-category-tag"
                            style={{ cursor: "pointer" }}
                            title={`Browse all ${item.category} items`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCategory(item.category);
                            }}
                          >
                            {item.category}
                          </span>
                          <span>per {item.unit}</span>
                        </div>
                      </div>
                      <span
                        className={`item-price ${
                          item.price === null ? "no-price" : ""
                        }`}
                      >
                        {formatPrice(item.price)}
                      </span>
                      <button
                        className={`item-add-btn ${
                          isInCart(item.id) ? "remove" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isInCart(item.id)) {
                            removeFromCart(item.id);
                          } else {
                            addToCart(item);
                          }
                        }}
                      >
                        {isInCart(item.id) ? "−" : "+"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="empty-state">
                  <div className="icon">🔍</div>
                  <p>
                    No items found for &quot;{searchQuery}&quot;
                    {selectedCategory && selectedCategory !== "all"
                      ? ` in ${selectedCategory}`
                      : ""}
                  </p>
                  <p className="hint">
                    Try a different search term or clear the category filter
                  </p>
                </div>
              ) : selectedCategory ? (
                <div className="empty-state">
                  <div className="icon">📂</div>
                  <p>
                    No items found in &quot;{selectedCategory}&quot;
                  </p>
                  <p className="hint">
                    Try selecting another category or view All Items
                  </p>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="icon">✨</div>
                  <p>
                    Select a category above to browse items, or start typing to search
                  </p>
                  <p className="hint">
                    Click any category (e.g. Adhesives, Folders, Papers) to list its items
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Cart / Order Panel */}
          <div className="panel cart-panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <span className="icon">🛒</span>
                Current Order
              </h2>
              {cartItemCount > 0 && (
                <span className="panel-badge">{cartItemCount}</span>
              )}
            </div>

            {cart.length > 0 ? (
              <>
                <div className="cart-items">
                  {cart.map((cartItem) => (
                    <div key={cartItem.item.id} className="cart-item">
                      <span className="cart-item-name">
                        {cartItem.item.name}
                      </span>
                      <div className="cart-item-qty">
                        <button
                          className="qty-btn"
                          onClick={() =>
                            updateQty(cartItem.item.id, -1)
                          }
                        >
                          −
                        </button>
                        <span className="qty-value">
                          {cartItem.qty}
                        </span>
                        <button
                          className="qty-btn"
                          onClick={() =>
                            updateQty(cartItem.item.id, 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <span className="cart-item-price">
                        {formatPrice(
                          (cartItem.item.price || 0) * cartItem.qty
                        )}
                      </span>
                      <button
                        className="cart-item-remove"
                        onClick={() =>
                          removeFromCart(cartItem.item.id)
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <hr className="cart-divider" />

                <div className="cart-total">
                  <span className="cart-total-label">Total</span>
                  <span className="cart-total-value">
                    {formatPrice(cartTotal)}
                  </span>
                </div>

                <div className="cart-actions">
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={clearCart}
                  >
                    🗑 Clear
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      // Print-friendly summary
                      const lines = cart.map(
                        (c) =>
                          `${c.item.name} x${c.qty} = ${formatPrice(
                            (c.item.price || 0) * c.qty
                          )}`
                      );
                      lines.push(`\nTOTAL: ${formatPrice(cartTotal)}`);
                      const text = lines.join("\n");
                      navigator.clipboard
                        .writeText(text)
                        .then(() =>
                          showToast(
                            "Order copied to clipboard!",
                            "success"
                          )
                        );
                    }}
                  >
                    📋 Copy Order
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="icon">🛒</div>
                <p>Your order is empty</p>
                <p className="hint">
                  Search for items and click + to add them
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== MANAGE TAB ===== */}
      {activeTab === "manage" && (
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <span className="icon">⚙️</span>
              Manage Inventory
            </h2>
            <button
              className={`btn ${showAddForm ? "btn-danger" : "btn-success"} btn-sm`}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? "✕ Cancel" : "＋ Add New Item"}
            </button>
          </div>

          {/* Add New Item Form */}
          {showAddForm && (
            <div className="add-form">
              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Mongol Pencil #3"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Price (₱) *</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newItem.price}
                  onChange={(e) =>
                    setNewItem({ ...newItem, price: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={newItem.category}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      category: e.target.value,
                    })
                  }
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select
                  className="form-select"
                  value={newItem.unit}
                  onChange={(e) =>
                    setNewItem({ ...newItem, unit: e.target.value })
                  }
                >
                  <option value="piece">piece</option>
                  <option value="sheet">sheet</option>
                  <option value="pack">pack</option>
                  <option value="box">box</option>
                  <option value="roll">roll</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Pack Price (₱)</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  placeholder="Optional"
                  value={newItem.pack_price}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      pack_price: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Pack Quantity</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="Optional"
                  value={newItem.pack_qty}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      pack_qty: e.target.value,
                    })
                  }
                />
              </div>
              <div className="full-width" style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={addNewItem}
                >
                  ✓ Add Item to CSV
                </button>
              </div>
            </div>
          )}

          {/* Search & Filter */}
          <div className="manage-header">
            <input
              className="manage-search"
              type="text"
              placeholder="Search items to edit..."
              value={manageSearch}
              onChange={(e) => setManageSearch(e.target.value)}
            />
            <span
              style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
              }}
            >
              {filteredManageItems.length} items
            </span>
          </div>

          {/* Items Table */}
          <div className="manage-grid">
            <div className="manage-table-wrap">
              <table className="manage-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Unit</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredManageItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ color: "var(--text-muted)" }}>
                        {item.id}
                      </td>
                      <td>
                        {editingId === item.id ? (
                          <input
                            className="inline-edit"
                            value={editValues.name || ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                name: e.target.value,
                              })
                            }
                            autoFocus
                          />
                        ) : (
                          <span
                            className="editable"
                            onClick={() => startEdit(item)}
                          >
                            {item.name}
                          </span>
                        )}
                      </td>
                      <td>
                        {editingId === item.id ? (
                          <select
                            className="inline-edit"
                            value={editValues.category || ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                category: e.target.value,
                              })
                            }
                          >
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="item-category-tag">
                            {item.category}
                          </span>
                        )}
                      </td>
                      <td>
                        {editingId === item.id ? (
                          <input
                            className="inline-edit"
                            type="number"
                            step="0.01"
                            value={editValues.price ?? ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                price: parseFloat(e.target.value) || null,
                              })
                            }
                            style={{ width: 80 }}
                          />
                        ) : (
                          <span
                            className="editable"
                            style={{
                              color:
                                item.price !== null
                                  ? "var(--accent-success)"
                                  : "var(--text-muted)",
                              fontWeight: 700,
                            }}
                            onClick={() => startEdit(item)}
                          >
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {editingId === item.id ? (
                          <select
                            className="inline-edit"
                            value={editValues.unit || "piece"}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                unit: e.target.value,
                              })
                            }
                            style={{ width: 80 }}
                          >
                            <option value="piece">piece</option>
                            <option value="sheet">sheet</option>
                            <option value="pack">pack</option>
                            <option value="box">box</option>
                            <option value="roll">roll</option>
                          </select>
                        ) : (
                          item.unit
                        )}
                      </td>
                      <td>
                        <div className="action-btns">
                          {editingId === item.id ? (
                            <>
                              <button
                                className="action-btn"
                                title="Save"
                                onClick={saveEdit}
                              >
                                ✓
                              </button>
                              <button
                                className="action-btn danger"
                                title="Cancel"
                                onClick={cancelEdit}
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="action-btn"
                                title="Edit"
                                onClick={() => startEdit(item)}
                              >
                                ✎
                              </button>
                              <button
                                className="action-btn danger"
                                title="Delete"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Delete "${item.name}"?`
                                    )
                                  ) {
                                    deleteItem(item.id);
                                  }
                                }}
                              >
                                🗑
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
