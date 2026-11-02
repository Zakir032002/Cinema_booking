package javaProject;

class ValidateService {
    public static boolean validateMobile(String mobile) {
        return mobile != null && mobile.matches("[0-9]{10}");
    }

    public static boolean validateEmail(String email) {
        return email != null && email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    }

    public static boolean validateAmount(double amount) {
        return amount > 0;
    }
}
