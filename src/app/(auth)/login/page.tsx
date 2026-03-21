"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/pocketbase/client";
import { LogIn, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.email || !formData.password) {
        throw new Error("Please fill in all fields");
      }

      const pb = createClient();
      await pb.collection("users").authWithPassword(
        formData.email,
        formData.password
      );

      // Persist auth cookie for SSR
      document.cookie = pb.authStore.exportToCookie({ httpOnly: false, sameSite: "lax" });

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Invalid email or password";
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-violet-600/20 rounded-lg mx-auto">
          <LogIn className="w-6 h-6 text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-50">Sign In</h1>
        <p className="text-slate-400">
          Access your NorthStar audit dashboard
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-slate-300">
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
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-slate-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-600/50"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-slate-800/50 text-slate-400">
            Don&apos;t have an account?
          </span>
        </div>
      </div>

      <Link
        href="/signup"
        className="block w-full px-4 py-3 border border-slate-600 text-slate-300 rounded-lg font-semibold hover:border-slate-500 hover:bg-slate-700/30 transition-all text-center"
      >
        Create an Account
      </Link>
    </div>
  );
}
