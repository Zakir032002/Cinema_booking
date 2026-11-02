package javaProject;
import java.util.*;

// Replaces System.out.println: every operation returns a Result,
// which is sent to the web page as JSON.
class Result {
    static final String RUPEE = "₹";

    private boolean ok;
    private String message = "";
    private String note = "";
    private String[] columns;
    private List<String[]> rows = new ArrayList<>();
    private List<String[]> details = new ArrayList<>();

    static Result ok(String message) {
        Result r = new Result();
        r.ok = true;
        r.message = message;
        return r;
    }

    static Result fail(String message) {
        Result r = new Result();
        r.ok = false;
        r.message = message;
        return r;
    }

    // Successful result with no message (only a table / details)
    static Result data() {
        return ok("");
    }

    // Successful result with a plain line of text
    static Result info(String text) {
        Result r = ok("");
        r.note = text;
        return r;
    }

    Result note(String text) {
        this.note = text;
        return this;
    }

    Result columns(String... names) {
        this.columns = names;
        return this;
    }

    Result row(Object... cells) {
        String[] row = new String[cells.length];
        for (int i = 0; i < cells.length; i++) {
            row[i] = String.valueOf(cells[i]);
        }
        rows.add(row);
        return this;
    }

    Result detail(String label, Object value) {
        details.add(new String[] { label, String.valueOf(value) });
        return this;
    }

    // ---------- JSON ----------
    static String quote(String s) {
        StringBuilder sb = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"':  sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        return sb.append('"').toString();
    }

    private static String array(String[] items) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < items.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(quote(items[i]));
        }
        return sb.append("]").toString();
    }

    private static String arrays(List<String[]> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(array(list.get(i)));
        }
        return sb.append("]").toString();
    }

    String toJson() {
        StringBuilder sb = new StringBuilder("{");
        sb.append("\"ok\":").append(ok);
        sb.append(",\"message\":").append(quote(message));
        sb.append(",\"note\":").append(quote(note));
        if (columns != null) {
            sb.append(",\"columns\":").append(array(columns));
            sb.append(",\"rows\":").append(arrays(rows));
        }
        if (!details.isEmpty()) {
            sb.append(",\"details\":").append(arrays(details));
        }
        return sb.append("}").toString();
    }
}
