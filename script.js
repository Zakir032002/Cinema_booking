// CinemaBook - Cinema Seat Booking System (web front end)
// All the logic is in the Java backend (see the backend folder).
// This file shows the pages and sends requests to the backend.

// Address of the Java backend. Change this if the backend runs somewhere else.
const API_URL = "http://localhost:8080";
const MAX_SEATS = 10;
const STORAGE_KEY = "cinemabook_customer";

// What the page currently knows
const state = {
  movies: [],          // [{id, name, genre, language, duration}]
  screens: [],         // [{id, type, seats, time}]
  available: {},       // screen type -> free seats
  price: 250,          // ticket price (comes from the backend)
  customer: null,      // name of the signed-in customer
  movie: null,         // selected movie
  screen: null,        // selected screen (show)
  seats: [],           // selected seat numbers
  search: null,        // {keyword, ids} while a search is shown
  genre: "All",
  language: "All",
  pending: null,       // what to do after signing in
  tickets: []          // last confirmed tickets
};

const $ = id => document.getElementById(id);

// ================= Helper functions =================

// Escape text so user input cannot break the page
function esc(text) {
  return String(text).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const ok = text => `<p class="ok">${esc(text)}</p>`;
const fail = text => `<p class="error">${esc(text)}</p>`;

function table(headers, rows) {
  const head = headers.map(h => `<th>${esc(h)}</th>`).join("");
  const body = rows.map(r => "<tr>" + r.map(c => `<td>${esc(c)}</td>`).join("") + "</tr>").join("");
  return `<table><tr>${head}</tr>${body}</table>`;
}

// Table for one record: [["Label", value], ...]
function details(pairs) {
  return "<table>" + pairs.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("") + "</table>";
}

// Turn the JSON answer of the backend into HTML (used by the admin forms)
function render(result) {
  let html = "";
  if (result.message) html += result.ok ? ok(result.message) : fail(result.message);
  if (result.columns) html += table(result.columns, result.rows);
  if (result.details) html += details(result.details);
  if (result.note) html += `<p>${esc(result.note)}</p>`;
  return html;
}

// Value of one "Label" row in a details result
function detail(result, label) {
  const pair = (result.details || []).find(d => d[0] === label);
  return pair ? pair[1] : "";
}

function toast(text, isError) {
  const box = $("toast");
  box.textContent = text;
  box.className = "toast" + (isError ? " error" : "");
  box.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { box.hidden = true; }, 3500);
}

// A poster colour made from the movie name (there are no poster images)
function posterStyle(name) {
  let hue = 0;
  for (const c of name) hue = (hue * 31 + c.charCodeAt(0)) % 360;
  return `background:linear-gradient(160deg,hsl(${hue} 65% 38%),hsl(${(hue + 50) % 360} 70% 18%))`;
}

const rupee = amount => "₹" + amount;

// ================= Talking to the backend =================

// Demo mode = the page runs a copy of the backend in the browser (demo.js).
// It is used only when the Java backend cannot be reached. An https page (such as GitHub Pages)
// cannot call a backend on "localhost", so it starts in demo mode directly.
let demoMode = location.protocol === "https:" && API_URL.startsWith("http://localhost");

function showDemoBanner() {
  $("demoBanner").hidden = false;
}

// POST <API_URL>/api/<action>  ->  JSON answer
async function api(action, values) {
  if (!demoMode) {
    try {
      const response = await fetch(API_URL + "/api/" + action, {
        method: "POST",
        body: new URLSearchParams(values || {})
      });
      return await response.json();
    } catch (error) {
      demoMode = true; // Java backend not reachable: switch to demo mode
    }
  }
  showDemoBanner();
  return window.demoApi(action, values);
}

// Load movies, screens, free seats and the ticket price
async function loadCatalog() {
  const [movies, screens, availability, options] = await Promise.all([
    api("viewMovies"), api("viewScreens"), api("checkAvailability"), api("options")
  ]);
  state.movies = (movies.rows || []).map(r =>
    ({ id: Number(r[0]), name: r[1], genre: r[2], language: r[3], duration: parseInt(r[4], 10) }));
  state.screens = (screens.rows || []).map(r =>
    ({ id: Number(r[0]), type: r[1], seats: Number(r[2]), time: r[3] }));
  state.available = {};
  (availability.rows || []).forEach(r => { state.available[r[0]] = Number(r[3]); });
  state.price = options.price;
}

// ================= Pages =================

const loaders = { home: loadHome, bookings: loadBookings, profile: loadProfile };

// Show one page and hide the others
function showView(name) {
  document.querySelectorAll(".view").forEach(v => { v.hidden = v.id !== "view-" + name; });
  document.querySelectorAll(".out").forEach(o => { o.innerHTML = ""; });
  $("toast").hidden = true;
  window.scrollTo(0, 0);
  if (loaders[name]) loaders[name]();
}

// ---------- Home: movie list ----------
function movieCard(m) {
  return `<button class="movie-card" data-movie="${m.id}">
    <div class="poster" style="${posterStyle(m.name)}">${esc(m.name)}</div>
    <h4>${esc(m.name)}</h4>
    <p>${esc(m.genre)} &bull; ${esc(m.language)}</p>
  </button>`;
}

function chipRow(label, values, current, key) {
  return ["All"].concat(values).map(v =>
    `<button class="chip${v === current ? " active" : ""}" data-filter="${key}" data-value="${esc(v)}">${esc(v === "All" ? "All " + label : v)}</button>`
  ).join("");
}

async function loadHome() {
  try {
    await loadCatalog();
  } catch (error) {
    $("movieGrid").innerHTML = fail("Cannot reach the Java backend. Start it first (see README) and check API_URL in script.js.");
    return;
  }

  const unique = key => [...new Set(state.movies.map(m => m[key]))].sort();
  $("languageChips").innerHTML = chipRow("Languages", unique("language"), state.language, "language");
  $("genreChips").innerHTML = chipRow("Genres", unique("genre"), state.genre, "genre");

  let list;
  if (state.search) {
    list = state.movies.filter(m => state.search.ids.includes(m.id));
    $("homeTitle").textContent = `Results for "${state.search.keyword}"`;
  } else {
    list = state.movies.filter(m =>
      (state.genre === "All" || m.genre === state.genre) &&
      (state.language === "All" || m.language === state.language));
    $("homeTitle").textContent = "Recommended Movies";
  }
  $("clearSearch").hidden = !state.search;
  $("movieGrid").innerHTML = list.length
    ? list.map(movieCard).join("")
    : "<p class='muted'>No movies found.</p>";
}

// Header search -> SearchService.searchMovie in the backend
async function searchMovies(keyword) {
  try {
    const result = await api("searchMovie", { keyword });
    state.search = { keyword, ids: (result.rows || []).map(r => Number(r[0])) };
    showView("home");
  } catch (error) {
    toast("Cannot reach the Java backend.", true);
  }
}

// ---------- Movie page: list of shows ----------
async function openMovie(id) {
  state.movie = state.movies.find(m => m.id === id);
  const m = state.movie;
  $("movieHero").innerHTML = `<div class="movie-hero-inner">
    <div class="poster" style="${posterStyle(m.name)}">${esc(m.name)}</div>
    <div>
      <h1>${esc(m.name)}</h1>
      <span class="tag">${m.duration} min</span>
      <span class="tag">${esc(m.genre)}</span>
      <span class="tag">${esc(m.language)}</span>
    </div>
  </div>`;
  $("showList").innerHTML = "<p class='muted'>Loading shows...</p>";
  showView("movie");
  await refreshShows();
}

async function refreshShows() {
  try {
    await loadCatalog();
  } catch (error) {
    $("showList").innerHTML = fail("Cannot reach the Java backend.");
    return;
  }
  if (state.screens.length === 0) {
    $("showList").innerHTML = "<p class='muted'>No shows available.</p>";
    return;
  }
  $("showList").innerHTML = state.screens.map(s => {
    const free = state.available[s.type];
    const low = free <= s.seats * 0.1;
    return `<div class="card show-row">
      <div><h4>${esc(s.type)} screen</h4><span class="muted">${s.seats} seats</span></div>
      <button class="show-time${low ? " low" : ""}" data-screen="${s.id}" ${free === 0 ? "disabled" : ""}>
        ${esc(s.time)}<small>${free === 0 ? "Sold out" : free + " available"}</small>
      </button>
    </div>`;
  }).join("");
}

// ---------- Seat page ----------
async function openSeats(screenId) {
  state.screen = state.screens.find(s => s.id === screenId);
  state.seats = [];
  $("seatTitle").textContent = state.movie.name;
  $("seatSub").textContent = `${state.screen.type} screen | ${state.screen.time}`;
  $("seatGrid").innerHTML = "";
  updatePayBar();
  showView("seats");

  let map;
  try {
    map = await api("seats", { screen: state.screen.type });
  } catch (error) {
    $("seatGrid").innerHTML = fail("Cannot reach the Java backend.");
    return;
  }
  const booked = map.booked.map(s => s.toLowerCase());
  let html = "";
  for (let n = 1; n <= map.total; n++) {
    const sold = booked.includes(String(n));
    html += `<button class="seat${sold ? " booked" : ""}" data-seat="${n}" ${sold ? "disabled" : ""}>${n}</button>`;
  }
  $("seatGrid").innerHTML = html;
}

function toggleSeat(button) {
  const seat = button.dataset.seat;
  const index = state.seats.indexOf(seat);
  if (index >= 0) {
    state.seats.splice(index, 1);
  } else {
    if (state.seats.length >= MAX_SEATS) {
      toast(`You can select up to ${MAX_SEATS} seats.`, true);
      return;
    }
    state.seats.push(seat);
  }
  button.classList.toggle("selected", index < 0);
  updatePayBar();
}

function updatePayBar() {
  state.seats.sort((a, b) => a - b);
  $("payBar").hidden = state.seats.length === 0;
  $("paySummary").textContent = `Seats: ${state.seats.join(", ")}`;
  $("proceedBtn").textContent = `Pay ${rupee(state.seats.length * state.price)}`;
}

// ---------- Checkout ----------
function openCheckout() {
  const total = state.seats.length * state.price;
  $("orderSummary").innerHTML = `
    <h3>${esc(state.movie.name)}</h3>
    <p class="muted">${esc(state.screen.type)} screen | ${esc(state.screen.time)}</p>
    <div class="row"><span>Seats</span><span>${esc(state.seats.join(", "))}</span></div>
    <div class="row"><span>Tickets</span><span>${state.seats.length} x ${rupee(state.price)}</span></div>
    <div class="row"><span>Booked for</span><span>${esc(state.customer)}</span></div>
    <div class="row total"><span>Total</span><span>${rupee(total)}</span></div>`;
  $("payNowBtn").textContent = `Pay ${rupee(total)}`;
  $("payNowBtn").disabled = false;
  showView("checkout");
}

// Book every selected seat (Booking.bookTicket) and pay for it (Payment.makePayment)
async function payNow() {
  const method = document.querySelector("input[name=method]:checked").value;
  const out = $("checkoutOut");
  const button = $("payNowBtn");
  button.disabled = true;
  out.innerHTML = "<p class='muted'>Processing your booking...</p>";

  const tickets = [];
  try {
    // 1. Book the seats
    for (const seat of state.seats) {
      const booking = await api("bookTicket", {
        customerName: state.customer,
        movieName: state.movie.name,
        screenName: state.screen.type,
        seat
      });
      if (!booking.ok) {
        // Someone else took the seat: undo the seats booked so far
        for (const t of tickets) await api("cancelBooking", { id: t.bookingId });
        out.innerHTML = fail(`Seat ${seat}: ${booking.message} Please choose other seats.`);
        button.disabled = false;
        return;
      }
      tickets.push({ seat, bookingId: detail(booking, "Booking ID"), date: detail(booking, "Booking Date") });
    }

    // 2. Pay for each booking
    for (const t of tickets) {
      const payment = await api("makePayment", { bookingId: t.bookingId, method });
      if (!payment.ok) {
        out.innerHTML = fail(`Payment failed: ${payment.message} Your booking is saved, you can pay from My Bookings.`);
        button.disabled = false;
        return;
      }
      t.paymentId = detail(payment, "Payment ID");
      t.amount = detail(payment, "Amount");
      t.method = method;
    }
  } catch (error) {
    out.innerHTML = fail("Cannot reach the Java backend.");
    button.disabled = false;
    return;
  }

  state.tickets = tickets;
  $("ticketList").innerHTML = tickets.map(t => `
    <div class="card ticket">
      <h4>${esc(state.movie.name)}</h4>
      <p class="muted">${esc(state.screen.type)} screen | ${esc(state.screen.time)} | ${esc(t.date)}</p>
      <div class="row"><span>Seat</span><b>${esc(t.seat)}</b></div>
      <div class="row"><span>Booking ID</span><b>${esc(t.bookingId)}</b></div>
      <div class="row"><span>Payment ID</span><b>${esc(t.paymentId)}</b></div>
      <div class="row"><span>Paid (${esc(t.method)})</span><b>${esc(t.amount)}</b></div>
    </div>`).join("");
  showView("ticket");
}

// ---------- My bookings ----------
async function loadBookings() {
  const box = $("bookingList");
  if (!state.customer) {
    box.innerHTML = `<div class="card"><p>Please sign in to see your bookings.</p>
      <button class="btn small" data-signin>Sign in</button></div>`;
    return;
  }
  box.innerHTML = "<p class='muted'>Loading...</p>";

  let bookings, payments;
  try {
    await loadCatalog();
    bookings = await api("searchBooking", { keyword: state.customer });
    payments = await api("paymentReport");
  } catch (error) {
    box.innerHTML = fail("Cannot reach the Java backend.");
    return;
  }

  // searchBooking also matches movie names, so keep only this customer's bookings
  const mine = (bookings.rows || [])
    .filter(r => r[1].toLowerCase() === state.customer.toLowerCase())
    .reverse();
  const paid = {};
  (payments.rows || []).forEach(r => { paid[r[1]] = r; });

  if (mine.length === 0) {
    box.innerHTML = "<div class='card'><p class='muted'>You have no bookings yet.</p></div>";
    return;
  }
  box.innerHTML = mine.map(r => {
    const [id, , movie, screen, seat, date, status] = r;
    const show = state.screens.find(s => s.type.toLowerCase() === screen.toLowerCase());
    const payment = paid[id];
    const cancelled = status.toLowerCase() === "cancelled";

    let paymentInfo;
    if (cancelled) paymentInfo = "";
    else if (payment) paymentInfo = `<span class="badge green">Paid</span> ${esc(payment[2])} via ${esc(payment[3])} (Payment ID ${esc(payment[0])})`;
    else paymentInfo = `<span class="badge orange">Payment pending</span>`;

    let actions = "";
    if (!cancelled) {
      if (!payment) {
        actions += `<select id="method-${id}"><option>Card</option><option>UPI</option><option>Net Banking</option></select>
          <button class="btn small" data-pay="${id}">Pay ${rupee(state.price)}</button>`;
      }
      actions += `<button class="btn small" data-cancel="${id}" style="background:#777">Cancel booking</button>`;
    }
    return `<div class="card ticket">
      <h4>${esc(movie)} <span class="badge ${cancelled ? "red" : "green"}">${esc(status)}</span></h4>
      <p class="muted">${esc(screen)} screen${show ? " | " + esc(show.time) : ""} | Booked on ${esc(date)}</p>
      <div class="row"><span>Seat</span><b>${esc(seat)}</b></div>
      <div class="row"><span>Booking ID</span><b>${esc(id)}</b></div>
      <p>${paymentInfo}</p>
      <div class="booking-actions">${actions}</div>
    </div>`;
  }).join("");
}

async function cancelBooking(id) {
  try {
    const result = await api("cancelBooking", { id });
    toast(result.message, !result.ok);
    loadBookings();
  } catch (error) {
    toast("Cannot reach the Java backend.", true);
  }
}

async function payBooking(id) {
  const method = $("method-" + id).value;
  try {
    const result = await api("makePayment", { bookingId: id, method });
    toast(result.message, !result.ok);
    loadBookings();
  } catch (error) {
    toast("Cannot reach the Java backend.", true);
  }
}

// ---------- Profile ----------
async function loadProfile() {
  if (!state.customer) {
    $("profileCard").innerHTML = `<p>Please sign in to see your profile.</p>
      <button class="btn small" data-signin>Sign in</button>`;
    $("profileForm").hidden = true;
    return;
  }
  let result;
  try {
    result = await api("viewProfile", { name: state.customer });
  } catch (error) {
    $("profileCard").innerHTML = fail("Cannot reach the Java backend.");
    return;
  }
  if (!result.ok) {
    $("profileCard").innerHTML = fail(result.message);
    return;
  }
  $("profileCard").innerHTML = `<div class="avatar">${esc(state.customer.charAt(0).toUpperCase())}</div>` +
    details(result.details);
  const form = $("profileForm");
  form.hidden = false;
  form.newName.value = detail(result, "Name");
  form.newMobile.value = detail(result, "Mobile");
  form.newEmail.value = detail(result, "Email");
}

$("profileForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target;
  const out = form.querySelector(".out");
  try {
    const result = await api("updateProfile", {
      name: state.customer,
      newName: form.newName.value.trim(),
      newMobile: form.newMobile.value.trim(),
      newEmail: form.newEmail.value.trim()
    });
    if (result.ok) {
      setCustomer(form.newName.value.trim());
      await loadProfile();
      toast(result.message);
    } else {
      out.innerHTML = fail(result.message);
    }
  } catch (error) {
    out.innerHTML = fail("Cannot reach the Java backend.");
  }
});

// ================= Sign in / register =================

// Show "Sign in" or the customer's name in the top bar
function renderUser() {
  $("signInBtn").hidden = state.customer !== null;
  $("userMenu").hidden = state.customer === null;
  $("userName").textContent = state.customer ? "Hi, " + state.customer : "";
}

function setCustomer(name) {
  state.customer = name;
  try {
    if (name) localStorage.setItem(STORAGE_KEY, name);
    else localStorage.removeItem(STORAGE_KEY);
  } catch (error) { /* storage not available: ignore */ }
  renderUser();
}

// Run callback now if signed in, otherwise ask the customer to sign in first
function requireLogin(callback) {
  if (state.customer) {
    callback();
    return;
  }
  state.pending = callback;
  openAuth();
}

function openAuth() {
  $("authDialog").showModal();
}

function finishAuth() {
  const callback = state.pending;
  state.pending = null;
  $("authDialog").close();
  if (callback) callback();
  else if (!$("view-bookings").hidden) loadBookings();
  else if (!$("view-profile").hidden) loadProfile();
}

$("authClose").addEventListener("click", () => {
  state.pending = null;
  $("authDialog").close();
});

// Sign in = the customer must already exist (Customer.viewProfile)
$("signInForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target;
  const out = form.querySelector(".out");
  const name = form.elements.name.value.trim();
  try {
    const result = await api("viewProfile", { name });
    if (!result.ok) {
      out.innerHTML = fail(result.message + " Please register below.");
      return;
    }
    setCustomer(detail(result, "Name"));
    form.reset();
    finishAuth();
  } catch (error) {
    out.innerHTML = fail("Cannot reach the Java backend.");
  }
});

// Register (Customer.registerCustomer), then the customer is signed in
$("registerForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target;
  const out = form.querySelector(".out");
  const name = form.elements.name.value.trim();
  try {
    const result = await api("registerCustomer", {
      name, mobile: form.mobile.value.trim(), email: form.email.value.trim()
    });
    out.innerHTML = render(result);
    if (result.ok) {
      setCustomer(name);
      form.reset();
      out.innerHTML += `<button type="button" class="btn small" id="continueBtn">Continue</button>`;
      $("continueBtn").addEventListener("click", finishAuth);
    }
  } catch (error) {
    out.innerHTML = fail("Cannot reach the Java backend.");
  }
});

$("signInBtn").addEventListener("click", openAuth);
$("signOutBtn").addEventListener("click", () => {
  setCustomer(null);
  showView("home");
});

// ================= Clicks and forms =================

document.addEventListener("click", e => {
  const t = e.target;
  let el;
  if ((el = t.closest("[data-view]"))) return showView(el.dataset.view);
  if ((el = t.closest("[data-movie]"))) return openMovie(Number(el.dataset.movie));
  if ((el = t.closest("[data-screen]"))) return openSeats(Number(el.dataset.screen));
  if ((el = t.closest("[data-seat]"))) return toggleSeat(el);
  if ((el = t.closest("[data-cancel]"))) return cancelBooking(el.dataset.cancel);
  if ((el = t.closest("[data-pay]"))) return payBooking(el.dataset.pay);
  if (t.closest("[data-signin]")) return openAuth();

  // Genre / language chips
  if ((el = t.closest("[data-filter]"))) {
    state[el.dataset.filter] = el.dataset.value;
    state.search = null;
    return loadHome();
  }

  // Admin tabs
  if ((el = t.closest("[data-tab]"))) {
    document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b === el));
    document.querySelectorAll(".panel").forEach(p => { p.hidden = p.id !== "tab-" + el.dataset.tab; });
  }
});

$("proceedBtn").addEventListener("click", () => requireLogin(openCheckout));
$("payNowBtn").addEventListener("click", payNow);
$("clearSearch").addEventListener("click", () => { state.search = null; $("searchInput").value = ""; loadHome(); });

$("searchForm").addEventListener("submit", e => {
  e.preventDefault();
  const keyword = $("searchInput").value.trim();
  if (keyword === "") {
    state.search = null;
    showView("home");
  } else {
    searchMovies(keyword);
  }
});

// Forms with data-action (look-ups and the whole administrator portal):
// POST <API_URL>/api/<action> and show the answer under the form
document.addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target;
  if (!form.dataset.action) return;

  const values = Object.fromEntries(new FormData(form));
  for (const key in values) values[key] = values[key].trim();
  const out = form.querySelector(".out");

  try {
    const result = await api(form.dataset.action, values);

    // Correct password: open the administrator portal
    if (form.dataset.action === "adminLogin" && result.ok) {
      form.reset();
      showView("admin");
      return;
    }

    out.innerHTML = render(result);
    if (result.ok) form.reset();
  } catch (error) {
    out.innerHTML = fail("Cannot reach the Java backend. Start it first (see README) and check API_URL in script.js.");
  }
});

// ================= Start =================

(async function start() {
  // Remember the signed-in customer, but only if the backend still knows them
  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (error) { /* ignore */ }
  renderUser();
  if (saved) {
    try {
      const result = await api("viewProfile", { name: saved });
      if (result.ok) setCustomer(saved);
      else setCustomer(null); // the backend does not know this customer any more
    } catch (error) { /* backend is off: the home page shows the message */ }
  }
  showView("home");
})();
