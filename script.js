/* NagpurNosh - script.js
   Features: mess listing + search/filter, modal details, animated counters,
   form validation, registration table (localStorage), toast, back-to-top. */

"use strict";

/* ---------- Sample data ---------- */
const messes = [
  { id: 1, name: "Annapurna Tiffin Service", area: "Katol Road",   type: "veg",    price: 75,  rating: 4.6, emoji: "🍛", color: "linear-gradient(135deg,#14532d,#22c55e)", speciality: "Maharashtrian home-style thali", timing: "12:00 PM - 2:30 PM", delivery: "Free within 3 km" },
  { id: 2, name: "Saoji Spice Kitchen",      area: "Dharampeth",   type: "nonveg", price: 110, rating: 4.7, emoji: "🍗", color: "linear-gradient(135deg,#7f1d1d,#ef4444)", speciality: "Authentic Nagpur Saoji chicken and mutton", timing: "1:00 PM - 10:00 PM", delivery: "₹20 delivery" },
  { id: 3, name: "Gharkul Mess",             area: "Gittikhadan",  type: "veg",    price: 70,  rating: 4.3, emoji: "🥘", color: "linear-gradient(135deg,#c2410c,#fb923c)", speciality: "Unlimited roti, bhaji and varan-bhaat", timing: "11:30 AM - 3:00 PM", delivery: "Pickup or ₹10 delivery" },
  { id: 4, name: "Orange City Tiffins",      area: "Pratap Nagar", type: "veg",    price: 85,  rating: 4.5, emoji: "🍱", color: "linear-gradient(135deg,#ea580c,#fbbf24)", speciality: "Dabba service with 2 sabzi and sweet", timing: "12:00 PM - 2:00 PM", delivery: "Free within 2 km" },
  { id: 5, name: "Tadka Tales",              area: "Sadar",        type: "nonveg", price: 120, rating: 4.4, emoji: "🍳", color: "linear-gradient(135deg,#9a3412,#f97316)", speciality: "Egg curry, chicken thali and biryani", timing: "12:30 PM - 9:30 PM", delivery: "₹25 delivery" },
  { id: 6, name: "Satvik Bhojnalay",         area: "Manish Nagar", type: "veg",    price: 78,  rating: 4.2, emoji: "🥗", color: "linear-gradient(135deg,#065f46,#34d399)", speciality: "Jain and no-onion-garlic options", timing: "11:00 AM - 2:30 PM", delivery: "Free within 3 km" }
];

/* ---------- Helpers ---------- */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function showToast(message, kind = "success") {
  const toastEl = $("#appToast");
  toastEl.className = `toast align-items-center text-bg-${kind} border-0`;
  $("#toastMsg").textContent = message;
  bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3000 }).show();
}

function escapeHTML(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

/* ---------- Mess listing ---------- */
let activeFilter = "all";

function renderMesses() {
  const query = $("#searchBox").value.trim().toLowerCase();
  const grid = $("#messGrid");

  const filtered = messes.filter(m => {
    const matchesText = m.name.toLowerCase().includes(query) || m.area.toLowerCase().includes(query);
    let matchesFilter = true;
    if (activeFilter === "veg") matchesFilter = m.type === "veg";
    else if (activeFilter === "nonveg") matchesFilter = m.type === "nonveg";
    else if (activeFilter === "budget") matchesFilter = m.price < 80;
    return matchesText && matchesFilter;
  });

  grid.innerHTML = filtered.map(m => `
    <div class="col-md-6 col-lg-4">
      <div class="card mess-card h-100 shadow-sm">
        <div class="mess-banner" style="background:${m.color}" aria-hidden="true">${m.emoji}</div>
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-1">
            <h5 class="card-title mb-0">${m.name}</h5>
            <span class="${m.type === "veg" ? "veg-dot" : "nonveg-dot"}" title="${m.type === "veg" ? "Veg" : "Non-Veg"}"></span>
          </div>
          <p class="text-muted small mb-2"><i class="bi bi-geo-alt-fill text-danger me-1"></i>${m.area}, Nagpur</p>
          <p class="card-text small flex-grow-1">${m.speciality}</p>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="price">₹${m.price}<small class="text-muted fs-6 fw-normal"> / meal</small></span>
            <span class="badge text-bg-warning"><i class="bi bi-star-fill me-1"></i>${m.rating}</span>
          </div>
          <button class="btn btn-outline-success w-100" data-mess="${m.id}">View Details</button>
        </div>
      </div>
    </div>`).join("");

  $("#noResults").classList.toggle("d-none", filtered.length !== 0);
}

function openMessModal(id) {
  const m = messes.find(x => x.id === Number(id));
  if (!m) return;
  $("#messModalTitle").textContent = m.name;
  $("#messModalBody").innerHTML = `
    <div class="text-center fs-1 mb-2">${m.emoji}</div>
    <ul class="list-group list-group-flush">
      <li class="list-group-item d-flex justify-content-between"><span>Area</span><strong>${m.area}</strong></li>
      <li class="list-group-item d-flex justify-content-between"><span>Type</span><strong>${m.type === "veg" ? "Pure Veg" : "Veg and Non-Veg"}</strong></li>
      <li class="list-group-item d-flex justify-content-between"><span>Price</span><strong>₹${m.price} per meal</strong></li>
      <li class="list-group-item d-flex justify-content-between"><span>Timing</span><strong>${m.timing}</strong></li>
      <li class="list-group-item d-flex justify-content-between"><span>Delivery</span><strong>${m.delivery}</strong></li>
      <li class="list-group-item d-flex justify-content-between"><span>Rating</span><strong>${m.rating} / 5</strong></li>
    </ul>
    <p class="mt-3 mb-0 text-muted small">${m.speciality}</p>`;
  bootstrap.Modal.getOrCreateInstance($("#messModal")).show();
}

/* ---------- Registration table (localStorage) ---------- */
const STORE_KEY = "nagpurnosh_registrations";

function loadRegs() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
  catch { return []; }
}
function saveRegs(list) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch { /* storage unavailable */ }
}

function renderRegs() {
  const list = loadRegs();
  const body = $("#regBody");
  if (!list.length) {
    body.innerHTML = '<tr id="emptyRow"><td colspan="7" class="text-center text-muted">No registrations yet.</td></tr>';
    return;
  }
  body.innerHTML = list.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHTML(r.name)}</td>
      <td>${escapeHTML(r.area)}</td>
      <td>${escapeHTML(r.plan)}</td>
      <td>${escapeHTML(r.food)}</td>
      <td>${escapeHTML(r.meals)}</td>
      <td>₹${escapeHTML(String(r.budget))}</td>
    </tr>`).join("");
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // Mess grid
  renderMesses();
  $("#searchBox").addEventListener("input", renderMesses);
  $$("[data-filter]").forEach(btn => btn.addEventListener("click", () => {
    $$("[data-filter]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    renderMesses();
  }));
  $("#messGrid").addEventListener("click", e => {
    const btn = e.target.closest("[data-mess]");
    if (btn) openMessModal(btn.dataset.mess);
  });

  // Plan buttons pre-select the plan in the form
  $$(".plan-btn").forEach(btn => btn.addEventListener("click", () => {
    $("#plan").value = btn.dataset.plan;
  }));

  // Budget slider
  const budget = $("#budget");
  budget.addEventListener("input", () => { $("#budgetOut").textContent = budget.value; });

  // Form validation + submit
  const form = $("#regForm");
  form.addEventListener("submit", e => {
    e.preventDefault();
    e.stopPropagation();
    form.classList.add("was-validated");
    if (!form.checkValidity()) {
      showToast("Please fix the highlighted fields.", "danger");
      return;
    }
    const meals = $$(".meal-check:checked").map(c => c.value).join(", ") || "Lunch";
    const list = loadRegs();
    list.push({
      name: $("#fullName").value.trim(),
      area: $("#area").value,
      plan: $("#plan").value,
      food: $("input[name='food']:checked").value,
      meals,
      budget: budget.value
    });
    saveRegs(list);
    renderRegs();
    showToast("Registration successful! We will contact you soon.");
    form.reset();
    form.classList.remove("was-validated");
    $("#budgetOut").textContent = budget.value;
  });
  $("#resetBtn").addEventListener("click", () => {
    form.classList.remove("was-validated");
    setTimeout(() => { $("#budgetOut").textContent = budget.value; }, 0);
  });
  $("#clearAll").addEventListener("click", () => {
    if (confirm("Remove all saved registrations from this device?")) {
      saveRegs([]);
      renderRegs();
      showToast("All registrations cleared.", "secondary");
    }
  });
  renderRegs();

  // Animated counters
  const counters = $$("[data-count]");
  const countObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count);
      const duration = 1400;
      const start = performance.now();
      const tick = now => {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = Math.floor(p * target).toLocaleString("en-IN") + (p === 1 && target >= 100 ? "+" : "");
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach(c => countObserver.observe(c));

  // Reveal-on-scroll
  $$("section .card, .accordion").forEach(el => el.classList.add("reveal"));
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  $$(".reveal").forEach(el => revealObserver.observe(el));

  // Active nav link on scroll (scrollspy) + back-to-top
  const sections = $$("header[id], section[id]");
  const links = $$(".nn-navbar .nav-link");
  const toTop = $("#toTop");
  window.addEventListener("scroll", () => {
    const y = window.scrollY + 100;
    sections.forEach(sec => {
      if (y >= sec.offsetTop && y < sec.offsetTop + sec.offsetHeight) {
        links.forEach(l => l.classList.toggle("active", l.getAttribute("href") === "#" + sec.id));
      }
    });
    toTop.style.display = window.scrollY > 400 ? "block" : "none";
  });
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  // Close mobile menu after clicking a link
  $$(".nn-navbar .nav-link, .nn-navbar .btn").forEach(l => l.addEventListener("click", () => {
    const nav = $("#mainNav");
    if (nav.classList.contains("show")) bootstrap.Collapse.getOrCreateInstance(nav).hide();
  }));
});
