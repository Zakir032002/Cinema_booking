package javaProject;
import java.util.*;

class Movie {
    private int movieId;
    private String movieName;
    private String genre;
    private String language;
    private int duration;

    public Movie(int movieId, String movieName, String genre, String language, int duration) {
        this.movieId = movieId;
        this.movieName = movieName;
        this.genre = genre;
        this.language = language;
        this.duration = duration;
    }

    public int getMovieId() {
        return movieId;
    }
    public String getMovieName() {
        return movieName;
    }
    public String getGenre() {
        return genre;
    }
    public String getLanguage() {
        return language;
    }
    public int getDuration() {
        return duration;
    }
    public void setMovieName(String movieName) {
        this.movieName = movieName;
    }
    public void setGenre(String genre) {
        this.genre = genre;
    }
    public void setLanguage(String language) {
        this.language = language;
    }
    public void setDuration(int duration) {
        this.duration = duration;
    }

    public static Movie findMovieById(ArrayList<Movie> movies, int id) {
        for (Movie movie : movies) {
            if (movie.getMovieId() == id) {
                return movie;
            }
        }
        return null;
    }

    public static Movie findMovieByName(ArrayList<Movie> movies, String name) {
        for (Movie movie : movies) {
            if (movie.getMovieName().equalsIgnoreCase(name)) {
                return movie;
            }
        }
        return null;
    }

    public static Result displayMovies(ArrayList<Movie> movies) {
        if (movies.isEmpty()) {
            return Result.fail("No movies available.");
        }
        Result result = Result.data().columns("Movie ID", "Name", "Genre", "Language", "Duration");
        for (Movie movie : movies) {
            result.row(movie.getMovieId(), movie.getMovieName(), movie.getGenre(),
                    movie.getLanguage(), movie.getDuration() + " minutes");
        }
        return result;
    }

    public static Result addMovie(ArrayList<Movie> movies, int id, String name, String genre,
            String language, int duration) {
        if (findMovieById(movies, id) != null) {
            return Result.fail("Movie ID already exists.");
        }
        if (duration <= 0) {
            return Result.fail("Duration must be greater than zero.");
        }
        movies.add(new Movie(id, name, genre, language, duration));
        return Result.ok("Movie added successfully.");
    }

    public static Result updateMovie(ArrayList<Movie> movies, int id, String name, String genre,
            String language, int duration) {
        Movie movie = findMovieById(movies, id);
        if (movie == null) {
            return Result.fail("Movie not found.");
        }
        if (duration <= 0) {
            return Result.fail("Duration must be greater than zero.");
        }
        movie.setMovieName(name);
        movie.setGenre(genre);
        movie.setLanguage(language);
        movie.setDuration(duration);
        return Result.ok("Movie updated successfully.");
    }
}
