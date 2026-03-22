import PocketBase from "pocketbase";
import { cookies } from "next/headers";

const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";

export async function createServerClient() {
  const pb = new PocketBase(POCKETBASE_URL);
  pb.autoCancellation(false);

  const cookieStore = await cookies();
  const pbCookie = cookieStore.get("pb_auth");

  if (pbCookie) {
    try {
      const decoded = decodeURIComponent(pbCookie.value);
      const parsed = JSON.parse(decoded);

      if (parsed.token) {
        pb.authStore.save(parsed.token, parsed.record);
      }
    } catch {
      pb.authStore.clear();
    }
  }

  return pb;
}
