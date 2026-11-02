// CinemaBook - demo mode
// A small copy of the Java backend that runs inside the browser.
// script.js uses it ONLY when the Java backend cannot be reached (for example on GitHub Pages).
// It answers the same requests with the same JSON as the Java code, and keeps its data in
// this browser (localStorage). The real project logic is in the backend folder (Java).

(function () {
  const PRICE = 250;
  const STORE = "cinemabook_demo_data";
  const ADMIN_PASSWORD = "admin123";

  // ---------- Data (same sample data as the Java Main) ----------
  const data = {
    movies: [
      { id: 101, name: "Avengers: Endgame", genre: "Action", language: "English", duration: 181 },
      { id: 102, name: "Kalki 2898 AD", genre: "Sci-Fi", language: "Telugu", duration: 180 },
      { id: 103, name: "Pushpa 2", genre: "Action", language: "Telugu", duration: 200 },
      { id: 104, name: "3 Idiots", genre: "Comedy", language: "Hindi", duration: 170 },
      { id: 105, name: "Interstellar", genre: "Sci-Fi", language: "English", duration: 169 }
    ],
    screens: [
      { id: 101, type: "Extra Large", seats: 50, time: "Morning 8:00 AM" },
      { id: 102, type: "Large", seats: 100, time: "Morning 11:00 AM" },
      { id: 103, type: "Medium", seats: 150, time: "Afternoon 3:00 PM" },
      { id: 104, type: "Small", seats: 300, time: "Evening 6:00 PM" },
      { id: 105, type: "Very Small", seats: 500, time: "Midnight 12:00 AM" }
    ],
    customers: [],
    bookings: [],
    payments: []
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORE));
    if (saved && saved.movies) Object.assign(data, saved);
  } catch (error) { /* no saved data: use the sample data */ }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(data)); } catch (error) { /* ignore */ }
  }

  // ---------- Results (same JSON shape as Result.java) ----------
  const ok = (message = "") => ({ ok: true, message, note: "" });
  const fail = message => ({ ok: false, message, note: "" });
  const info = note => ({ ok: true, message: "", note });
  const withTable = (result, columns, rows) => {
    result.columns = columns;
    result.rows = rows.map(r => r.map(String));
    return result;
  };
  const withDetails = (result, pairs) => {
    result.details = pairs.map(([k, v]) => [k, String(v)]);
    return result;
  };
  const rupee = amount => "₹" + amount.toFixed(1);   // 250 -> "₹250.0" like Java

  // ---------- Helpers ----------
  const same = (a, b) => a.toLowerCase() === b.toLowerCase();
  const has = (text, keyword) => text.toLowerCase().includes(keyword.toLowerCase());

  // Like Integer.parseInt: anything that is not a whole number is an error
  function num(f, key) {
    const text = String(f[key] === undefined ? "" : f[key]).trim();
    if (!/^[+-]?\d+$/.test(text)) throw new Error("NaN");
    return parseInt(text, 10);
  }

  function generateId(isTaken) {
    let id;
    do { id = 1000 + Math.floor(Math.random() * 9000); } while (isTaken(id));
    return id;
  }

  const validMobile = m => /^[0-9]{10}$/.test(m);
  const validEmail = e => /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(e);

  const findMovie = id => data.movies.find(m => m.id === id);
  const findScreen = id => data.screens.find(s => s.id === id);
  const findScreenByName = name => data.screens.find(s => same(s.type, name));
  const findCustomer = name => data.customers.find(c => same(c.name, name));
  const findBooking = id => data.bookings.find(b => b.id === id);
  const findPayment = id => data.payments.find(p => p.id === id);
  const cancelled = b => same(b.status, "Cancelled");
  const bookedCount = screen =>
    data.bookings.filter(b => same(b.screen, screen.type) && !cancelled(b)).length;

  function bookingDetails(result, b) {
    return withDetails(result, [
      ["Booking ID", b.id], ["Customer", b.customer], ["Movie", b.movie], ["Screen", b.screen],
      ["Seat", b.seat], ["Booking Date", b.date], ["Status", b.status]
    ]);
  }

  function bookingTable(list) {
    return withTable(ok(), ["Booking ID", "Customer", "Movie", "Screen", "Seat", "Booking Date", "Status"],
      list.map(b => [b.id, b.customer, b.movie, b.screen, b.seat, b.date, b.status]));
  }

  function movieTable(list) {
    return withTable(ok(), ["Movie ID", "Name", "Genre", "Language", "Duration"],
      list.map(m => [m.id, m.name, m.genre, m.language, m.duration + " minutes"]));
  }

  const revenue = () => data.payments.filter(p => same(p.status, "Paid")).reduce((sum, p) => sum + p.amount, 0);
  const percent = screen => (screen.seats > 0 ? (bookedCount(screen) / screen.seats) * 100 : 0).toFixed(2) + "%";

  // ---------- Actions (same names as the Java backend: POST /api/<action>) ----------
  const actions = {
    // Customer
    registerCustomer(f) {
      if (!validMobile(f.mobile)) return fail("Invalid mobile number.");
      if (!validEmail(f.email)) return fail("Invalid email address.");
      if (findCustomer(f.name)) return fail("A customer with this name already exists.");
      const id = generateId(i => data.customers.some(c => c.id === i));
      data.customers.push({ id, name: f.name, mobile: f.mobile, email: f.email });
      const result = ok("Customer registered successfully.");
      result.note = "Your Customer ID is: " + id + ". Please keep this ID for your records.";
      return result;
    },
    updateProfile(f) {
      const customer = findCustomer(f.name);
      if (!customer) return fail("Customer not found.");
      if (!validMobile(f.newMobile)) return fail("Invalid mobile number.");
      if (!validEmail(f.newEmail)) return fail("Invalid email address.");
      customer.name = f.newName;
      customer.mobile = f.newMobile;
      customer.email = f.newEmail;
      return ok("Profile updated successfully.");
    },
    viewProfile(f) {
      const c = findCustomer(f.name);
      if (!c) return fail("Customer not found.");
      return withDetails(ok(), [["Customer ID", c.id], ["Name", c.name], ["Mobile", c.mobile], ["Email", c.email]]);
    },

    // Movies
    viewMovies() {
      if (data.movies.length === 0) return fail("No movies available.");
      return movieTable(data.movies);
    },
    searchMovie(f) {
      const found = data.movies.filter(m => has(m.name, f.keyword) || has(m.genre, f.keyword));
      if (found.length === 0) return fail("No matching movie found.");
      return withTable(ok(), ["Movie ID", "Name", "Genre", "Language"],
        found.map(m => [m.id, m.name, m.genre, m.language]));
    },
    addMovie(f) {
      const id = num(f, "id"), duration = num(f, "duration");
      if (findMovie(id)) return fail("Movie ID already exists.");
      if (duration <= 0) return fail("Duration must be greater than zero.");
      data.movies.push({ id, name: f.name, genre: f.genre, language: f.language, duration });
      return ok("Movie added successfully.");
    },
    updateMovie(f) {
      const id = num(f, "id"), duration = num(f, "duration");
      const movie = findMovie(id);
      if (!movie) return fail("Movie not found.");
      if (duration <= 0) return fail("Duration must be greater than zero.");
      Object.assign(movie, { name: f.name, genre: f.genre, language: f.language, duration });
      return ok("Movie updated successfully.");
    },

    // Booking
    bookTicket(f) {
      if (data.movies.length === 0) return fail("No movies available.");
      if (data.screens.length === 0) return fail("No screens available.");
      if (data.customers.length === 0) return fail("Please register as a customer first.");
      const customer = findCustomer(f.customerName);
      if (!customer) return fail("Customer not found.");
      const movie = data.movies.find(m => same(m.name, f.movieName));
      if (!movie) return fail("Movie not found.");
      const screen = findScreenByName(f.screenName);
      if (!screen) return fail("Screen not found.");
      if (f.seat.trim() === "") return fail("Seat number cannot be empty.");
      if (data.bookings.some(b => same(b.screen, f.screenName) && same(b.seat, f.seat) && !cancelled(b))) {
        return fail("This seat is already booked.");
      }
      const booking = {
        id: generateId(i => !!findBooking(i)), customer: customer.name, movie: movie.name,
        screen: screen.type, seat: f.seat, date: new Date().toLocaleDateString("en-CA"), status: "Confirmed"
      };
      data.bookings.push(booking);
      const result = bookingDetails(ok("Booking successful!"), booking);
      result.note = "Ticket Price: ₹" + PRICE;
      return result;
    },
    viewBooking(f) {
      const booking = findBooking(num(f, "id"));
      if (!booking) return fail("Booking not found.");
      return bookingDetails(ok(), booking);
    },
    cancelBooking(f) {
      const booking = findBooking(num(f, "id"));
      if (!booking) return fail("Booking not found.");
      if (cancelled(booking)) return fail("Booking is already cancelled.");
      booking.status = "Cancelled";
      return ok("Booking cancelled successfully.");
    },

    // Payment
    makePayment(f) {
      const bookingId = num(f, "bookingId");
      const booking = findBooking(bookingId);
      if (!booking) return fail("Booking not found.");
      if (cancelled(booking)) return fail("Cannot make payment for a cancelled booking.");
      const existing = data.payments.find(p => p.bookingId === bookingId);
      if (existing) return fail("Payment already exists for this booking. Payment ID: " + existing.id);
      if (!["Card", "Net Banking", "UPI"].includes(f.method)) return fail("Invalid payment method.");
      const id = generateId(i => !!findPayment(i));
      data.payments.push({ id, bookingId, amount: PRICE, method: f.method, status: "Paid" });
      return withDetails(ok("Payment successful!"), [
        ["Payment ID", id], ["Booking ID", bookingId], ["Amount", rupee(PRICE)],
        ["Method", f.method], ["Status", "Paid"]
      ]);
    },
    viewPayment(f) {
      const p = findPayment(num(f, "id"));
      if (!p) return fail("Payment not found.");
      return withDetails(ok(), [
        ["Payment ID", p.id], ["Booking ID", p.bookingId], ["Amount", rupee(p.amount)],
        ["Payment Method", p.method], ["Payment Status", p.status]
      ]);
    },

    // Administrator
    adminLogin(f) {
      return f.password === ADMIN_PASSWORD ? ok("Login successful.") : fail("Incorrect password. Access denied.");
    },
    addScreen(f) {
      const id = num(f, "id"), seats = num(f, "seats");
      if (findScreen(id)) return fail("Screen ID already exists.");
      if (seats <= 0) return fail("Number of seats must be greater than zero.");
      data.screens.push({ id, type: f.type, seats, time: f.time });
      return ok("Screen added successfully.");
    },
    updateScreen(f) {
      const id = num(f, "id"), seats = num(f, "seats");
      const screen = findScreen(id);
      if (!screen) return fail("Screen not found.");
      if (seats <= 0) return fail("Number of seats must be greater than zero.");
      Object.assign(screen, { type: f.type, seats, time: f.time });
      return ok("Screen updated successfully.");
    },
    viewScreens() {
      if (data.screens.length === 0) return fail("No screens available.");
      return withTable(ok(), ["Screen ID", "Screen Type", "Total Seats", "Show Time"],
        data.screens.map(s => [s.id, s.type, s.seats, s.time]));
    },
    searchScreen(f) {
      const found = data.screens.filter(s => has(s.type, f.keyword));
      if (found.length === 0) return fail("No screen found.");
      return withTable(ok(), ["Screen ID", "Screen Type", "Seats", "Show Time"],
        found.map(s => [s.id, s.type, s.seats, s.time]));
    },
    checkAvailability() {
      if (data.screens.length === 0) return fail("No screens available.");
      return withTable(ok(), ["Screen", "Total Seats", "Booked", "Available"],
        data.screens.map(s => {
          const booked = bookedCount(s);
          return [s.type, s.seats, booked, Math.max(s.seats - booked, 0)];
        }));
    },
    searchCustomer(f) {
      const found = data.customers.filter(c => has(c.name, f.keyword));
      if (found.length === 0) return fail("No customer found.");
      return withTable(ok(), ["Customer ID", "Name", "Mobile", "Email"],
        found.map(c => [c.id, c.name, c.mobile, c.email]));
    },
    searchBooking(f) {
      const found = data.bookings.filter(b => has(b.customer, f.keyword) || has(b.movie, f.keyword));
      if (found.length === 0) return fail("No booking found.");
      return bookingTable(found);
    },

    // Reports
    movieReport() {
      if (data.movies.length === 0) return fail("No movie data available.");
      return movieTable(data.movies);
    },
    bookingReport() {
      if (data.bookings.length === 0) return fail("No bookings available.");
      return bookingTable(data.bookings);
    },
    paymentReport() {
      if (data.payments.length === 0) return fail("No payment data available.");
      return withTable(ok(), ["Payment ID", "Booking ID", "Amount", "Method", "Status"],
        data.payments.map(p => [p.id, p.bookingId, rupee(p.amount), p.method, p.status]));
    },
    occupancyReport() {
      if (data.screens.length === 0) return fail("No screen data available.");
      return withTable(ok(), ["Screen", "Booked", "Total", "Occupancy"],
        data.screens.map(s => [s.type, bookedCount(s), s.seats, percent(s)]));
    },

    // Analysis
    totalRevenue() {
      return info("Total Revenue: " + rupee(revenue()));
    },
    mostBookedMovie() {
      if (data.bookings.length === 0) return fail("No booking data available.");
      const counts = {};
      data.bookings.filter(b => !cancelled(b)).forEach(b => { counts[b.movie] = (counts[b.movie] || 0) + 1; });
      const names = Object.keys(counts);
      const best = names.length ? names.reduce((a, b) => (counts[b] > counts[a] ? b : a)) : "No bookings";
      return info("Most Booked Movie: " + best);
    },
    occupancyAnalysis() {
      if (data.screens.length === 0) return fail("No screen data available.");
      return withTable(ok(), ["Screen", "Occupancy"], data.screens.map(s => [s.type, percent(s)]));
    },
    overallSummary() {
      return withDetails(ok(), [
        ["Total Movies", data.movies.length],
        ["Total Screens", data.screens.length],
        ["Total Customers", data.customers.length],
        ["Total Bookings", data.bookings.length],
        ["Active Bookings", data.bookings.filter(b => !cancelled(b)).length],
        ["Total Payments", data.payments.length],
        ["Total Revenue", rupee(revenue())]
      ]);
    },

    // Used by the page (same as the extra endpoints of the Java backend)
    options() {
      return {
        price: PRICE,
        movies: data.movies.map(m => ({ name: m.name, label: m.name + " (" + m.language + ", " + m.duration + " min)" })),
        screens: data.screens.map(s => ({ name: s.type, label: s.type + " - " + s.seats + " seats - " + s.time }))
      };
    },
    seats(f) {
      const screen = findScreenByName(f.screen || "");
      if (!screen) return fail("Screen not found.");
      return {
        ok: true,
        total: screen.seats,
        booked: data.bookings.filter(b => same(b.screen, screen.type) && !cancelled(b)).map(b => b.seat)
      };
    }
  };

  // Called by script.js: same input and output as  POST /api/<action>
  window.demoApi = function (action, values) {
    const handler = actions[action];
    if (!handler) return fail("Unknown action: " + action);
    const f = {};
    Object.keys(values || {}).forEach(k => { f[k] = String(values[k]).trim(); });
    let result;
    try {
      result = handler(f);
    } catch (error) {
      result = fail("Please enter a valid number.");
    }
    save();
    return result;
  };
})();
