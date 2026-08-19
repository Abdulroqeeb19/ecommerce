export interface PasswordCheck {
  ok: boolean;
  error?: string;
}

export function validatePassword(password: unknown): PasswordCheck {
  if (typeof password !== "string" || password.length < 12) {
    return { ok: false, error: "Password must be at least 12 characters" };
  }
  if (password.length > 128) return { ok: false, error: "Password is too long" };
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { ok: false, error: "Password must include uppercase, lowercase and a number" };
  }
  return { ok: true };
}