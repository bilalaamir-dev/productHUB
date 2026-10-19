import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.detail || "Something went wrong. Please try again.");
  }
  if (response.status === 204) return null;
  return response.json();
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Selenium123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onLogin(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page" data-testid="login-page">
      <div className="login-decoration decoration-one" />
      <div className="login-decoration decoration-two" />
      <section className="login-card">
        <Link to="/login" className="brand login-brand" aria-label="ProductHub home">
          <span className="brand-mark"><Package size={21} /></span>
          <span>Product<span className="brand-accent">Hub</span></span>
        </Link>
        <div className="login-heading">
          <span className="eyebrow">PRODUCT INVENTORY</span>
          <h1>Welcome back</h1>
          <p>Sign in to manage your products.</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            data-testid="email-input"
          />
          <div className="label-row">
            <label htmlFor="password">Password</label>
            <span className="secure-label"><ShieldCheck size={13} /> Secure sign in</span>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
            data-testid="password-input"
          />
          {error && <div className="form-error" role="alert" data-testid="login-error">{error}</div>}
          <button className="button button-primary login-submit" disabled={loading} data-testid="login-submit">
            {loading ? "Signing in…" : "Sign in"} <ArrowUpRight size={17} />
          </button>
        </form>
        <div className="demo-hint">
          <Sparkles size={15} />
          <span>Demo account pre-filled. Sign in to view your inventory.</span>
        </div>
      </section>
      <p className="login-footer">Your products, all in one place.</p>
    </main>
  );
}

function AppShell({ user, onLogout, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const currentPage = location.pathname === "/products" ? "Products" : location.pathname === "/settings" ? "Settings" : "Dashboard";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <Link to="/" className="brand sidebar-brand">
          <span className="brand-mark"><Package size={21} /></span>
          <span>Product<span className="brand-accent">Hub</span></span>
        </Link>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "nav-active" : ""}`} data-testid="nav-dashboard">
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? "nav-active" : ""}`} data-testid="nav-products">
            <Package size={18} /> Products
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? "nav-active" : ""}`} data-testid="nav-settings">
            <Settings size={18} /> Settings
          </NavLink>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-tip">
          <span className="tip-icon"><CircleHelp size={17} /></span>
          <strong>Manage your stock</strong>
          <p>Keep product details organized in one place.</p>
          <Link to="/products" className="tip-link">View products <ArrowUpRight size={13} /></Link>
        </div>
        <button className="profile-button" onClick={onLogout} data-testid="logout-button">
          <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <span className="profile-text"><strong>{user.name}</strong><small>{user.email}</small></span>
          <LogOut size={16} className="logout-icon" />
        </button>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-divider">/</span><strong>{currentPage}</strong></div>
          <div className="topbar-right">
            <span className="environment"><span /> Environment healthy</span>
            <button className="help-button" aria-label="Help"><CircleHelp size={18} /></button>
          </div>
        </header>
        <main className="content-area" onClick={() => menuOpen && setMenuOpen(false)}><Outlet /></main>
      </div>
    </div>
  );
}

function Dashboard({ user }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/api/products").then(setProducts).catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <div className="page-content" data-testid="dashboard-page">
      <section className="welcome-banner">
        <div className="welcome-copy">
          <span className="eyebrow">YOUR PRODUCT INVENTORY <span className="live-dot" /></span>
          <h1>Good to see you, {user.name.split(" ")[0]} <span className="wave">✦</span></h1>
          <p>Keep your products organized and your inventory up to date.</p>
          <button className="button button-light" onClick={() => navigate("/products")} data-testid="explore-products-button">
            Explore products <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <div className="art-core"><Package size={38} /></div>
          <span className="art-star star-one">✳</span><span className="art-star star-two">✦</span>
        </div>
        <span className="banner-index">PRODUCT HUB</span>
      </section>

      <section className="stats-grid" aria-label="Workspace overview">
        <StatCard label="Products in inventory" value={String(products.length).padStart(2, "0")} note="Saved to workspace" icon={Package} trend="MongoDB connected" />
        <StatCard label="Product categories" value={String(new Set(products.map((product) => product.category)).size).padStart(2, "0")} note="Across your inventory" icon={Activity} trend="Organized products" />
        <StatCard label="Workspace status" value="Live" note="All systems operational" icon={Check} trend="API healthy" isLive />
      </section>
      {error && <div className="form-error" role="alert" data-testid="dashboard-error">{error}</div>}

      <section className="section-heading">
        <div><span className="eyebrow">INVENTORY MANAGEMENT</span><h2>Manage your products</h2></div>
        <Link to="/products" className="text-link">Open inventory <ArrowUpRight size={15} /></Link>
      </section>
      <section className="inventory-cta">
        <span className="inventory-cta-icon"><Package size={20} /></span>
        <div><strong>Everything in one place</strong><p>Add products with their category, price, and description, then search your inventory whenever you need.</p></div>
        <button className="button button-primary" onClick={() => navigate("/products")} data-testid="manage-products-button">Manage products <ArrowUpRight size={16} /></button>
      </section>
    </div>
  );
}

function StatCard({ label, value, note, icon: Icon, trend, isLive }) {
  return (
    <article className="stat-card">
      <div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={17} /></span></div>
      <div className={`stat-value ${isLive ? "stat-live" : ""}`}>{value}{isLive && <span className="live-dot" />}</div>
      <div className="stat-bottom"><span>{note}</span><span className="stat-trend">{trend}</span></div>
    </article>
  );
}

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", description: "", price: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadProducts() {
    setProducts(await apiRequest("/api/products"));
  }

  useEffect(() => {
    loadProducts().catch((requestError) => setError(requestError.message));
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();
    return products.filter((item) => `${item.name} ${item.category}`.toLowerCase().includes(query));
  }, [products, search]);

  async function handleCreate(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      const created = await apiRequest("/api/products", {
        method: "POST",
        body: JSON.stringify({ ...form, price: Number(form.price) }),
      });
      setProducts((current) => [created, ...current]);
      setForm({ name: "", category: "", description: "", price: "" });
      setShowForm(false);
      setSuccess("Product added successfully.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleDelete(id) {
    setError("");
    setSuccess("");
    try {
      await apiRequest(`/api/products/${id}`, { method: "DELETE" });
      setProducts((current) => current.filter((item) => item.id !== id));
      setSuccess("Product deleted.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page-content products-page" data-testid="products-page">
      <div className="page-title-row">
        <div><span className="eyebrow">YOUR INVENTORY</span><h1>Products</h1><p>Add products, browse your inventory, and find items quickly.</p></div>
        <button className="button button-primary" onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }} data-testid="create-product-button">
          {showForm ? <X size={17} /> : <Plus size={17} />} {showForm ? "Close form" : "Add product"}
        </button>
      </div>
      {showForm && (
        <form className="product-form" onSubmit={handleCreate} data-testid="product-form">
          <div className="form-heading"><div><span className="eyebrow">ADD TO YOUR INVENTORY</span><h2>Product details</h2></div><span className="form-step">NEW PRODUCT <ChevronDown size={14} /></span></div>
          <div className="form-grid">
            <div className="field-group"><label htmlFor="product-name">Product name <span>*</span></label><input id="product-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wireless headphones" required minLength={2} maxLength={100} data-testid="product-name-input" /></div>
            <div className="field-group"><label htmlFor="product-category">Category <span>*</span></label><input id="product-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Electronics" required minLength={2} maxLength={40} data-testid="product-category-input" /></div>
            <div className="field-group"><label htmlFor="product-price">Price <span>*</span></label><input id="product-price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 49.99" required min="0.01" max="1000000000" step="0.01" data-testid="product-price-input" /></div>
            <div className="field-group field-full"><label htmlFor="product-description">Description <span>*</span></label><textarea id="product-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe this product…" required minLength={5} maxLength={500} rows={3} data-testid="product-description-input" /></div>
          </div>
          {error && <div className="form-error" role="alert" data-testid="product-error">{error}</div>}
          <div className="form-actions"><span>All fields are required; price must be greater than zero.</span><button className="button button-primary" type="submit" data-testid="save-product-button"><Check size={16} /> Save product</button></div>
        </form>
      )}
      {success && <div className="success-message" role="status" data-testid="product-success"><Check size={16} /> {success}</div>}
      {error && !showForm && <div className="form-error" role="alert" data-testid="product-error">{error}</div>}
      <div className="list-toolbar">
        <div><h2>All products <span className="result-count">{filteredProducts.length}</span></h2><p>Search your inventory by product name or category.</p></div>
        <label className="search-box"><Search size={17} /><input aria-label="Search products" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="product-search-input" /><kbd>⌘ K</kbd></label>
      </div>
      <div className="product-list" data-testid="product-list">
        {filteredProducts.map((item, index) => (
          <article className="product-row" key={item.id} data-testid="product-row">
            <span className="product-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="product-status"><Check size={14} /></span>
            <div className="product-info"><strong>{item.name}</strong><span>{item.description}</span></div>
            <span className="product-category">{item.category}</span>
            <span className="product-price">${item.price.toFixed(2)}</span>
            <span className="product-date">{new Date(item.created_at).toLocaleDateString()}</span>
            <button className="icon-button delete-button" aria-label={`Delete ${item.name}`} onClick={() => handleDelete(item.id)} data-testid="delete-product-button"><Trash2 size={16} /></button>
          </article>
        ))}
        {filteredProducts.length === 0 && (
          <div className="empty-state" data-testid="empty-products-state">
            <span className="empty-icon"><Search size={22} /></span>
            <strong>{search ? "No matching products" : "No products yet"}</strong>
            <p>{search ? "Try another search term." : "Add your first product to start building your inventory."}</p>
            {!search && <button className="text-link" onClick={() => setShowForm(true)}>Add a product <ArrowUpRight size={15} /></button>}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsPage({ user }) {
  return (
    <div className="page-content settings-page" data-testid="settings-page">
      <div className="page-title-row"><div><span className="eyebrow">WORKSPACE PREFERENCES</span><h1>Settings</h1><p>Your account and workspace details.</p></div></div>
      <section className="settings-card">
        <div className="settings-card-heading"><div className="settings-icon"><Settings size={19} /></div><div><h2>Account profile</h2><p>Signed-in account details for this practice workspace.</p></div></div>
        <div className="settings-detail"><span>Full name</span><strong data-testid="settings-name">{user.name}</strong></div>
        <div className="settings-detail"><span>Email address</span><strong data-testid="settings-email">{user.email}</strong></div>
        <div className="settings-detail"><span>Workspace</span><strong>ProductHub <span className="plan-pill">DEMO</span></strong></div>
      </section>
      <section className="settings-card connection-card">
        <div className="settings-card-heading"><div className="settings-icon green"><Activity size={19} /></div><div><h2>Connected services</h2><p>Services powering your test environment.</p></div></div>
        <div className="settings-detail"><span>Application API</span><strong className="connection-status"><span className="live-dot" /> Connected</strong></div>
        <div className="settings-detail"><span>Database</span><strong className="connection-status"><span className="live-dot" /> MongoDB</strong></div>
      </section>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("testlab-user") || "null");
    } catch {
      return null;
    }
  });
  const navigate = useNavigate();

  function handleLogin(nextUser) {
    localStorage.setItem("testlab-user", JSON.stringify(nextUser));
    setUser(nextUser);
    navigate("/");
  }

  function handleLogout() {
    localStorage.removeItem("testlab-user");
    setUser(null);
    navigate("/login");
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />} />
      <Route element={user ? <AppShell user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
        <Route index element={<Dashboard user={user} />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="settings" element={<SettingsPage user={user} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
