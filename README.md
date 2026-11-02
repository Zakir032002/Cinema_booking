# CinemaBook - Cinema Seat Booking System

Web front end (HTML, CSS, JavaScript) for the CinemaBook Java project.
The JavaScript classes (`Movie`, `Screen`, `Customer`, `Booking`, `Payment`,
`ValidateService`, `SearchService`, `ReportGenerationService`, `AnalysisService`)
follow the Java code, and each console menu is a page section.

## Run

Open `index.html` in a browser. No build or server is needed.

## Files

- `index.html` - pages (Main Menu, Customer Portal, Administrator Portal)
- `style.css` - basic styling
- `script.js` - the application logic

## Notes

- Administrator password: `admin123`
- Ticket price is fixed at Rs. 250
- Data is kept in memory (like the Java `ArrayList`s), so it resets when the page is reloaded
