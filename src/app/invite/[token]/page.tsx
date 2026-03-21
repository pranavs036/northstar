"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/pocketbase/client";
import { UserPlus, AlertCircle, Loader2, CheckCircle } from "lucide-react";

interface InviteDetails {
  id: string;
  inviteEmail: string;
  role: string;
  inviteAccepted: boolean;
  expand?: {
    owner?: {
      brandName?: string;
      email?: string;
    };
  };
}

type PageState = "loading" | "valid" | "invalid" | "accepted" | "success";

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function lookupInvite() {
      if (!token) {
        setPageState("invalid");
        return;
      }

      try {
        const pb = createClient();
        const results = await pb
          .collection("team_members")
          .getFullList({
            filter: `inviteToken="${token}"`,
            expand: "owner",
          });

        if (results.length === 0) {
          setPageState("invalid");
          return;
        }

        const record = results[0] as unknown as InviteDetails;

        if (record.inviteAccepted) {
          setPageState("accepted");
          return;
        }

        setInvite(record);
        setFormData((prev) => ({ ...prev, email: record.inviteEmail }));
        setPageState("valid");
      } catch (err) {
        console.error("[invite lookup]", err);
        setPageState("invalid");
      }
    }

    lookupInvite();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const pb = createClient();

      if (mode === "signup") {
        if (!formData.name.trim()) throw new Error("Name is required");
        if (!formData.password) throw new Error("Password is required");
        if (formData.password.length < 8)
          throw new Error("Password must be at least 8 characters");
        if (formData.password !== formData.confirmPassword)
          throw new Error("Passwords do not match");

        // Create new user account
        await pb.collection("users").create({
          email: formData.email,
          password: formData.password,
          passwordConfirm: formData.confirmPassword,
          name: formData.name,
          plan: "FREE",
          role: invite?.role ?? "viewer",
        });

        await pb
          .collection("users")
          .authWithPassword(formData.email, formData.password);
      } else {
        // Login with existing account
        await pb
          .collection("users")
          .authWithPassword(formData.email, formData.password);
      }

      if (!pb.authStore.isValid || !pb.authStore.record) {
        throw new Error("Authentication failed");
      }

      const memberId = pb.authStore.record.id;

      // Accept the invite — update the team_members record
      const adminPb = createClient();
      // Re-authenticate to update the record (the user is now logged in)
      adminPb.authStore.loadFromCookie(
        pb.authStore.exportToCookie({ httpOnly: false })
      );

      await adminPb.collection("team_members").update(invite!.id, {
        member: memberId,
        inviteAccepted: true,
        inviteToken: "", // clear the token after use
      });

      // Persist auth cookie
      document.cookie = pb.authStore.exportToCookie({
        httpOnly: false,
        sameSite: "lax",
      });

      setPageState("success");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 2000);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);
      setSubmitting(false);
    }
  };

  // --- Render states ---

  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
          <p className="text-slate-400">Validating invite link…</p>
        </div>
      </div>
    );
  }

  if (pageState === "invalid") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-xl p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="text-2xl font-bold text-slate-50">
            Invalid Invite Link
          </h1>
          <p className="text-slate-400">
            This invite link is invalid or has already expired. Please ask your
            team owner to send a new invite.
          </p>
          <a
            href="/login"
            className="block w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all text-center"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (pageState === "accepted") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-xl p-8 text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
          <h1 className="text-2xl font-bold text-slate-50">
            Invite Already Used
          </h1>
          <p className="text-slate-400">
            This invite has already been accepted. Please log in to access your
            dashboard.
          </p>
          <a
            href="/login"
            className="block w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all text-center"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-xl p-8 text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
          <h1 className="text-2xl font-bold text-slate-50">
            Welcome to the Team!
          </h1>
          <p className="text-slate-400">
            Your account has been set up. Redirecting you to the dashboard…
          </p>
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // pageState === "valid" — show the signup/login form
  const brandName =
    invite?.expand?.owner?.brandName ?? "a NorthStar team";
  const roleName = invite?.role ?? "viewer";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-violet-600/20 rounded-lg mx-auto">
              <UserPlus className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-50">
              You&apos;re Invited
            </h1>
            <p className="text-slate-400">
              You&apos;ve been invited to join{" "}
              <span className="text-indigo-400 font-medium">{brandName}</span>{" "}
              as a{" "}
              <span className="capitalize font-medium text-slate-300">
                {roleName}
              </span>
              .
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg border border-slate-600 overflow-hidden">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === "signup"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === "login"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              Log In
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-300"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  disabled={submitting}
                />
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={
                  mode === "signup" ? "At least 8 characters" : "Your password"
                }
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                disabled={submitting}
              />
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-300"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  disabled={submitting}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting
                ? "Setting up your account…"
                : mode === "signup"
                ? "Accept Invite & Create Account"
                : "Accept Invite & Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
