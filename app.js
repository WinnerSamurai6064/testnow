/* ============================================================
TREY BURGERS — app.js
Dark OLED Neon Orange Food Ordering App
By TekTrey / TEKDEV

Hugging Face Space:
https://huggingface.co/spaces/Shinhati2023/zontzend

Backend API:
https://shinhati2023-zontzend.hf.space
============================================================ */

"use strict";

/* ============================================================
CONFIG
============================================================ */
const API_BASE = "https://shinhati2023-zontzend.hf.space";
const GOOGLE_CLIENT_ID = "19739360035-jvha07nrt0cscfrklqt01tb0lgo1bd5o.apps.googleusercontent.com.apps.googleusercontent.com";

const ADMIN_PIN = "1234";
const DELIVERY_FEE = 2.0;
const PROMO_CODES = {
  TREY10: 0.1,
  BURGER20: 0.2,
  NEON: 0.15
};

/* ============================================================
STARTER PRODUCT DATA
============================================================ */
const STARTER_PRODUCTS = [
  {
    id: "p1",
    name: "Flame Burger",
    category: "Burgers",
    price: 9.99,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=75",
    description: "Classic double patty burger with flame-grilled char, crisp lettuce and house sauce.",
    available: true
  },
  {
    id: "p2",
    name: "Double Cheese Burger",
    category: "Burgers",
    price: 11.49,
    image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&q=75",
    description: "Two smash patties, double American cheese, pickles and mustard on a brioche bun.",
    available: true
  },
  {
    id: "p3",
    name: "Crispy Chicken Burger",
    category: "Burgers",
    price: 10.49,
    image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=75",
    description: "Southern-fried crispy chicken breast, coleslaw, hot mayo and dill pickles.",
    available: true
  },
  {
    id: "p4",
    name: "Orange Neon Soda",
    category: "Drinks",
    price: 3.49,
    image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&q=75",
    description: "House-made citrus soda with a neon orange twist and crushed ice.",
    available: true
  },
  {
    id: "p5",
    name: "Iced Coffee",
    category: "Drinks",
    price: 4.29,
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&q=75",
    description: "Cold-brew concentrate over ice, lightly sweetened with oat milk.",
    available: true
  },
  {
    id: "p6",
    name: "Mango Drink",
    category: "Drinks",
    price: 3.99,
    image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=400&q=75",
    description: "Real mango pulp blended with chilled sparkling water and a hint of lime.",
    available: true
  },
  {
    id: "p7",
    name: "Loaded Fries",
    category: "Fries",
    price: 6.49,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=75",
    description: "Crispy shoestring fries loaded with cheese sauce, jalapeños and sour cream.",
    available: true
  },
  {
    id: "p8",
    name: "Onion Rings",
    category: "Snacks",
    price: 5.49,
    image: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&q=75",
    description: "Beer-battered thick-cut onion rings with smoky chipotle dip.",
    available: true
  },
  {
    id: "p9",
    name: "Chocolate Cake",
    category: "Desserts",
    price: 5.99,
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=75",
    description: "Rich dark chocolate layer cake with ganache frosting and cocoa dust.",
    available: true
  },
  {
    id: "p10",
    name: "Vanilla Cup",
    category: "Desserts",
    price: 4.49,
    image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&q=75",
    description: "Soft-serve vanilla in a waffle cup, topped with caramel drizzle.",
    available: true
  }
];

/* ============================================================
STATE
============================================================ */
let products = [];
let cart = [];
let favorites = new Set();
let activeCategory = "All";
let searchQuery = "";
let currentScreen = "home";
let adminUnlocked = false;
let pinBuffer = "";
let orderCount = 0;
let editingProductId = null;
let discountRate = 0;

/* ============================================================
INIT
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  loadFromStorage();
  setupSplash();
  setupThreeHero();
  setupRippleCanvas();
  checkBackendStatus();

  if (window.lucide) {
    lucide.createIcons();
  }
});

function loadFromStorage() {
  const stored = localStorage.getItem("tb_products");
  products = stored ? JSON.parse(stored) : [...STARTER_PRODUCTS];

  const storedCart = localStorage.getItem("tb_cart");
  cart = storedCart ? JSON.parse(storedCart) : [];

  const storedFavs = localStorage.getItem("tb_favorites");
  if (storedFavs) {
    favorites = new Set(JSON.parse(storedFavs));
  }

  orderCount = parseInt(localStorage.getItem("tb_orders") || "0", 10);
}

function saveProducts() {
  localStorage.setItem("tb_products", JSON.stringify(products));
}

function saveCart() {
  localStorage.setItem("tb_cart", JSON.stringify(cart));
}

function saveFavorites() {
  localStorage.setItem("tb_favorites", JSON.stringify([...favorites]));
}

/* ============================================================
SPLASH SCREEN
============================================================ */
function setupSplash() {
  setupSplashParticles();
  setupSplashText();
}

function setupSplashParticles() {
  const canvas = document.getElementById("splash-canvas");

  if (!canvas || typeof THREE === "undefined") return;

  try {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();

    const cam = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );

    cam.position.z = 5;

    const geo = new THREE.BufferGeometry();
    const count = 300;
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 12;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xff7a00,
      size: 0.06,
      transparent: true,
      opacity: 0.7
    });

    scene.add(new THREE.Points(geo, mat));

    let t = 0;

    function animSplash() {
      const splash = document.getElementById("splash-screen");

      if (!splash || splash.style.display === "none") return;

      t += 0.004;
      scene.rotation.y = t * 0.3;
      scene.rotation.x = Math.sin(t * 0.2) * 0.1;

      renderer.render(scene, cam);
      requestAnimationFrame(animSplash);
    }

    animSplash();

    window.addEventListener("resize", () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      cam.aspect = window.innerWidth / window.innerHeight;
      cam.updateProjectionMatrix();
    });
  } catch (e) {
    console.log("Splash WebGL fallback:", e);
  }
}

function setupSplashText() {
  const lines = [
    {
      el: document.getElementById("tl1"),
      text: "TREY FOOD SHELL",
      speed: 55
    },
    {
      el: document.getElementById("tl2"),
      text: "BIG",
      speed: 90,
      big: true
    },
    {
      el: document.getElementById("tl3"),
      text: "BETTER",
      speed: 90,
      big: true
    },
    {
      el: document.getElementById("tl4"),
      text: "BEST",
      speed: 90,
      big: true
    },
    {
      el: document.getElementById("tl5"),
      text: "We live for Burgers.",
      speed: 60
    }
  ];

  let delay = 300;

  lines.forEach((line, idx) => {
    if (!line.el) return;

    setTimeout(() => {
      line.el.classList.remove("hidden");

      setTimeout(() => {
        line.el.classList.add("visible");
      }, 20);

      const textEl = line.el.querySelector(".terminal-text");

      if (textEl) {
        typewrite(textEl, line.text, line.speed, idx === 0);
      }

      if (idx === lines.length - 1) {
        setTimeout(() => {
          const btn = document.getElementById("enter-btn");

          if (!btn) {
            launchApp();
            return;
          }

          btn.classList.remove("hidden");

          if (window.lucide) {
            lucide.createIcons();
          }

          btn.addEventListener("click", launchApp, { once: true });
        }, line.text.length * line.speed + 400);
      }
    }, delay);

    delay += line.text.length * (line.big ? 90 : 55) + 500;
  });

  setTimeout(() => {
    const btn = document.getElementById("enter-btn");
    const app = document.getElementById("app");

    if (btn && app && app.classList.contains("hidden")) {
      btn.classList.remove("hidden");
    }
  }, 5500);
}

function typewrite(el, text, speed, showCursor) {
  let i = 0;
  const cursor = el.parentElement.querySelector(".terminal-cursor");

  function tick() {
    el.textContent = text.slice(0, i + 1);
    i++;

    if (i < text.length) {
      setTimeout(tick, speed);
    } else if (cursor && !showCursor) {
      setTimeout(() => {
        cursor.style.display = "none";
      }, 300);
    }
  }

  tick();
}

function launchApp() {
  const splash = document.getElementById("splash-screen");
  const app = document.getElementById("app");

  if (!app) return;

  if (!splash) {
    app.classList.remove("hidden");
    initApp();
    return;
  }

  splash.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  splash.style.opacity = "0";
  splash.style.transform = "scale(1.05)";

  setTimeout(() => {
    splash.style.display = "none";

    app.classList.remove("hidden");
    app.style.opacity = "0";
    app.style.transition = "opacity 0.5s ease";

    setTimeout(() => {
      app.style.opacity = "1";
    }, 30);

    initApp();
  }, 650);
}

/* ============================================================
APP INIT
============================================================ */
function initApp() {
  renderProducts();
  updateCartBadge();
  setupEventListeners();
  setupGoogleLogin();
  updateOrderCount();

  if (window.lucide) {
    lucide.createIcons();
  }
}

/* ============================================================
GOOGLE OAUTH LOGIN
============================================================ */
function setupGoogleLogin() {
  const loginBox = document.getElementById("google-login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const authLabel = document.getElementById("auth-user-label");

  if (!loginBox || !logoutBtn || !authLabel) return;

  const savedUser = JSON.parse(localStorage.getItem("user") || "null");
  const savedJwt = localStorage.getItem("jwt");

  if (savedUser && savedJwt) {
    authLabel.textContent = `Signed in as ${savedUser.name || savedUser.email}`;
    logoutBtn.classList.remove("hidden");
  } else {
    authLabel.textContent = "Not signed in";
    logoutBtn.classList.add("hidden");
  }

  if (
    !window.google ||
    !google.accounts ||
    !google.accounts.id
  ) {
    setTimeout(setupGoogleLogin, 500);
    return;
  }

  if (
    !GOOGLE_CLIENT_ID ||
    GOOGLE_CLIENT_ID.includes("PASTE_YOUR_GOOGLE_CLIENT_ID_HERE")
  ) {
    authLabel.textContent = "Google Client ID not set";
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredential
  });

  loginBox.innerHTML = "";

  google.accounts.id.renderButton(loginBox, {
    theme: "filled_black",
    size: "large",
    shape: "pill",
    text: "signin_with",
    width: 300
  });

  logoutBtn.onclick = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");

    authLabel.textContent = "Not signed in";
    logoutBtn.classList.add("hidden");

    if (window.google && google.accounts && google.accounts.id) {
      google.accounts.id.disableAutoSelect();
    }

    showToast("Logged out");
  };
}

async function handleGoogleCredential(response) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        credential: response.credential
      })
    });

    const data = await res.json();

    if (!data.ok) {
      throw new Error(data.error || "Google login failed");
    }

    localStorage.setItem("jwt", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    const authLabel = document.getElementById("auth-user-label");
    const logoutBtn = document.getElementById("logout-btn");

    if (authLabel) {
      authLabel.textContent = `Signed in as ${data.user.name || data.user.email}`;
    }

    if (logoutBtn) {
      logoutBtn.classList.remove("hidden");
    }

    showToast("Google login successful 🔥");
  } catch (err) {
    console.error("Google login error:", err);
    showToast("Google login failed");
  }
}

/* ============================================================
THREE.JS HERO CLOTH WAVE
============================================================ */
function setupThreeHero() {
  const canvas = document.getElementById("hero-canvas");

  if (!canvas || typeof THREE === "undefined") return;

  try {
    const W = window.innerWidth;
    const H = 220;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);

    const scene = new THREE.Scene();

    const cam = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    cam.position.set(0, 1.5, 5);
    cam.lookAt(0, 0, 0);

    const cols = 24;
    const rows = 10;
    const group = new THREE.Group();

    const origPos = [];

    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const x = (c / cols) * 8 - 4;
        const y = (r / rows) * -2 + 1;
        origPos.push(x, y);
      }
    }

    for (let r = 0; r <= rows; r++) {
      const pts = [];

      for (let c = 0; c <= cols; c++) {
        const idx = r * (cols + 1) + c;
        pts.push(new THREE.Vector3(origPos[idx * 2], origPos[idx * 2 + 1], 0));
      }

      const geo = new THREE.BufferGeometry().setFromPoints(pts);

      const mat = new THREE.LineBasicMaterial({
        color: 0xff7a00,
        transparent: true,
        opacity: Math.max(0.08, 0.25 - r * 0.015)
      });

      group.add(new THREE.Line(geo, mat));
    }

    for (let c = 0; c <= cols; c += 3) {
      const pts = [];

      for (let r = 0; r <= rows; r++) {
        const idx = r * (cols + 1) + c;
        pts.push(new THREE.Vector3(origPos[idx * 2], origPos[idx * 2 + 1], 0));
      }

      const geo = new THREE.BufferGeometry().setFromPoints(pts);

      const mat = new THREE.LineBasicMaterial({
        color: 0xff8c1a,
        transparent: true,
        opacity: 0.12
      });

      group.add(new THREE.Line(geo, mat));
    }

    scene.add(group);

    let t = 0;
    const lines = group.children;

    function animHero() {
      requestAnimationFrame(animHero);

      t += 0.012;

      let lineIdx = 0;

      for (let r = 0; r <= rows; r++) {
        const line = lines[lineIdx++];

        if (!line || !line.geometry) continue;

        const pos = line.geometry.attributes.position;

        if (!pos) continue;

        for (let c = 0; c <= cols; c++) {
          const wave =
            Math.sin(t + c * 0.35 + r * 0.5) * 0.18 +
            Math.sin(t * 0.7 + c * 0.2) * 0.08;

          pos.setZ(c, wave);
        }

        pos.needsUpdate = true;
      }

      renderer.render(scene, cam);
    }

    animHero();

    window.addEventListener("resize", () => {
      const nextW = window.innerWidth;
      renderer.setSize(nextW, H);
      cam.aspect = nextW / H;
      cam.updateProjectionMatrix();
    });
  } catch (e) {
    console.log("Hero WebGL fallback:", e);
  }
}

/* ============================================================
LIQUID RIPPLE
============================================================ */
function setupRippleCanvas() {
  const canvas = document.getElementById("ripple-canvas");

  if (!canvas) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

const ripples = [];

function triggerRipple(x, y) {
  const canvas = document.getElementById("ripple-canvas");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  ripples.push({
    x,
    y,
    r: 0,
    maxR: 80,
    alpha: 0.5,
    t: 0
  });

  if (ripples.length === 1) {
    animRipples(ctx);
  }
}

function animRipples(ctx) {
  if (!ripples.length) return;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];

    rp.r += 3.5;
    rp.alpha -= 0.025;
    rp.t++;

    ctx.beginPath();
    ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 122, 0, ${Math.max(0, rp.alpha)})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (rp.r > 20) {
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r * 0.55, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 140, 26, ${Math.max(0, rp.alpha * 0.5)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (rp.alpha <= 0) {
      ripples.splice(i, 1);
    }
  }

  if (ripples.length) {
    requestAnimationFrame(() => animRipples(ctx));
  } else {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}

/* ============================================================
BACKEND STATUS
============================================================ */
async function checkBackendStatus() {
  const el = document.getElementById("backend-status");
  const textEl = el?.querySelector(".status-text");

  if (!el) return;

  el.classList.remove("online", "sleeping");

  if (textEl) {
    textEl.textContent = "HF Backend...";
  }

  try {
    const controller = new AbortController();

    setTimeout(() => {
      controller.abort();
    }, 6000);

    const res = await fetch(`${API_BASE}/health`, {
      signal: controller.signal
    });

    if (!res.ok) throw new Error("non-ok");

    el.classList.add("online");

    if (textEl) {
      textEl.textContent = "Backend Online";
    }
  } catch {
    el.classList.add("sleeping");

    if (textEl) {
      textEl.textContent = "Backend Sleeping";
    }
  }
}

/* ============================================================
API HELPERS
============================================================ */
function getAuthHeaders() {
  const token = localStorage.getItem("jwt");

  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  }

  return {
    "Content-Type": "application/json"
  };
}

async function apiGetProducts() {
  try {
    const controller = new AbortController();

    setTimeout(() => {
      controller.abort();
    }, 5000);

    const res = await fetch(`${API_BASE}/api/products`, {
      headers: getAuthHeaders(),
      signal: controller.signal
    });

    if (!res.ok) throw new Error();

    return await res.json();
  } catch {
    return null;
  }
}

async function apiPostProduct(product) {
  try {
    const controller = new AbortController();

    setTimeout(() => {
      controller.abort();
    }, 5000);

    const res = await fetch(`${API_BASE}/api/products`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
      signal: controller.signal
    });

    if (!res.ok) throw new Error();

    return await res.json();
  } catch {
    return null;
  }
}

async function apiPutProduct(id, product) {
  try {
    const controller = new AbortController();

    setTimeout(() => {
      controller.abort();
    }, 5000);

    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
      signal: controller.signal
    });

    if (!res.ok) throw new Error();

    return await res.json();
  } catch {
    return null;
  }
}

async function apiDeleteProduct(id) {
  try {
    const controller = new AbortController();

    setTimeout(() => {
      controller.abort();
    }, 5000);

    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      signal: controller.signal
    });

    return res.ok;
  } catch {
    return false;
  }
}

/* ============================================================
SCREEN NAVIGATION
============================================================ */
function showScreen(name) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });

  const target = document.getElementById(`screen-${name}`);

  if (target) {
    target.classList.add("active");
  }

  currentScreen = name;

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.screen === name);
  });

  if (name === "cart") renderCart();
  if (name === "profile") {
    updateOrderCount();
    setupGoogleLogin();
  }
  if (name === "admin") setupAdminScreen();

  if (window.lucide) {
    lucide.createIcons();
  }

  window.scrollTo(0, 0);
}

/* ============================================================
PRODUCT RENDERING
============================================================ */
function getFilteredProducts() {
  return products.filter((p) => {
    const catMatch = activeCategory === "All" || p.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();

    const searchMatch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      String(p.description || "").toLowerCase().includes(q);

    return catMatch && searchMatch;
  });
}

function renderProducts() {
  const grid = document.getElementById("product-grid");
  const titleEl = document.getElementById("section-title");
  const countEl = document.getElementById("section-count");

  if (!grid) return;

  const filtered = getFilteredProducts();

  if (titleEl) {
    titleEl.textContent = activeCategory === "All" ? "All Items" : activeCategory;
  }

  if (countEl) {
    countEl.textContent = `${filtered.length} item${filtered.length !== 1 ? "s" : ""}`;
  }

  if (!filtered.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px 0;color:var(--text-muted);">
        <div style="font-size:40px;margin-bottom:12px;">🔍</div>
        <p style="font-size:14px;">No items found</p>
      </div>
    `;

    return;
  }

  grid.innerHTML = filtered.map((p) => buildProductCard(p)).join("");

  grid.querySelectorAll(".product-card").forEach((card) => {
    const id = card.dataset.id;

    card.addEventListener("click", (e) => {
      if (e.target.closest(".add-btn") || e.target.closest(".fav-btn")) return;

      const rect = card.getBoundingClientRect();
      triggerRipple(rect.left + rect.width / 2, rect.top + rect.height / 2);
      openProductModal(id);
    });

    card.querySelector(".add-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerRipple(e.clientX, e.clientY);
      addToCart(id);
    });

    card.querySelector(".fav-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(id);
    });
  });

  if (window.lucide) {
    lucide.createIcons();
  }
}

function buildProductCard(p) {
  const isFav = favorites.has(p.id);

  return `
    <div class="product-card ${p.available ? "" : "unavailable"}" data-id="${p.id}">
      <div class="product-img-wrap">
        <img
          src="${p.image}"
          alt="${p.name}"
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=60'"
        />

        <button class="fav-btn ${isFav ? "active" : ""}" data-id="${p.id}" aria-label="Favorite ${p.name}">
          <i data-lucide="heart"></i>
        </button>

        ${
          !p.available
            ? `
              <div style="position:absolute;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:11px;font-family:var(--font-mono);color:#ff4d6d;letter-spacing:.05em;">
                SOLD OUT
              </div>
            `
            : ""
        }
      </div>

      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-cat">${p.category}</div>

        <div class="product-footer">
          <span class="product-price">$${parseFloat(p.price).toFixed(2)}</span>

          ${
            p.available
              ? `
                <button class="add-btn" data-id="${p.id}" aria-label="Add ${p.name} to cart">
                  <i data-lucide="plus"></i>
                </button>
              `
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

/* ============================================================
PRODUCT MODAL
============================================================ */
function openProductModal(id) {
  const p = products.find((x) => x.id === id);

  if (!p) return;

  const modal = document.getElementById("product-modal");
  const content = document.getElementById("modal-content");
  const isFav = favorites.has(p.id);

  if (!modal || !content) return;

  content.innerHTML = `
    <div class="modal-product-img">
      <img
        src="${p.image}"
        alt="${p.name}"
        onerror="this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=60'"
      />
    </div>

    <div class="modal-product-name">${p.name}</div>
    <div class="modal-product-cat">${p.category}</div>

    <p class="modal-product-desc">
      ${p.description || "A delicious item from Trey Burgers."}
    </p>

    <div class="modal-product-footer">
      <span class="modal-price">$${parseFloat(p.price).toFixed(2)}</span>

      ${
        p.available
          ? `
            <button class="modal-add-btn" id="modal-add-btn" data-id="${p.id}">
              <i data-lucide="plus"></i>
              Add to Cart
            </button>
          `
          : `
            <span style="font-size:12px;color:#ff4d6d;font-family:var(--font-mono);">
              SOLD OUT
            </span>
          `
      }
    </div>

    <div style="display:flex;gap:10px;margin-top:14px;">
      <button class="btn-ghost" id="modal-fav-btn" data-id="${p.id}" style="flex:1;display:flex;align-items:center;justify-content:center;gap:8px;">
        <i data-lucide="heart" style="width:14px;height:14px;${isFav ? "color:#ff4d6d;fill:#ff4d6d;" : ""}"></i>
        ${isFav ? "Unfavorite" : "Favorite"}
      </button>
    </div>
  `;

  modal.classList.remove("hidden");

  if (window.lucide) {
    lucide.createIcons();
  }

  document.getElementById("modal-add-btn")?.addEventListener("click", () => {
    addToCart(id);
    closeModal("product-modal");
  });

  document.getElementById("modal-fav-btn")?.addEventListener("click", () => {
    toggleFavorite(id);
    closeModal("product-modal");
  });
}

function closeModal(id) {
  const modal = document.getElementById(id);

  if (modal) {
    modal.classList.add("hidden");
  }
}

/* ============================================================
CART
============================================================ */
function addToCart(id) {
  const p = products.find((x) => x.id === id);

  if (!p || !p.available) return;

  const existing = cart.find((x) => x.id === id);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      qty: 1
    });
  }

  saveCart();
  updateCartBadge();
  showToast(`🍔 ${p.name} added!`);
}

function removeFromCart(id) {
  cart = cart.filter((x) => x.id !== id);
  saveCart();
  updateCartBadge();
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find((x) => x.id === id);

  if (!item) return;

  item.qty += delta;

  if (item.qty <= 0) {
    removeFromCart(id);
  } else {
    saveCart();
    updateCartBadge();
    renderCart();
  }
}

function updateCartBadge() {
  const total = cart.reduce((s, i) => s + i.qty, 0);

  ["cart-badge", "cart-badge-nav"].forEach((id) => {
    const el = document.getElementById(id);

    if (el) {
      el.textContent = total;
      el.style.display = total > 0 ? "flex" : "none";
    }
  });
}

function renderCart() {
  const list = document.getElementById("cart-items-list");
  const emptyEl = document.getElementById("cart-empty");
  const summaryEl = document.getElementById("cart-summary");

  if (!list) return;

  if (!cart.length) {
    list.innerHTML = "";
    emptyEl?.classList.remove("hidden");
    summaryEl?.classList.add("hidden");
    return;
  }

  emptyEl?.classList.add("hidden");
  summaryEl?.classList.remove("hidden");

  list.innerHTML = cart
    .map((item) => {
      return `
        <div class="cart-item" data-id="${item.id}">
          <div class="cart-item-img">
            <img
              src="${item.image}"
              alt="${item.name}"
              onerror="this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&q=60'"
            />
          </div>

          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">$${(parseFloat(item.price) * item.qty).toFixed(2)}</div>
          </div>

          <div class="qty-controls">
            <button class="qty-btn minus" data-id="${item.id}" data-delta="-1">
              <i data-lucide="minus"></i>
            </button>

            <span class="qty-num">${item.qty}</span>

            <button class="qty-btn plus" data-id="${item.id}" data-delta="1">
              <i data-lucide="plus"></i>
            </button>
          </div>

          <button class="remove-btn" data-remove="${item.id}">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;
    })
    .join("");

  list.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      changeQty(btn.dataset.id, parseInt(btn.dataset.delta, 10));
    });
  });

  list.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      removeFromCart(btn.dataset.remove);
    });
  });

  if (window.lucide) {
    lucide.createIcons();
  }

  updateCartTotals();
}

function updateCartTotals() {
  const subtotal = cart.reduce((s, i) => s + parseFloat(i.price) * i.qty, 0);
  const discount = subtotal * discountRate;
  const total = subtotal - discount + DELIVERY_FEE;

  const setEl = (id, val) => {
    const el = document.getElementById(id);

    if (el) {
      el.textContent = val;
    }
  };

  setEl("subtotal-val", `$${subtotal.toFixed(2)}`);
  setEl("delivery-val", `$${DELIVERY_FEE.toFixed(2)}`);
  setEl("discount-val", `-$${discount.toFixed(2)}`);
  setEl("total-val", `$${total.toFixed(2)}`);

  const discLine = document.getElementById("discount-line");

  if (discLine) {
    discLine.classList.toggle("hidden", discountRate === 0);
  }
}

/* ============================================================
CHECKOUT / PAYMENT SIMULATION
============================================================ */
function simulatePayment() {
  if (!cart.length) {
    showToast("Cart is empty!");
    return;
  }

  const subtotal = cart.reduce((s, i) => s + parseFloat(i.price) * i.qty, 0);
  const discount = subtotal * discountRate;
  const total = subtotal - discount + DELIVERY_FEE;
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  const receipt = document.getElementById("payment-receipt");

  if (receipt) {
    receipt.innerHTML = `
      <div>${itemCount} item${itemCount !== 1 ? "s" : ""} ordered</div>
      <div>Subtotal: $${subtotal.toFixed(2)}</div>
      ${discount > 0 ? `<div>Discount: -$${discount.toFixed(2)}</div>` : ""}
      <div>Delivery: $${DELIVERY_FEE.toFixed(2)}</div>
      <div class="receipt-total">Total Charged: $${total.toFixed(2)}</div>
    `;
  }

  document.getElementById("payment-modal")?.classList.remove("hidden");

  if (window.lucide) {
    lucide.createIcons();
  }

  orderCount++;
  localStorage.setItem("tb_orders", orderCount.toString());
}

/* ============================================================
FAVORITES
============================================================ */
function toggleFavorite(id) {
  if (favorites.has(id)) {
    favorites.delete(id);
    showToast("Removed from favorites");
  } else {
    favorites.add(id);
    showToast("❤️ Added to favorites");
  }

  saveFavorites();
  updateFavCount();

  document.querySelectorAll(`.fav-btn[data-id="${id}"]`).forEach((b) => {
    b.classList.toggle("active", favorites.has(id));
  });

  renderProducts();

  if (window.lucide) {
    lucide.createIcons();
  }
}

function updateFavCount() {
  const el = document.getElementById("fav-count");

  if (el) {
    el.textContent = favorites.size;
  }
}

function updateOrderCount() {
  const el = document.getElementById("order-count");

  if (el) {
    el.textContent = orderCount;
  }

  updateFavCount();
}

/* ============================================================
SCROLL TO PRODUCTS
============================================================ */
function scrollToProducts() {
  const grid = document.getElementById("product-grid");

  if (grid) {
    grid.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

/* ============================================================
ADMIN / CMS
============================================================ */
function setupAdminScreen() {
  if (adminUnlocked) {
    showAdminContent();
  } else {
    document.getElementById("admin-pin-gate")?.classList.remove("hidden");
    document.getElementById("admin-content")?.classList.add("hidden");
    pinBuffer = "";
    updatePinDots();
  }
}

function updatePinDots() {
  const dots = document.querySelectorAll("#pin-dots span");

  dots.forEach((dot, i) => {
    dot.classList.toggle("filled", i < pinBuffer.length);
  });
}

function handlePinKey(val) {
  if (val === "clear") {
    pinBuffer = pinBuffer.slice(0, -1);
  } else if (val === "ok") {
    if (pinBuffer === ADMIN_PIN) {
      adminUnlocked = true;
      showAdminContent();
    } else {
      showToast("❌ Incorrect PIN");
      pinBuffer = "";
    }
  } else if (pinBuffer.length < 4) {
    pinBuffer += val;

    if (pinBuffer.length === 4) {
      setTimeout(() => handlePinKey("ok"), 200);
    }
  }

  updatePinDots();
}

function showAdminContent() {
  document.getElementById("admin-pin-gate")?.classList.add("hidden");
  document.getElementById("admin-content")?.classList.remove("hidden");
  renderCMSList();
}

function renderCMSList() {
  const list = document.getElementById("cms-product-list");

  if (!list) return;

  list.innerHTML = products
    .map((p) => {
      return `
        <div class="cms-item" data-id="${p.id}">
          <div class="cms-item-img">
            <img
              src="${p.image}"
              alt="${p.name}"
              onerror="this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&q=60'"
            />
          </div>

          <div class="cms-item-info">
            <div class="cms-item-name">${p.name}</div>

            <div class="cms-item-meta">
              <span class="cms-item-cat">${p.category}</span>
              <span class="cms-item-price">$${parseFloat(p.price).toFixed(2)}</span>
              <span class="cms-avail-badge ${p.available ? "yes" : "no"}">
                ${p.available ? "On" : "Off"}
              </span>
            </div>
          </div>

          <div class="cms-item-actions">
            <button class="cms-edit-btn" data-id="${p.id}">
              <i data-lucide="edit"></i>
            </button>

            <button class="cms-delete-btn" data-id="${p.id}">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  list.querySelectorAll(".cms-edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openCMSModal(btn.dataset.id);
    });
  });

  list.querySelectorAll(".cms-delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      deleteProduct(btn.dataset.id);
    });
  });

  if (window.lucide) {
    lucide.createIcons();
  }
}

function openCMSModal(editId = null) {
  editingProductId = editId;

  const modal = document.getElementById("cms-modal");
  const title = document.getElementById("cms-modal-title");

  if (!modal || !title) return;

  if (editId) {
    const p = products.find((x) => x.id === editId);

    if (!p) return;

    title.textContent = "Edit Product";

    document.getElementById("cms-edit-id").value = p.id;
    document.getElementById("cms-name").value = p.name;
    document.getElementById("cms-category").value = p.category;
    document.getElementById("cms-price").value = p.price;
    document.getElementById("cms-image").value = p.image;
    document.getElementById("cms-desc").value = p.description || "";
    document.getElementById("cms-available").checked = p.available;
  } else {
    title.textContent = "Add Product";

    ["cms-edit-id", "cms-name", "cms-price", "cms-image", "cms-desc"].forEach((id) => {
      const el = document.getElementById(id);

      if (el) {
        el.value = "";
      }
    });

    const avail = document.getElementById("cms-available");

    if (avail) {
      avail.checked = true;
    }

    const cat = document.getElementById("cms-category");

    if (cat) {
      cat.value = "Burgers";
    }
  }

  modal.classList.remove("hidden");

  if (window.lucide) {
    lucide.createIcons();
  }
}

async function saveCMSProduct() {
  const name = document.getElementById("cms-name").value.trim();
  const category = document.getElementById("cms-category").value;
  const price = parseFloat(document.getElementById("cms-price").value);
  const image = document.getElementById("cms-image").value.trim();
  const desc = document.getElementById("cms-desc").value.trim();
  const available = document.getElementById("cms-available").checked;

  if (!name || Number.isNaN(price) || price < 0) {
    showToast("⚠️ Please fill all required fields");
    return;
  }

  const productData = {
    name,
    category,
    price,
    image: image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=75",
    description: desc,
    available
  };

  if (editingProductId) {
    const idx = products.findIndex((x) => x.id === editingProductId);

    if (idx !== -1) {
      products[idx] = {
        ...products[idx],
        ...productData
      };

      apiPutProduct(editingProductId, productData);
      showToast("✅ Product updated");
    }
  } else {
    const newId = "p" + Date.now();

    const newProduct = {
      id: newId,
      ...productData
    };

    products.push(newProduct);
    apiPostProduct(newProduct);
    showToast("✅ Product added");
  }

  saveProducts();
  closeModal("cms-modal");
  renderCMSList();
  renderProducts();
}

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;

  products = products.filter((x) => x.id !== id);

  saveProducts();

  apiDeleteProduct(id);

  showToast("🗑️ Product deleted");

  renderCMSList();
  renderProducts();

  cart = cart.filter((x) => x.id !== id);

  saveCart();
  updateCartBadge();
}

/* ============================================================
EXPORT / IMPORT
============================================================ */
function exportProducts() {
  const json = JSON.stringify(products, null, 2);
  const blob = new Blob([json], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "trey-burgers-products.json";
  a.click();

  URL.revokeObjectURL(url);

  showToast("📦 Products exported");
}

function importProducts(file) {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      if (!Array.isArray(data)) throw new Error();

      products = data;

      saveProducts();
      renderProducts();

      showToast(`✅ Imported ${data.length} products`);
    } catch {
      showToast("❌ Invalid JSON file");
    }
  };

  reader.readAsText(file);
}

/* ============================================================
TOAST
============================================================ */
let toastTimeout = null;

function showToast(msg, type = "orange") {
  let toast = document.getElementById("app-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "app-toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.className = `toast ${type}`;

  void toast.offsetWidth;

  toast.classList.add("show");

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

/* ============================================================
EVENT LISTENERS
============================================================ */
function setupEventListeners() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.onclick = () => {
      showScreen(btn.dataset.screen);
    };
  });

  document.getElementById("cart-icon-btn")?.addEventListener("click", () => {
    showScreen("cart");
  });

  const categoryPills = document.getElementById("category-pills");

  if (categoryPills && !categoryPills.dataset.ready) {
    categoryPills.dataset.ready = "true";

    categoryPills.addEventListener("click", (e) => {
      const pill = e.target.closest(".pill");

      if (!pill) return;

      document.querySelectorAll("#category-pills .pill").forEach((p) => {
        p.classList.remove("active");
      });

      pill.classList.add("active");

      activeCategory = pill.dataset.cat || "All";

      renderProducts();

      if (window.lucide) {
        lucide.createIcons();
      }
    });
  }

  const searchInput = document.getElementById("search-input");

  if (searchInput && !searchInput.dataset.ready) {
    searchInput.dataset.ready = "true";

    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderProducts();
    });
  }

  document.getElementById("clear-cart-btn")?.addEventListener("click", () => {
    if (!cart.length) return;

    cart = [];

    saveCart();
    updateCartBadge();
    renderCart();

    showToast("🗑️ Cart cleared");
  });

  document.getElementById("promo-apply-btn")?.addEventListener("click", () => {
    const code = document.getElementById("promo-input")?.value.trim().toUpperCase();

    if (PROMO_CODES[code]) {
      discountRate = PROMO_CODES[code];
      showToast(`🎉 ${Math.round(discountRate * 100)}% discount applied!`);
    } else {
      discountRate = 0;
      showToast("❌ Invalid promo code");
    }

    updateCartTotals();
  });

  document.getElementById("checkout-btn")?.addEventListener("click", simulatePayment);

  document.getElementById("payment-done-btn")?.addEventListener("click", () => {
    closeModal("payment-modal");

    cart = [];
    discountRate = 0;

    saveCart();
    updateCartBadge();
    showScreen("home");

    showToast("🎉 Order placed! Enjoy your meal.");
  });

  document.getElementById("modal-close-btn")?.addEventListener("click", () => {
    closeModal("product-modal");
  });

  document.getElementById("cms-modal-close")?.addEventListener("click", () => {
    closeModal("cms-modal");
  });

  document.getElementById("cms-cancel-btn")?.addEventListener("click", () => {
    closeModal("cms-modal");
  });

  document.getElementById("product-modal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("product-modal")) {
      closeModal("product-modal");
    }
  });

  document.getElementById("cms-modal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("cms-modal")) {
      closeModal("cms-modal");
    }
  });

  document.getElementById("cms-add-btn")?.addEventListener("click", () => {
    if (!adminUnlocked) return;
    openCMSModal(null);
  });

  document.getElementById("cms-save-btn")?.addEventListener("click", saveCMSProduct);

  document.querySelectorAll(".pin-key").forEach((key) => {
    if (key.dataset.ready) return;

    key.dataset.ready = "true";

    key.addEventListener("click", () => {
      handlePinKey(key.dataset.val);
    });
  });

  document.getElementById("export-btn")?.addEventListener("click", exportProducts);

  document.getElementById("import-btn-trigger")?.addEventListener("click", () => {
    document.getElementById("import-file-input")?.click();
  });

  document.getElementById("import-file-input")?.addEventListener("change", (e) => {
    if (e.target.files[0]) {
      importProducts(e.target.files[0]);
    }
  });
}

/* ============================================================
GLOBAL FUNCTIONS FOR HTML onclick
============================================================ */
window.showScreen = showScreen;
window.scrollToProducts = scrollToProducts;
