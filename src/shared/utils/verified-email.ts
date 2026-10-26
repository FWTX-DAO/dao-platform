type LinkedAccount = {
  type: string;
  address?: string;
  email?: string | null;
  verified_at?: number;
  verifiedAt?: Date | number;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Only provider-verified email identities, never form input or token claims. */
export function getVerifiedEmail(
  accounts: readonly LinkedAccount[] | null | undefined,
): string | null {
  for (const type of ["email", "google_oauth", "apple_oauth"]) {
    const account = accounts?.find((item) => {
      const verified = item.verified_at ?? item.verifiedAt;
      return item.type === type && verified != null && Number(verified) > 0;
    });
    const email = type === "email" ? account?.address : account?.email;
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return normalizeEmail(email);
    }
  }
  return null;
}
