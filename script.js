// CinemaBook - Cinema Seat Booking System
// JavaScript version of the Java project (same classes, same logic).
// Java ArrayList -> JavaScript array, System.out.println -> HTML output.

const TICKET_PRICE = 250;
const ADMIN_PASSWORD = "admin123";

// ================= Helper functions =================

// Escape text so user input cannot break the page
function esc(text) {
  return String(text).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const ok = text => `<p class="ok">${esc(text)}</p>`;
const fail = text => `<p class="error">${esc(text)}</p>`;
const rupee = amount => "₹" + amount.toFixed(1);

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

// Random 4-digit id that is not already used (same as generateXxxId in Java)
function generateId(isTaken) {
  let id;
  do {
    id = 1000 + Math.floor(Math.random() * 9000);
  } while (isTaken(id));
  return id;
}

// ================= Movie =================
class Movie {
  constructor(movieId, movieName, genre, language, duration) {
    this.movieId = movieId;
    this.movieName = movieName;
    this.genre = genre;
    this.language = language;
    this.duration = duration;
  }

  static findMovieById(movies, id) {
    return movies.find(m => m.movieId === id) || null;
  }

  static findMovieByName(movies, name) {
    return movies.find(m => m.movieName.toLowerCase() === name.toLowerCase()) || null;
  }

  static displayMovies(movies) {
    if (movies.length === 0) return fail("No movies available.");
    return table(["Movie ID", "Name", "Genre", "Language", "Duration"],
      movies.map(m => [m.movieId, m.movieName, m.genre, m.language, m.duration + " minutes"]));
  }

  static addMovie(movies, id, name, genre, language, duration) {
    if (Movie.findMovieById(movies, id) !== null) return fail("Movie ID already exists.");
    if (duration <= 0) return fail("Duration must be greater than zero.");
    movies.push(new Movie(id, name, genre, language, duration));
    return ok("Movie added successfully.");
  }

  static updateMovie(movies, id, name, genre, language, duration) {
    const movie = Movie.findMovieById(movies, id);
    if (movie === null) return fail("Movie not found.");
    if (duration <= 0) return fail("Duration must be greater than zero.");
    movie.movieName = name;
    movie.genre = genre;
    movie.language = language;
    movie.duration = duration;
    return ok("Movie updated successfully.");
  }
}

// ================= Screen =================
class Screen {
  constructor(screenId, screenType, totalSeats, showTime) {
    this.screenId = screenId;
    this.screenType = screenType;
    this.totalSeats = totalSeats;
    this.showTime = showTime;
  }

  static findScreenById(screens, id) {
    return screens.find(s => s.screenId === id) || null;
  }

  static findScreenByName(screens, name) {
    return screens.find(s => s.screenType.toLowerCase() === name.toLowerCase()) || null;
  }

  static displayScreens(screens) {
    if (screens.length === 0) return fail("No screens available.");
    return table(["Screen ID", "Screen Type", "Total Seats", "Show Time"],
      screens.map(s => [s.screenId, s.screenType, s.totalSeats, s.showTime]));
  }

  static addScreen(screens, id, type, seats, time) {
    if (Screen.findScreenById(screens, id) !== null) return fail("Screen ID already exists.");
    if (seats <= 0) return fail("Number of seats must be greater than zero.");
    screens.push(new Screen(id, type, seats, time));
    return ok("Screen added successfully.");
  }

  static updateScreen(screens, id, type, seats, time) {
    const screen = Screen.findScreenById(screens, id);
    if (screen === null) return fail("Screen not found.");
    if (seats <= 0) return fail("Number of seats must be greater than zero.");
    screen.screenType = type;
    screen.totalSeats = seats;
    screen.showTime = time;
    return ok("Screen updated successfully.");
  }

  static checkAvailability(screens, bookings) {
    if (screens.length === 0) return fail("No screens available.");
    const rows = screens.map(screen => {
      const bookedSeats = bookings
        .filter(b => b.screenName.toLowerCase() === screen.screenType.toLowerCase())
        .filter(b => b.status.toLowerCase() !== "cancelled").length;
      const availableSeats = Math.max(screen.totalSeats - bookedSeats, 0);
      return [screen.screenType, screen.totalSeats, bookedSeats, availableSeats];
    });
    return table(["Screen", "Total Seats", "Booked", "Available"], rows);
  }
}

// ================= Customer =================
class Customer {
  constructor(customerId, name, mobile, email) {
    this.customerId = customerId;
    this.name = name;
    this.mobile = mobile;
    this.email = email;
  }

  static findCustomerById(customers, id) {
    return customers.find(c => c.customerId === id) || null;
  }

  static findCustomerByName(customers, name) {
    return customers.find(c => c.name.toLowerCase() === name.toLowerCase()) || null;
  }

  static generateCustomerId(customers) {
    return generateId(id => Customer.findCustomerById(customers, id) !== null);
  }

  static registerCustomer(customers, name, mobile, email) {
    if (!ValidateService.validateMobile(mobile)) return fail("Invalid mobile number.");
    if (!ValidateService.validateEmail(email)) return fail("Invalid email address.");
    if (Customer.findCustomerByName(customers, name) !== null) return fail("A customer with this name already exists.");
    const id = Customer.generateCustomerId(customers);
    customers.push(new Customer(id, name, mobile, email));
    return ok("Customer registered successfully.") +
      `<p>Your Customer ID is: <b>${id}</b><br>Please keep this ID for your records.</p>`;
  }

  static updateProfile(customers, name, newName, newMobile, newEmail) {
    const customer = Customer.findCustomerByName(customers, name);
    if (customer === null) return fail("Customer not found.");
    if (!ValidateService.validateMobile(newMobile)) return fail("Invalid mobile number.");
    if (!ValidateService.validateEmail(newEmail)) return fail("Invalid email address.");
    customer.name = newName;
    customer.mobile = newMobile;
    customer.email = newEmail;
    return ok("Profile updated successfully.");
  }

  static viewProfile(customers, name) {
    const customer = Customer.findCustomerByName(customers, name);
    if (customer === null) return fail("Customer not found.");
    return details([
      ["Customer ID", customer.customerId],
      ["Name", customer.name],
      ["Mobile", customer.mobile],
      ["Email", customer.email]
    ]);
  }
}

// ================= Booking =================
class Booking {
  constructor(bookingId, customerName, movieName, screenName, seatNumber, bookingDate, status) {
    this.bookingId = bookingId;
    this.customerName = customerName;
    this.movieName = movieName;
    this.screenName = screenName;
    this.seatNumber = seatNumber;
    this.bookingDate = bookingDate;
    this.status = status;
  }

  static findBookingById(bookings, id) {
    return bookings.find(b => b.bookingId === id) || null;
  }

  static generateBookingId(bookings) {
    return generateId(id => Booking.findBookingById(bookings, id) !== null);
  }

  // A seat is booked if the same seat on the same screen has a non-cancelled booking
  static isSeatBooked(bookings, screenName, seatNumber) {
    return bookings.some(b =>
      b.screenName.toLowerCase() === screenName.toLowerCase() &&
      b.seatNumber.toLowerCase() === seatNumber.toLowerCase() &&
      b.status.toLowerCase() !== "cancelled");
  }

  static bookTicket(movies, screens, customers, bookings, customerName, movieName, screenName, seat) {
    if (movies.length === 0) return fail("No movies available.");
    if (screens.length === 0) return fail("No screens available.");
    if (customers.length === 0) return fail("Please register as a customer first.");

    const customer = Customer.findCustomerByName(customers, customerName);
    if (customer === null) return fail("Customer not found.");
    const movie = Movie.findMovieByName(movies, movieName);
    if (movie === null) return fail("Movie not found.");
    const screen = Screen.findScreenByName(screens, screenName);
    if (screen === null) return fail("Screen not found.");
    if (seat.trim() === "") return fail("Seat number cannot be empty.");
    if (Booking.isSeatBooked(bookings, screenName, seat)) return fail("This seat is already booked.");

    const bookingId = Booking.generateBookingId(bookings);
    const date = new Date().toLocaleDateString("en-CA"); // yyyy-mm-dd
    const booking = new Booking(bookingId, customer.name, movie.movieName, screen.screenType, seat, date, "Confirmed");
    bookings.push(booking);
    return ok("Booking successful!") + Booking.displayBooking(booking) + `<p>Ticket Price: ₹${TICKET_PRICE}</p>`;
  }

  static viewBooking(bookings, id) {
    const booking = Booking.findBookingById(bookings, id);
    if (booking === null) return fail("Booking not found.");
    return Booking.displayBooking(booking);
  }

  static displayBooking(booking) {
    return details([
      ["Booking ID", booking.bookingId],
      ["Customer", booking.customerName],
      ["Movie", booking.movieName],
      ["Screen", booking.screenName],
      ["Seat", booking.seatNumber],
      ["Booking Date", booking.bookingDate],
      ["Status", booking.status]
    ]);
  }

  static cancelBooking(bookings, id) {
    const booking = Booking.findBookingById(bookings, id);
    if (booking === null) return fail("Booking not found.");
    if (booking.status.toLowerCase() === "cancelled") return fail("Booking is already cancelled.");
    booking.status = "Cancelled";
    return ok("Booking cancelled successfully.");
  }
}

// ================= Payment =================
class Payment {
  constructor(paymentId, bookingId, amount, paymentMethod, paymentStatus) {
    this.paymentId = paymentId;
    this.bookingId = bookingId;
    this.amount = amount;
    this.paymentMethod = paymentMethod;
    this.paymentStatus = paymentStatus;
  }

  static findPaymentById(payments, id) {
    return payments.find(p => p.paymentId === id) || null;
  }

  static generatePaymentId(payments) {
    return generateId(id => Payment.findPaymentById(payments, id) !== null);
  }

  static makePayment(bookings, payments, bookingId, method) {
    const booking = Booking.findBookingById(bookings, bookingId);
    if (booking === null) return fail("Booking not found.");
    if (booking.status.toLowerCase() === "cancelled") return fail("Cannot make payment for a cancelled booking.");

    const existing = payments.find(p => p.bookingId === bookingId);
    if (existing) return fail("Payment already exists for this booking. Payment ID: " + existing.paymentId);

    const amount = TICKET_PRICE;
    if (!ValidateService.validateAmount(amount)) return fail("Invalid payment amount.");

    const paymentId = Payment.generatePaymentId(payments);
    payments.push(new Payment(paymentId, bookingId, amount, method, "Paid"));
    return ok("Payment successful!") + details([
      ["Payment ID", paymentId],
      ["Booking ID", bookingId],
      ["Amount", rupee(amount)],
      ["Method", method],
      ["Status", "Paid"]
    ]);
  }

  static viewPayment(payments, id) {
    const payment = Payment.findPaymentById(payments, id);
    if (payment === null) return fail("Payment not found.");
    return details([
      ["Payment ID", payment.paymentId],
      ["Booking ID", payment.bookingId],
      ["Amount", rupee(payment.amount)],
      ["Payment Method", payment.paymentMethod],
      ["Payment Status", payment.paymentStatus]
    ]);
  }
}

// ================= ValidateService =================
class ValidateService {
  static validateMobile(mobile) {
    return mobile != null && /^[0-9]{10}$/.test(mobile);
  }

  static validateEmail(email) {
    return email != null && /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(email);
  }

  static validateAmount(amount) {
    return amount > 0;
  }
}

// ================= SearchService =================
class SearchService {
  static searchMovie(movies, keyword) {
    const k = keyword.toLowerCase();
    const found = movies.filter(m => m.movieName.toLowerCase().includes(k) || m.genre.toLowerCase().includes(k));
    if (found.length === 0) return fail("No matching movie found.");
    return table(["Movie ID", "Name", "Genre", "Language"],
      found.map(m => [m.movieId, m.movieName, m.genre, m.language]));
  }

  static searchCustomer(customers, keyword) {
    const k = keyword.toLowerCase();
    const found = customers.filter(c => c.name.toLowerCase().includes(k));
    if (found.length === 0) return fail("No customer found.");
    return table(["Customer ID", "Name", "Mobile", "Email"],
      found.map(c => [c.customerId, c.name, c.mobile, c.email]));
  }

  static searchBooking(bookings, keyword) {
    const k = keyword.toLowerCase();
    const found = bookings.filter(b => b.customerName.toLowerCase().includes(k) || b.movieName.toLowerCase().includes(k));
    if (found.length === 0) return fail("No booking found.");
    return bookingTable(found);
  }
}

// One row per booking (used by the booking report and booking search)
function bookingTable(bookings) {
  return table(["Booking ID", "Customer", "Movie", "Screen", "Seat", "Booking Date", "Status"],
    bookings.map(b => [b.bookingId, b.customerName, b.movieName, b.screenName, b.seatNumber, b.bookingDate, b.status]));
}

// Number of non-cancelled bookings on a screen
function bookedCount(screen, bookings) {
  return bookings
    .filter(b => b.screenName.toLowerCase() === screen.screenType.toLowerCase())
    .filter(b => b.status.toLowerCase() !== "cancelled").length;
}

// ================= ReportGenerationService =================
class ReportGenerationService {
  static movieReport(movies) {
    if (movies.length === 0) return fail("No movie data available.");
    return table(["Movie ID", "Name", "Genre", "Language", "Duration"],
      movies.map(m => [m.movieId, m.movieName, m.genre, m.language, m.duration + " minutes"]));
  }

  static bookingReport(bookings) {
    if (bookings.length === 0) return fail("No bookings available.");
    return bookingTable(bookings);
  }

  static paymentReport(payments) {
    if (payments.length === 0) return fail("No payment data available.");
    return table(["Payment ID", "Booking ID", "Amount", "Method", "Status"],
      payments.map(p => [p.paymentId, p.bookingId, rupee(p.amount), p.paymentMethod, p.paymentStatus]));
  }

  static occupancyReport(screens, bookings) {
    if (screens.length === 0) return fail("No screen data available.");
    return table(["Screen", "Booked", "Total", "Occupancy"],
      screens.map(screen => {
        const booked = bookedCount(screen, bookings);
        const occupancy = screen.totalSeats > 0 ? (booked / screen.totalSeats) * 100 : 0;
        return [screen.screenType, booked, screen.totalSeats, occupancy.toFixed(2) + "%"];
      }));
  }
}

// ================= AnalysisService =================
class AnalysisService {
  // Sum of all payments with status "Paid"
  static revenue(payments) {
    return payments
      .filter(p => p.paymentStatus.toLowerCase() === "paid")
      .reduce((sum, p) => sum + p.amount, 0);
  }

  static totalRevenue(payments) {
    return `<p>Total Revenue: <b>${rupee(AnalysisService.revenue(payments))}</b></p>`;
  }

  static mostBookedMovie(bookings) {
    if (bookings.length === 0) return fail("No booking data available.");
    const counts = {};
    bookings.filter(b => b.status.toLowerCase() !== "cancelled")
      .forEach(b => { counts[b.movieName] = (counts[b.movieName] || 0) + 1; });
    const names = Object.keys(counts);
    if (names.length === 0) return "<p>Most Booked Movie: <b>No bookings</b></p>";
    const best = names.reduce((a, b) => (counts[b] > counts[a] ? b : a));
    return `<p>Most Booked Movie: <b>${esc(best)}</b></p>`;
  }

  static occupancyAnalysis(screens, bookings) {
    if (screens.length === 0) return fail("No screen data available.");
    return table(["Screen", "Occupancy"],
      screens.map(screen => {
        const booked = bookedCount(screen, bookings);
        const percentage = screen.totalSeats > 0 ? (booked / screen.totalSeats) * 100 : 0;
        return [screen.screenType, percentage.toFixed(2) + "%"];
      }));
  }

  static overallSummary(movies, screens, customers, bookings, payments) {
    const activeBookings = bookings.filter(b => b.status.toLowerCase() !== "cancelled").length;
    return details([
      ["Total Movies", movies.length],
      ["Total Screens", screens.length],
      ["Total Customers", customers.length],
      ["Total Bookings", bookings.length],
      ["Active Bookings", activeBookings],
      ["Total Payments", payments.length],
      ["Total Revenue", rupee(AnalysisService.revenue(payments))]
    ]);
  }
}

// ================= Main (data + page behaviour) =================
const movieList = [];
const screenList = [];
const customerList = [];
const bookingList = [];
const paymentList = [];

function loadInitialData() {
  movieList.push(new Movie(101, "Avengers: Endgame", "Action", "English", 181));
  movieList.push(new Movie(102, "Kalki 2898 AD", "Sci-Fi", "Telugu", 180));
  movieList.push(new Movie(103, "Pushpa 2", "Action", "Telugu", 200));
  movieList.push(new Movie(104, "3 Idiots", "Comedy", "Hindi", 170));
  movieList.push(new Movie(105, "Interstellar", "Sci-Fi", "English", 169));

  screenList.push(new Screen(101, "Extra Large", 50, "Morning 8:00 AM"));
  screenList.push(new Screen(102, "Large", 100, "Morning 11:00 AM"));
  screenList.push(new Screen(103, "Medium", 150, "Afternoon 3:00 PM"));
  screenList.push(new Screen(104, "Small", 300, "Evening 6:00 PM"));
  screenList.push(new Screen(105, "Very Small", 500, "Midnight 12:00 AM"));
}

// Each form in index.html has data-action="<name>"; it calls the matching function below.
// "f" holds the (trimmed) form values.
const actions = {
  // Customer
  registerCustomer: f => Customer.registerCustomer(customerList, f.name, f.mobile, f.email),
  updateProfile: f => Customer.updateProfile(customerList, f.name, f.newName, f.newMobile, f.newEmail),
  viewProfile: f => Customer.viewProfile(customerList, f.name),

  // Movies
  viewMovies: () => Movie.displayMovies(movieList),
  searchMovie: f => SearchService.searchMovie(movieList, f.keyword),
  addMovie: f => Movie.addMovie(movieList, Number(f.id), f.name, f.genre, f.language, Number(f.duration)),
  updateMovie: f => Movie.updateMovie(movieList, Number(f.id), f.name, f.genre, f.language, Number(f.duration)),

  // Booking
  bookTicket: f => Booking.bookTicket(movieList, screenList, customerList, bookingList,
    f.customerName, f.movieName, f.screenName, f.seat),
  viewBooking: f => Booking.viewBooking(bookingList, Number(f.id)),
  cancelBooking: f => Booking.cancelBooking(bookingList, Number(f.id)),

  // Payment
  makePayment: f => Payment.makePayment(bookingList, paymentList, Number(f.bookingId), f.method),
  viewPayment: f => Payment.viewPayment(paymentList, Number(f.id)),

  // Administrator login
  adminLogin: f => {
    if (f.password !== ADMIN_PASSWORD) return fail("Incorrect password. Access denied.");
    showView("admin");
    return "";
  },

  // Screens
  addScreen: f => Screen.addScreen(screenList, Number(f.id), f.type, Number(f.seats), f.time),
  updateScreen: f => Screen.updateScreen(screenList, Number(f.id), f.type, Number(f.seats), f.time),
  viewScreens: () => Screen.displayScreens(screenList),
  checkAvailability: () => Screen.checkAvailability(screenList, bookingList),

  // Customer & booking (admin)
  searchCustomer: f => SearchService.searchCustomer(customerList, f.keyword),
  searchBooking: f => SearchService.searchBooking(bookingList, f.keyword),

  // Reports
  movieReport: () => ReportGenerationService.movieReport(movieList),
  bookingReport: () => ReportGenerationService.bookingReport(bookingList),
  paymentReport: () => ReportGenerationService.paymentReport(paymentList),
  occupancyReport: () => ReportGenerationService.occupancyReport(screenList, bookingList),

  // Analysis
  totalRevenue: () => AnalysisService.totalRevenue(paymentList),
  mostBookedMovie: () => AnalysisService.mostBookedMovie(bookingList),
  occupancyAnalysis: () => AnalysisService.occupancyAnalysis(screenList, bookingList),
  overallSummary: () => AnalysisService.overallSummary(movieList, screenList, customerList, bookingList, paymentList)
};

// Fill the movie and screen drop-downs of the booking form
function fillDropdowns() {
  document.getElementById("movieSelect").innerHTML = movieList
    .map(m => `<option value="${esc(m.movieName)}">${esc(m.movieName)} (${esc(m.language)}, ${m.duration} min)</option>`)
    .join("");
  document.getElementById("screenSelect").innerHTML = screenList
    .map(s => `<option value="${esc(s.screenType)}">${esc(s.screenType)} - ${s.totalSeats} seats - ${esc(s.showTime)}</option>`)
    .join("");
}

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
document.addEventListener("submit", e => {
  e.preventDefault();
  const form = e.target;
  const values = Object.fromEntries(new FormData(form));
  for (const key in values) values[key] = values[key].trim();

  const result = actions[form.dataset.action](values);
  form.querySelector(".out").innerHTML = result;
  if (!result.includes('class="error"')) form.reset();
});

loadInitialData();
fillDropdowns();
