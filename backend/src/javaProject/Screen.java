package javaProject;
import java.util.*;

class Screen {
    private int screenId;
    private String screenType;
    private int totalSeats;
    private String showTime;

    public Screen(int screenId, String screenType, int totalSeats, String showTime) {
        this.screenId = screenId;
        this.screenType = screenType;
        this.totalSeats = totalSeats;
        this.showTime = showTime;
    }

    public int getScreenId() {
        return screenId;
    }
    public String getScreenType() {
        return screenType;
    }
    public int getTotalSeats() {
        return totalSeats;
    }
    public String getShowTime() {
        return showTime;
    }
    public void setScreenType(String screenType) {
        this.screenType = screenType;
    }
    public void setTotalSeats(int totalSeats) {
        this.totalSeats = totalSeats;
    }
    public void setShowTime(String showTime) {
        this.showTime = showTime;
    }

    public static Screen findScreenById(ArrayList<Screen> screens, int id) {
        for (Screen screen : screens) {
            if (screen.getScreenId() == id) {
                return screen;
            }
        }
        return null;
    }

    public static Screen findScreenByName(ArrayList<Screen> screens, String name) {
        for (Screen screen : screens) {
            if (screen.getScreenType().equalsIgnoreCase(name)) {
                return screen;
            }
        }
        return null;
    }

    // Number of bookings on this screen that are not cancelled
    public static long countBooked(Screen screen, ArrayList<Booking> bookings) {
        return bookings.stream()
                .filter(b -> b.getScreenName().equalsIgnoreCase(screen.getScreenType()))
                .filter(b -> !b.getStatus().equalsIgnoreCase("Cancelled"))
                .count();
    }

    public static Result displayScreens(ArrayList<Screen> screens) {
        if (screens.isEmpty()) {
            return Result.fail("No screens available.");
        }
        Result result = Result.data().columns("Screen ID", "Screen Type", "Total Seats", "Show Time");
        for (Screen screen : screens) {
            result.row(screen.getScreenId(), screen.getScreenType(), screen.getTotalSeats(), screen.getShowTime());
        }
        return result;
    }

    public static Result addScreen(ArrayList<Screen> screens, int id, String type, int seats, String time) {
        if (findScreenById(screens, id) != null) {
            return Result.fail("Screen ID already exists.");
        }
        if (seats <= 0) {
            return Result.fail("Number of seats must be greater than zero.");
        }
        screens.add(new Screen(id, type, seats, time));
        return Result.ok("Screen added successfully.");
    }

    public static Result updateScreen(ArrayList<Screen> screens, int id, String type, int seats, String time) {
        Screen screen = findScreenById(screens, id);
        if (screen == null) {
            return Result.fail("Screen not found.");
        }
        if (seats <= 0) {
            return Result.fail("Number of seats must be greater than zero.");
        }
        screen.setScreenType(type);
        screen.setTotalSeats(seats);
        screen.setShowTime(time);
        return Result.ok("Screen updated successfully.");
    }

    public static Result checkAvailability(ArrayList<Screen> screens, ArrayList<Booking> bookings) {
        if (screens.isEmpty()) {
            return Result.fail("No screens available.");
        }
        Result result = Result.data().columns("Screen", "Total Seats", "Booked", "Available");
        for (Screen screen : screens) {
            long bookedSeats = countBooked(screen, bookings);
            int availableSeats = screen.getTotalSeats() - (int) bookedSeats;
            if (availableSeats < 0) {
                availableSeats = 0;
            }
            result.row(screen.getScreenType(), screen.getTotalSeats(), bookedSeats, availableSeats);
        }
        return result;
    }
}
