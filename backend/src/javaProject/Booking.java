package javaProject;
import java.util.*;

class Booking {
    private int bookingId;
    private String customerName;
    private String movieName;
    private String screenName;
    private String seatNumber;
    private String bookingDate;
    private String status;

    public Booking(int bookingId, String customerName, String movieName, String screenName,
            String seatNumber, String bookingDate, String status) {
        this.bookingId = bookingId;
        this.customerName = customerName;
        this.movieName = movieName;
        this.screenName = screenName;
        this.seatNumber = seatNumber;
        this.bookingDate = bookingDate;
        this.status = status;
    }

    public int getBookingId() {
        return bookingId;
    }
    public String getCustomerName() {
        return customerName;
    }
    public String getMovieName() {
        return movieName;
    }
    public String getScreenName() {
        return screenName;
    }
    public String getSeatNumber() {
        return seatNumber;
    }
    public String getBookingDate() {
        return bookingDate;
    }
    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }

    public static Booking findBookingById(ArrayList<Booking> bookings, int id) {
        for (Booking booking : bookings) {
            if (booking.getBookingId() == id) {
                return booking;
            }
        }
        return null;
    }

    public static int generateBookingId(ArrayList<Booking> bookings) {
        Random random = new Random();
        int id;
        do {
            id = 1000 + random.nextInt(9000);
        } while (findBookingById(bookings, id) != null);
        return id;
    }

    public static boolean isSeatBooked(ArrayList<Booking> bookings, String screenName, String seatNumber) {
        for (Booking booking : bookings) {
            if (booking.getScreenName().equalsIgnoreCase(screenName)
                    && booking.getSeatNumber().equalsIgnoreCase(seatNumber)
                    && !booking.getStatus().equalsIgnoreCase("Cancelled")) {
                return true;
            }
        }
        return false;
    }

    public static Result bookTicket(ArrayList<Movie> movies, ArrayList<Screen> screens,
            ArrayList<Customer> customers, ArrayList<Booking> bookings,
            String customerName, String movieName, String screenName, String seat) {
        if (movies.isEmpty()) {
            return Result.fail("No movies available.");
        }
        if (screens.isEmpty()) {
            return Result.fail("No screens available.");
        }
        if (customers.isEmpty()) {
            return Result.fail("Please register as a customer first.");
        }
        Customer customer = Customer.findCustomerByName(customers, customerName);
        if (customer == null) {
            return Result.fail("Customer not found.");
        }
        Movie movie = Movie.findMovieByName(movies, movieName);
        if (movie == null) {
            return Result.fail("Movie not found.");
        }
        Screen screen = Screen.findScreenByName(screens, screenName);
        if (screen == null) {
            return Result.fail("Screen not found.");
        }
        if (seat.trim().isEmpty()) {
            return Result.fail("Seat number cannot be empty.");
        }
        if (isSeatBooked(bookings, screenName, seat)) {
            return Result.fail("This seat is already booked.");
        }
        int bookingId = generateBookingId(bookings);
        String date = java.time.LocalDate.now().toString();
        Booking booking = new Booking(bookingId, customer.getName(), movie.getMovieName(),
                screen.getScreenType(), seat, date, "Confirmed");
        bookings.add(booking);
        return addDetails(Result.ok("Booking successful!"), booking)
                .note("Ticket Price: " + Result.RUPEE + (int) Payment.TICKET_PRICE);
    }

    public static Result viewBooking(ArrayList<Booking> bookings, int id) {
        Booking booking = findBookingById(bookings, id);
        if (booking == null) {
            return Result.fail("Booking not found.");
        }
        return displayBooking(booking);
    }

    public static Result displayBooking(Booking booking) {
        return addDetails(Result.data(), booking);
    }

    private static Result addDetails(Result result, Booking booking) {
        return result
                .detail("Booking ID", booking.getBookingId())
                .detail("Customer", booking.getCustomerName())
                .detail("Movie", booking.getMovieName())
                .detail("Screen", booking.getScreenName())
                .detail("Seat", booking.getSeatNumber())
                .detail("Booking Date", booking.getBookingDate())
                .detail("Status", booking.getStatus());
    }

    // Table of several bookings (booking report and booking search)
    public static Result bookingTable(ArrayList<Booking> bookings) {
        Result result = Result.data().columns("Booking ID", "Customer", "Movie", "Screen", "Seat",
                "Booking Date", "Status");
        for (Booking b : bookings) {
            result.row(b.getBookingId(), b.getCustomerName(), b.getMovieName(), b.getScreenName(),
                    b.getSeatNumber(), b.getBookingDate(), b.getStatus());
        }
        return result;
    }

    public static Result cancelBooking(ArrayList<Booking> bookings, int id) {
        Booking booking = findBookingById(bookings, id);
        if (booking == null) {
            return Result.fail("Booking not found.");
        }
        if (booking.getStatus().equalsIgnoreCase("Cancelled")) {
            return Result.fail("Booking is already cancelled.");
        }
        booking.setStatus("Cancelled");
        return Result.ok("Booking cancelled successfully.");
    }
}
