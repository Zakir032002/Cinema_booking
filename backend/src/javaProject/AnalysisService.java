package javaProject;
import java.util.*;
import java.util.stream.Collectors;

class AnalysisService {
    private static double revenue(ArrayList<Payment> payments) {
        return payments.stream()
                .filter(p -> p.getPaymentStatus().equalsIgnoreCase("Paid"))
                .mapToDouble(Payment::getAmount)
                .sum();
    }

    public static Result totalRevenue(ArrayList<Payment> payments) {
        return Result.info("Total Revenue: " + Result.RUPEE + revenue(payments));
    }

    public static Result mostBookedMovie(ArrayList<Booking> bookings) {
        if (bookings.isEmpty()) {
            return Result.fail("No booking data available.");
        }
        String result = bookings.stream()
                .filter(b -> !b.getStatus().equalsIgnoreCase("Cancelled"))
                .collect(Collectors.groupingBy(Booking::getMovieName, Collectors.counting()))
                .entrySet()
                .stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("No bookings");
        return Result.info("Most Booked Movie: " + result);
    }

    public static Result occupancyAnalysis(ArrayList<Screen> screens, ArrayList<Booking> bookings) {
        if (screens.isEmpty()) {
            return Result.fail("No screen data available.");
        }
        Result result = Result.data().columns("Screen", "Occupancy");
        for (Screen screen : screens) {
            long booked = Screen.countBooked(screen, bookings);
            double percentage = 0;
            if (screen.getTotalSeats() > 0) {
                percentage = ((double) booked / screen.getTotalSeats()) * 100;
            }
            result.row(screen.getScreenType(), String.format(Locale.US, "%.2f%%", percentage));
        }
        return result;
    }

    public static Result overallSummary(ArrayList<Movie> movies, ArrayList<Screen> screens,
            ArrayList<Customer> customers, ArrayList<Booking> bookings, ArrayList<Payment> payments) {
        long activeBookings = bookings.stream()
                .filter(b -> !b.getStatus().equalsIgnoreCase("Cancelled"))
                .count();
        return Result.data()
                .detail("Total Movies", movies.size())
                .detail("Total Screens", screens.size())
                .detail("Total Customers", customers.size())
                .detail("Total Bookings", bookings.size())
                .detail("Active Bookings", activeBookings)
                .detail("Total Payments", payments.size())
                .detail("Total Revenue", Result.RUPEE + revenue(payments));
    }
}
