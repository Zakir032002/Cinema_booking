// CinemaBook - Cinema Seat Booking System (web front end)
// All the logic is in the Java backend (see the backend folder).
// This file only sends the forms to the backend and shows the result.

// Address of the Java backend. Change this if the backend runs somewhere else.
const API_URL = "http://localhost:8080";

// ================= Helper functions =================

// Escape text so user input cannot break the page
function esc(text) {
  return String(text).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const ok = text => `<p class="ok">${esc(text)}</p>`;
const fail = text => `<p class="error">${esc(text)}</p>`;

// Table with a header row
function table(headers, rows) {
  const head = headers.map(h => `<th>${esc(h)}</th>`).join("");
  const body = rows.map(r => "<tr>" + r.map(c => `<td>${esc(c)}</td>`).join("") + "</tr>").join("");
  return `<table><tr>${head}</tr>${body}</table>`;
}

// Table for one record: [["Label", value], ...]
function details(pairs) {
  return "<table>" + pairs.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("") + "</table>";
}

// Turn the JSON answer of the backend into HTML
function render(result) {
  let html = "";
  if (result.message) html += result.ok ? ok(result.message) : fail(result.message);
  if (result.columns) html += table(result.columns, result.rows);
  if (result.details) html += details(result.details);
  if (result.note) html += `<p>${esc(result.note)}</p>`;
  return html;
}

// ================= Talking to the backend =================

// Each form in index.html has data-action="<name>"  ->  POST <API_URL>/api/<name>
async function callBackend(action, values) {
  const response = await fetch(API_URL + "/api/" + action, {
    method: "POST",
    body: new URLSearchParams(values)
  });
  return response.json();
}

// Fill the movie and screen drop-downs of the booking form
async function fillDropdowns() {
  const movieSelect = document.getElementById("movieSelect");
  const screenSelect = document.getElementById("screenSelect");
  try {
    const response = await fetch(API_URL + "/api/options");
    const options = await response.json();
    const toOptions = list => list.map(o => `<option value="${esc(o.name)}">${esc(o.label)}</option>`).join("");
    movieSelect.innerHTML = toOptions(options.movies);
    screenSelect.innerHTML = toOptions(options.screens);
  } catch (error) {
    movieSelect.innerHTML = "";
    screenSelect.innerHTML = "";
  }
}

// ================= Page behaviour =================

// Show one page of the menu and hide the others
function showView(name) {
  document.querySelectorAll(".view").forEach(v => { v.hidden = v.id !== "view-" + name; });
  document.querySelectorAll(".out").forEach(o => { o.innerHTML = ""; });
  if (name === "cust-booking") fillDropdowns();
  window.scrollTo(0, 0);
}

// Menu buttons
document.addEventListener("click", e => {
  const button = e.target.closest("[data-view]");
  if (button) showView(button.dataset.view);
});

// Forms
document.addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target;
  const values = Object.fromEntries(new FormData(form));
  for (const key in values) values[key] = values[key].trim();
  const out = form.querySelector(".out");

  try {
    const result = await callBackend(form.dataset.action, values);

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
