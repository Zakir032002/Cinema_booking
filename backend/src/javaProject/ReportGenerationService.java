package javaProject;
import java.util.*;

class ReportGenerationService {
    public static Result movieReport(ArrayList<Movie> movies) {
        if (movies.isEmpty()) {
            return Result.fail("No movie data available.");
        }
        Result result = Result.data().columns("Movie ID", "Name", "Genre", "Language", "Duration");
        movies.forEach(movie -> result.row(movie.getMovieId(), movie.getMovieName(), movie.getGenre(),
                movie.getLanguage(), movie.getDuration() + " minutes"));
        return result;
    }

    public static Result bookingReport(ArrayList<Booking> bookings) {
        if (bookings.isEmpty()) {
            return Result.fail("No bookings available.");
        }
        return Booking.bookingTable(bookings);
    }

    public static Result paymentReport(ArrayList<Payment> payments) {
        if (payments.isEmpty()) {
            return Result.fail("No payment data available.");
        }
        Result result = Result.data().columns("Payment ID", "Booking ID", "Amount", "Method", "Status");
        payments.forEach(payment -> result.row(payment.getPaymentId(), payment.getBookingId(),
                Result.RUPEE + payment.getAmount(), payment.getPaymentMethod(), payment.getPaymentStatus()));
        return result;
    }

    public static Result occupancyReport(ArrayList<Screen> screens, ArrayList<Booking> bookings) {
        if (screens.isEmpty()) {
            return Result.fail("No screen data available.");
        }
        Result result = Result.data().columns("Screen", "Booked", "Total", "Occupancy");
        for (Screen screen : screens) {
            long booked = Screen.countBooked(screen, bookings);
            double occupancy = 0;
            if (screen.getTotalSeats() > 0) {
                occupancy = ((double) booked / screen.getTotalSeats()) * 100;
            }
            result.row(screen.getScreenType(), booked, screen.getTotalSeats(),
                    String.format(Locale.US, "%.2f%%", occupancy));
        }
        return result;
    }
}
