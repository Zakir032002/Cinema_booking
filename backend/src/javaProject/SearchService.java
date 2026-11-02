package javaProject;
import java.util.*;

class SearchService {
    public static Result searchMovie(ArrayList<Movie> movies, String keyword) {
        Result result = Result.data().columns("Movie ID", "Name", "Genre", "Language");
        boolean found = false;
        for (Movie movie : movies) {
            if (movie.getMovieName().toLowerCase().contains(keyword.toLowerCase())
                    || movie.getGenre().toLowerCase().contains(keyword.toLowerCase())) {
                result.row(movie.getMovieId(), movie.getMovieName(), movie.getGenre(), movie.getLanguage());
                found = true;
            }
        }
        if (!found) {
            return Result.fail("No matching movie found.");
        }
        return result;
    }

    public static Result searchCustomer(ArrayList<Customer> customers, String keyword) {
        Result result = Result.data().columns("Customer ID", "Name", "Mobile", "Email");
        boolean found = false;
        for (Customer customer : customers) {
            if (customer.getName().toLowerCase().contains(keyword.toLowerCase())) {
                result.row(customer.getCustomerId(), customer.getName(), customer.getMobile(), customer.getEmail());
                found = true;
            }
        }
        if (!found) {
            return Result.fail("No customer found.");
        }
        return result;
    }

    public static Result searchScreen(ArrayList<Screen> screens, String keyword) {
        Result result = Result.data().columns("Screen ID", "Screen Type", "Seats", "Show Time");
        boolean found = false;
        for (Screen screen : screens) {
            if (screen.getScreenType().toLowerCase().contains(keyword.toLowerCase())) {
                result.row(screen.getScreenId(), screen.getScreenType(), screen.getTotalSeats(), screen.getShowTime());
                found = true;
            }
        }
        if (!found) {
            return Result.fail("No screen found.");
        }
        return result;
    }

    public static Result searchBooking(ArrayList<Booking> bookings, String keyword) {
        ArrayList<Booking> matches = new ArrayList<>();
        for (Booking booking : bookings) {
            if (booking.getCustomerName().toLowerCase().contains(keyword.toLowerCase())
                    || booking.getMovieName().toLowerCase().contains(keyword.toLowerCase())) {
                matches.add(booking);
            }
        }
        if (matches.isEmpty()) {
            return Result.fail("No booking found.");
        }
        return Booking.bookingTable(matches);
    }
}
