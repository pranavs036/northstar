"use client";

import { useState } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  Loader2,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";

type Role = "owner" | "admin" | "editor" | "viewer";

interface TeamMember {
  id: string;
  inviteEmail: string;
  role: Role;
  inviteAccepted: boolean;
  created: string;
  expand?: {
    member?: {
      id: string;
      email: string;
      name?: string;
    };
  };
}

interface TeamManagementProps {
  initialMembers: TeamMember[];
  currentUserRole: Role;
}

const ROLE_COLORS: Record<Role, string> = {
  owner: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  admin: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  editor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  viewer: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const ROLES: Role[] = ["admin", "editor", "viewer"];

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${ROLE_COLORS[role]}`}
    >
      {role}
    </span>
  );
}

export function TeamManagement({
  initialMembers,
  currentUserRole,
}: TeamManagementProps) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("viewer");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingInviteUrl, setPendingInviteUrl] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const canManageTeam = currentUserRole === "owner" || currentUserRole === "admin";

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);
    setPendingInviteUrl(null);

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send invite");
      }

      // Add to local list immediately as a pending invite
      setMembers((prev) => [data, ...prev]);
      setPendingInviteUrl(data.inviteUrl);
      setInviteEmail("");
    } catch (err) {
      setInviteError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(memberId: string) {
    setRemovingId(memberId);
    setRemoveError(null);

    try {
      const res = await fetch(`/api/team?id=${encodeURIComponent(memberId)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to remove team member");
      }

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      setRemoveError(
        err instanceof Error ? err.message : "Failed to remove team member"
      );
    } finally {
      setRemovingId(null);
    }
  }

  async function handleRoleChange(memberId: string, newRole: Role) {
    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId, role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update role");
      }

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    } catch (err) {
      console.error("[team role change]", err);
    }
  }

  async function copyInviteLink(url: string, id: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback: select text
    }
  }

  return (
    <div className="space-y-6">
      {/* Invite form — only for owner/admin */}
      {canManageTeam && (
        <div className="bg-bg-secondary border border-border rounded-xl p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Invite Team Member
            </h3>
            <p className="text-sm text-text-tertiary mt-1">
              Send an invite link to add someone to your brand workspace.
            </p>
          </div>

          {inviteError && (
            <div className="flex gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{inviteError}</p>
            </div>
          )}

          <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value);
                setInviteError(null);
              }}
              placeholder="colleague@company.com"
              required
              className="flex-1 min-w-48 px-4 py-2.5 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary text-sm"
              disabled={inviting}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className="px-3 py-2.5 bg-bg-tertiary border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary"
              disabled={inviting}
            >
              {ROLES.map((r) => (
                <option key={r} value={r} className="capitalize">
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {inviting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {inviting ? "Sending…" : "Send Invite"}
            </button>
          </form>

          {/* Invite link display */}
          {pendingInviteUrl && (
            <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
              <p className="text-sm text-green-400 font-medium">
                Invite created. Share this link with your team member:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-text-secondary bg-bg-tertiary px-3 py-2 rounded border border-border truncate">
                  {pendingInviteUrl}
                </code>
                <button
                  onClick={() =>
                    copyInviteLink(pendingInviteUrl, "pending")
                  }
                  className="p-2 text-text-tertiary hover:text-text-primary transition-colors flex-shrink-0"
                  title="Copy invite link"
                >
                  {copiedId === "pending" ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Team members list */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">
            Team Members
          </h3>
          <span className="text-sm text-text-tertiary">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </span>
        </div>

        {removeError && (
          <div className="flex gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{removeError}</p>
          </div>
        )}

        {members.length === 0 ? (
          <div className="text-center py-10">
            <Users className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-40" />
            <p className="text-text-tertiary text-sm">
              No team members yet. Invite someone to collaborate.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {members.map((member) => {
              const displayName =
                member.expand?.member?.name ||
                member.expand?.member?.email ||
                member.inviteEmail;
              const isPending = !member.inviteAccepted;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-accent-primary text-sm font-semibold uppercase">
                        {displayName.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-text-primary truncate">
                          {displayName}
                        </span>
                        {isPending && (
                          <span className="text-xs text-text-tertiary bg-bg-tertiary border border-border px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                      {member.expand?.member?.email &&
                        member.expand.member.email !== displayName && (
                          <p className="text-xs text-text-tertiary truncate">
                            {member.expand.member.email}
                          </p>
                        )}
                      {isPending && (
                        <p className="text-xs text-text-tertiary truncate">
                          {member.inviteEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {/* Role selector / badge */}
                    {canManageTeam && member.role !== "owner" ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.id, e.target.value as Role)
                        }
                        className="text-xs px-2 py-1 bg-bg-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-primary capitalize"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r} className="capitalize">
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <RoleBadge role={member.role} />
                    )}

                    {/* Remove button — only for owner/admin, not for owner records */}
                    {canManageTeam && member.role !== "owner" && (
                      <button
                        onClick={() => handleRemove(member.id)}
                        disabled={removingId === member.id}
                        className="p-1.5 text-text-tertiary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove team member"
                      >
                        {removingId === member.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Role legend */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          Role Permissions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <RoleBadge role="owner" />
              <span className="text-text-secondary">Full access, billing</span>
            </div>
            <div className="flex items-center gap-2">
              <RoleBadge role="admin" />
              <span className="text-text-secondary">
                Full access, manage team
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <RoleBadge role="editor" />
              <span className="text-text-secondary">
                Run audits, edit catalog
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RoleBadge role="viewer" />
              <span className="text-text-secondary">
                View reports only
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
