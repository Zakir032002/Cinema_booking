package javaProject;
import java.util.*;

class Payment {
    public static final double TICKET_PRICE = 250.00;

    private int paymentId;
    private int bookingId;
    private double amount;
    private String paymentMethod;
    private String paymentStatus;

    public Payment(int paymentId, int bookingId, double amount, String paymentMethod, String paymentStatus) {
        this.paymentId = paymentId;
        this.bookingId = bookingId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
    }

    public int getPaymentId() {
        return paymentId;
    }
    public int getBookingId() {
        return bookingId;
    }
    public double getAmount() {
        return amount;
    }
    public String getPaymentMethod() {
        return paymentMethod;
    }
    public String getPaymentStatus() {
        return paymentStatus;
    }

    public static Payment findPaymentById(ArrayList<Payment> payments, int id) {
        for (Payment payment : payments) {
            if (payment.getPaymentId() == id) {
                return payment;
            }
        }
        return null;
    }

    public static int generatePaymentId(ArrayList<Payment> payments) {
        Random random = new Random();
        int id;
        do {
            id = 1000 + random.nextInt(9000);
        } while (findPaymentById(payments, id) != null);
        return id;
    }

    public static Result makePayment(ArrayList<Booking> bookings, ArrayList<Payment> payments,
            int bookingId, String choice) {
        Booking booking = Booking.findBookingById(bookings, bookingId);
        if (booking == null) {
            return Result.fail("Booking not found.");
        }
        if (booking.getStatus().equalsIgnoreCase("Cancelled")) {
            return Result.fail("Cannot make payment for a cancelled booking.");
        }
        for (Payment payment : payments) {
            if (payment.getBookingId() == bookingId) {
                return Result.fail("Payment already exists for this booking. Payment ID: " + payment.getPaymentId());
            }
        }
        double amount = TICKET_PRICE;
        if (!ValidateService.validateAmount(amount)) {
            return Result.fail("Invalid payment amount.");
        }
        String method;
        switch (choice) {
            case "Card":
                method = "Card";
                break;
            case "Net Banking":
                method = "Net Banking";
                break;
            case "UPI":
                method = "UPI";
                break;
            default:
                return Result.fail("Invalid payment method.");
        }
        int paymentId = generatePaymentId(payments);
        payments.add(new Payment(paymentId, bookingId, amount, method, "Paid"));
        return Result.ok("Payment successful!")
                .detail("Payment ID", paymentId)
                .detail("Booking ID", bookingId)
                .detail("Amount", Result.RUPEE + amount)
                .detail("Method", method)
                .detail("Status", "Paid");
    }

    public static Result viewPayment(ArrayList<Payment> payments, int id) {
        Payment payment = findPaymentById(payments, id);
        if (payment == null) {
            return Result.fail("Payment not found.");
        }
        return Result.data()
                .detail("Payment ID", payment.getPaymentId())
                .detail("Booking ID", payment.getBookingId())
                .detail("Amount", Result.RUPEE + payment.getAmount())
                .detail("Payment Method", payment.getPaymentMethod())
                .detail("Payment Status", payment.getPaymentStatus());
    }
}
