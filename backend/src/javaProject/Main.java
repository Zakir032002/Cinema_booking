package javaProject;
import java.io.*;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

// The console menus of the original program are replaced by a small web server.
// The web page calls  POST /api/<action>  and receives a JSON Result.
public class Main {
    static final String ADMIN_PASSWORD = "admin123";
    static ArrayList<Movie> movieList = new ArrayList<>();
    static ArrayList<Screen> screenList = new ArrayList<>();
    static ArrayList<Customer> customerList = new ArrayList<>();
    static ArrayList<Booking> bookingList = new ArrayList<>();
    static ArrayList<Payment> paymentList = new ArrayList<>();

    public static void loadInitialData() {
        movieList.add(new Movie(101, "Avengers: Endgame", "Action", "English", 181));
        movieList.add(new Movie(102, "Kalki 2898 AD", "Sci-Fi", "Telugu", 180));
        movieList.add(new Movie(103, "Pushpa 2", "Action", "Telugu", 200));
        movieList.add(new Movie(104, "3 Idiots", "Comedy", "Hindi", 170));
        movieList.add(new Movie(105, "Interstellar", "Sci-Fi", "English", 169));
        screenList.add(new Screen(101, "Extra Large", 50, "Morning 8:00 AM"));
        screenList.add(new Screen(102, "Large", 100, "Morning 11:00 AM"));
        screenList.add(new Screen(103, "Medium", 150, "Afternoon 3:00 PM"));
        screenList.add(new Screen(104, "Small", 300, "Evening 6:00 PM"));
        screenList.add(new Screen(105, "Very Small", 500, "Midnight 12:00 AM"));
    }

    public static void main(String[] args) throws IOException {
        loadInitialData();
        int port = 8080;
        if (System.getenv("PORT") != null) {
            port = Integer.parseInt(System.getenv("PORT"));
        }
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/api/", Main::handleRequest);
        server.start(); // one request at a time, so the shared lists are safe
        System.out.println("CinemaBook backend running on http://localhost:" + port);
    }

    // ================= Request handling =================

    static void handleRequest(HttpExchange exchange) throws IOException {
        // Allow the web page to call this server from another address (CORS)
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
        exchange.getResponseHeaders().set("Access-Control-Allow-Private-Network", "true");
        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
            return;
        }

        String action = exchange.getRequestURI().getPath().substring("/api/".length());
        int status = 200;
        String json;
        try {
            if (action.equals("options")) {
                json = optionsJson();
            } else {
                Result result = handle(action, parseForm(readBody(exchange)));
                if (result == null) {
                    status = 404;
                    result = Result.fail("Unknown action: " + action);
                }
                json = result.toJson();
            }
        } catch (NumberFormatException e) {
            json = Result.fail("Please enter a valid number.").toJson();
        }

        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    // Calls the same methods the menus used to call. Returns null for an unknown action.
    static Result handle(String action, Map<String, String> f) {
        switch (action) {
            // Customer portal
            case "registerCustomer":
                return Customer.registerCustomer(customerList, f.get("name"), f.get("mobile"), f.get("email"));
            case "updateProfile":
                return Customer.updateProfile(customerList, f.get("name"), f.get("newName"),
                        f.get("newMobile"), f.get("newEmail"));
            case "viewProfile":
                return Customer.viewProfile(customerList, f.get("name"));
            case "viewMovies":
                return Movie.displayMovies(movieList);
            case "searchMovie":
                return SearchService.searchMovie(movieList, f.get("keyword"));
            case "bookTicket":
                return Booking.bookTicket(movieList, screenList, customerList, bookingList,
                        f.get("customerName"), f.get("movieName"), f.get("screenName"), f.get("seat"));
            case "viewBooking":
                return Booking.viewBooking(bookingList, num(f, "id"));
            case "cancelBooking":
                return Booking.cancelBooking(bookingList, num(f, "id"));
            case "makePayment":
                return Payment.makePayment(bookingList, paymentList, num(f, "bookingId"), f.get("method"));
            case "viewPayment":
                return Payment.viewPayment(paymentList, num(f, "id"));

            // Administrator portal
            case "adminLogin":
                if (ADMIN_PASSWORD.equals(f.get("password"))) {
                    return Result.ok("Login successful.");
                }
                return Result.fail("Incorrect password. Access denied.");
            case "addMovie":
                return Movie.addMovie(movieList, num(f, "id"), f.get("name"), f.get("genre"),
                        f.get("language"), num(f, "duration"));
            case "updateMovie":
                return Movie.updateMovie(movieList, num(f, "id"), f.get("name"), f.get("genre"),
                        f.get("language"), num(f, "duration"));
            case "addScreen":
                return Screen.addScreen(screenList, num(f, "id"), f.get("type"), num(f, "seats"), f.get("time"));
            case "updateScreen":
                return Screen.updateScreen(screenList, num(f, "id"), f.get("type"), num(f, "seats"), f.get("time"));
            case "viewScreens":
                return Screen.displayScreens(screenList);
            case "searchScreen":
                return SearchService.searchScreen(screenList, f.get("keyword"));
            case "checkAvailability":
                return Screen.checkAvailability(screenList, bookingList);
            case "searchCustomer":
                return SearchService.searchCustomer(customerList, f.get("keyword"));
            case "searchBooking":
                return SearchService.searchBooking(bookingList, f.get("keyword"));

            // Reports
            case "movieReport":
                return ReportGenerationService.movieReport(movieList);
            case "bookingReport":
                return ReportGenerationService.bookingReport(bookingList);
            case "paymentReport":
                return ReportGenerationService.paymentReport(paymentList);
            case "occupancyReport":
                return ReportGenerationService.occupancyReport(screenList, bookingList);

            // Analysis
            case "totalRevenue":
                return AnalysisService.totalRevenue(paymentList);
            case "mostBookedMovie":
                return AnalysisService.mostBookedMovie(bookingList);
            case "occupancyAnalysis":
                return AnalysisService.occupancyAnalysis(screenList, bookingList);
            case "overallSummary":
                return AnalysisService.overallSummary(movieList, screenList, customerList, bookingList, paymentList);
            default:
                return null;
        }
    }

    // Movie and screen names for the drop-downs of the booking form
    static String optionsJson() {
        StringBuilder sb = new StringBuilder("{\"movies\":[");
        for (int i = 0; i < movieList.size(); i++) {
            Movie m = movieList.get(i);
            if (i > 0) sb.append(",");
            sb.append("{\"name\":").append(Result.quote(m.getMovieName()))
              .append(",\"label\":").append(Result.quote(
                      m.getMovieName() + " (" + m.getLanguage() + ", " + m.getDuration() + " min)"))
              .append("}");
        }
        sb.append("],\"screens\":[");
        for (int i = 0; i < screenList.size(); i++) {
            Screen s = screenList.get(i);
            if (i > 0) sb.append(",");
            sb.append("{\"name\":").append(Result.quote(s.getScreenType()))
              .append(",\"label\":").append(Result.quote(
                      s.getScreenType() + " - " + s.getTotalSeats() + " seats - " + s.getShowTime()))
              .append("}");
        }
        return sb.append("]}").toString();
    }

    // ================= Small helpers =================

    // Same idea as readInt(): a value that is not a number raises NumberFormatException
    static int num(Map<String, String> f, String key) {
        return Integer.parseInt(f.get(key).trim());
    }

    static String readBody(HttpExchange exchange) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];
        int n;
        InputStream in = exchange.getRequestBody();
        while ((n = in.read(buffer)) != -1) {
            out.write(buffer, 0, n);
        }
        return new String(out.toByteArray(), StandardCharsets.UTF_8);
    }

    // "a=1&b=hello%20world"  ->  {a=1, b=hello world}   (missing fields become "")
    static Map<String, String> parseForm(String body) throws IOException {
        Map<String, String> values = new HashMap<String, String>() {
            @Override
            public String get(Object key) {
                String v = super.get(key);
                return v == null ? "" : v;
            }
        };
        if (body.isEmpty()) {
            return values;
        }
        for (String pair : body.split("&")) {
            int eq = pair.indexOf('=');
            String key = eq < 0 ? pair : pair.substring(0, eq);
            String value = eq < 0 ? "" : pair.substring(eq + 1);
            values.put(URLDecoder.decode(key, "UTF-8"), URLDecoder.decode(value, "UTF-8").trim());
        }
        return values;
    }
}
