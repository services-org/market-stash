/** The app has one user and one PIN (no email / password). Works in the proxy (edge) and in route handlers. */
export const AUTH_COOKIE = "abo_session";
export const AUTH_MAX_AGE = 60 * 60 * 24 * 365; // one year

const PIN = process.env.APP_PIN || "amr@1369";

export const isValidPin = (pin: unknown) => typeof pin === "string" && pin === PIN;

/** The cookie value that proves the PIN was entered (a hash, so the PIN itself is never stored in the cookie). */
export async function sessionToken() {
    const bytes = new TextEncoder().encode(`abo-roqia:${PIN}`);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
