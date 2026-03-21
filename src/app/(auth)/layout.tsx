import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-700/50">
        <nav className="max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-50">NorthStar</span>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 shadow-xl backdrop-blur-sm">
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} NorthStar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
