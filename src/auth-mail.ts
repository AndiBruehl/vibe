import { emailAuthAvailable } from "@/auth-options";

export async function sendLoginMail(email: string, token: string, kind: string, de: boolean) {
  if (!emailAuthAvailable()) throw Error("Email unavailable");
  const base = new URL(process.env.AUTH_URL!);
  if (base.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && base.hostname === "localhost")) throw Error("Invalid auth origin");
  const url = new URL("/account/confirm", base);
  // A fragment is not sent in HTTP logs or Referer headers.
  url.hash = token;
  const subject = de ? "VIBE – Anmeldung bestätigen" : "VIBE – confirm your request";
  const action = kind === "reset" ? (de ? "Passwort zurücksetzen" : "Reset your password") : kind === "oauth" ? (de ? "Microsoft-Anmeldung bestätigen" : "Confirm Microsoft sign-in") : (de ? "E-Mail bestätigen und Passwort festlegen" : "Verify email and choose a password");
  const text = `${action}\n\n${url.toString()}\n\n${de ? "Dieser Link ist 20 Minuten gültig und nur einmal verwendbar. Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail. Dein Konto wird dadurch nicht geändert." : "This link expires in 20 minutes and can only be used once. If you did not request it, ignore this email. Your account will not be changed."}\n\nThe VIBE Team`;
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.AUTH_EMAIL_FROM, to: email, subject, text }), signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw Error("Email unavailable");
}
