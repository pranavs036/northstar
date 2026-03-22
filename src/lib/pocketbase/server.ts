import PocketBase from "pocketbase";
import { cookies } from "next/headers";

const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";

export async function createServerClient() {
  const pb = new PocketBase(POCKETBASE_URL);

  const cookieStore = await cookies();
  const pbCookie = cookieStore.get("pb_auth");

  if (pbCookie) {
    try {
      // Parse the cookie value to extract token and record
      const decoded = decodeURIComponent(pbCookie.value);
      const parsed = JSON.parse(decoded);

      if (parsed.token) {
        // Save the token directly to authStore
        pb.authStore.save(parsed.token, parsed.record);

        // Try to refresh to verify token is still valid
        if (pb.authStore.isValid) {
          try {
            await pb.collection("users").authRefresh();
          } catch {
            // Token refresh failed but the token might still work for API calls
            // Re-save the original token since authRefresh clears it on failure
            pb.authStore.save(parsed.token, parsed.record);
          }
        }
      }
    } catch {
      pb.authStore.clear();
    }
  }

  return pb;
}
