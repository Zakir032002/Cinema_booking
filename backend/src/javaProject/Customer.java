package javaProject;
import java.util.*;

class Customer {
    private int customerId;
    private String name;
    private String mobile;
    private String email;

    public Customer(int customerId, String name, String mobile, String email) {
        this.customerId = customerId;
        this.name = name;
        this.mobile = mobile;
        this.email = email;
    }

    public int getCustomerId() {
        return customerId;
    }
    public String getName() {
        return name;
    }
    public String getMobile() {
        return mobile;
    }
    public String getEmail() {
        return email;
    }
    public void setName(String name) {
        this.name = name;
    }
    public void setMobile(String mobile) {
        this.mobile = mobile;
    }
    public void setEmail(String email) {
        this.email = email;
    }

    public static Customer findCustomerById(ArrayList<Customer> customers, int id) {
        for (Customer customer : customers) {
            if (customer.getCustomerId() == id) {
                return customer;
            }
        }
        return null;
    }

    public static Customer findCustomerByName(ArrayList<Customer> customers, String name) {
        for (Customer customer : customers) {
            if (customer.getName().equalsIgnoreCase(name)) {
                return customer;
            }
        }
        return null;
    }

    public static int generateCustomerId(ArrayList<Customer> customers) {
        Random random = new Random();
        int id;
        do {
            id = 1000 + random.nextInt(9000);
        } while (findCustomerById(customers, id) != null);
        return id;
    }

    public static Result registerCustomer(ArrayList<Customer> customers, String name, String mobile, String email) {
        if (!ValidateService.validateMobile(mobile)) {
            return Result.fail("Invalid mobile number.");
        }
        if (!ValidateService.validateEmail(email)) {
            return Result.fail("Invalid email address.");
        }
        if (findCustomerByName(customers, name) != null) {
            return Result.fail("A customer with this name already exists.");
        }
        int id = generateCustomerId(customers);
        Customer customer = new Customer(id, name, mobile, email);
        customers.add(customer);
        return Result.ok("Customer registered successfully.")
                .note("Your Customer ID is: " + id + ". Please keep this ID for your records.");
    }

    public static Result updateProfile(ArrayList<Customer> customers, String name, String newName,
            String newMobile, String newEmail) {
        Customer customer = findCustomerByName(customers, name);
        if (customer == null) {
            return Result.fail("Customer not found.");
        }
        if (!ValidateService.validateMobile(newMobile)) {
            return Result.fail("Invalid mobile number.");
        }
        if (!ValidateService.validateEmail(newEmail)) {
            return Result.fail("Invalid email address.");
        }
        customer.setName(newName);
        customer.setMobile(newMobile);
        customer.setEmail(newEmail);
        return Result.ok("Profile updated successfully.");
    }

    public static Result viewProfile(ArrayList<Customer> customers, String name) {
        Customer customer = findCustomerByName(customers, name);
        if (customer == null) {
            return Result.fail("Customer not found.");
        }
        return Result.data()
                .detail("Customer ID", customer.getCustomerId())
                .detail("Name", customer.getName())
                .detail("Mobile", customer.getMobile())
                .detail("Email", customer.getEmail());
    }
}
