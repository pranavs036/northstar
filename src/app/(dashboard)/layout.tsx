import { createServerClient } from "@/lib/pocketbase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LogOut } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { cn } from "@/lib/utils/cn";

async function signOut() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete("pb_auth");
  redirect("/login");
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pb = await createServerClient();

  if (!pb.authStore.isValid || !pb.authStore.record) {
    redirect("/login");
  }

  const userEmail = pb.authStore.record.email || "User";

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-bg-secondary border-b border-border px-8 py-4 flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">{userEmail}</span>
            <form action={signOut}>
              <button
                type="submit"
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-bg-tertiary text-text-secondary hover:bg-accent-primary hover:text-white",
                  "transition-colors text-sm font-medium"
                )}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </form>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
