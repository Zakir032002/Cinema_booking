# CinemaBook - Cinema Seat Booking System

- **Backend:** the Java project (`backend/`), run as a small web server.
- **Front end:** HTML, CSS and JavaScript (`index.html`, `style.css`, `script.js`).
  It only shows the forms and sends them to the Java backend.

```
Browser (index.html + script.js)  --POST /api/<action>-->  Java backend  --JSON-->  Browser
```

## Run

1. Start the backend (needs JDK 8 or higher):

   ```bash
   cd backend
   javac -d out src/javaProject/*.java
   java -cp out javaProject.Main
   ```

   It prints `CinemaBook backend running on http://localhost:8080`.

   In Eclipse: create a Java project, copy `backend/src/javaProject` into its `src` folder
   and run `Main.java`.

2. Open `index.html` in a browser.

If the backend runs on another address or port, change `API_URL` at the top of `script.js`.
The port can be changed with the `PORT` environment variable.

## Java classes (`backend/src/javaProject`)

`Movie`, `Screen`, `Customer`, `Booking`, `Payment`, `ValidateService`, `SearchService`,
`ReportGenerationService`, `AnalysisService` and `Main`, as in the project report.
Instead of printing to the console, the methods return a `Result` object (`Result.java`),
which `Main` sends to the page as JSON. The console menus of the old `Main` are replaced by
the web server.

## Notes

- Administrator password: `admin123` (checked by the backend)
- Ticket price is fixed at Rs. 250
- Data is kept in memory (like the `ArrayList`s), so it resets when the backend is restarted
- GitHub Pages can host only the front end. The Java backend must run on your computer or on a
  Java hosting service, and `API_URL` must point to it.
