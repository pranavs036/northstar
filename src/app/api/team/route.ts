import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";
import { z, ZodError } from "zod";
import { randomBytes } from "crypto";

const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";

const RoleSchema = z.enum(["owner", "admin", "editor", "viewer"]);

const InviteMemberSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: RoleSchema.default("viewer"),
});

const UpdateMemberSchema = z.object({
  id: z.string().min(1, "Member record ID is required"),
  role: RoleSchema,
});

const DeleteMemberSchema = z.object({
  id: z.string().min(1, "Member record ID is required"),
});

function getPocketBase(request: NextRequest) {
  const pb = new PocketBase(POCKETBASE_URL);
  const pbCookie = request.cookies.get("pb_auth");
  if (pbCookie) {
    pb.authStore.loadFromCookie(`pb_auth=${pbCookie.value}`);
  }
  return pb;
}

// GET: list team members for the authenticated user's brand
export async function GET(request: NextRequest) {
  try {
    const pb = getPocketBase(request);
    if (!pb.authStore.isValid || !pb.authStore.record) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = pb.authStore.record.id;

    // Fetch all team members where this user is the owner
    const members = await pb.collection("team_members").getFullList({
      filter: `owner="${userId}"`,
      sort: "-created",
      expand: "member",
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("[team GET]", error);
    return NextResponse.json(
      { message: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

// POST: invite a team member by email + role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = InviteMemberSchema.parse(body);

    const pb = getPocketBase(request);
    if (!pb.authStore.isValid || !pb.authStore.record) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = pb.authStore.record.id;

    // Prevent inviting yourself
    if (pb.authStore.record.email === validated.email) {
      return NextResponse.json(
        { message: "You cannot invite yourself" },
        { status: 400 }
      );
    }

    // Check if invite already exists for this email under the same owner
    const existing = await pb
      .collection("team_members")
      .getFullList({
        filter: `owner="${userId}" && inviteEmail="${validated.email}"`,
      })
      .catch(() => []);

    if (existing.length > 0) {
      return NextResponse.json(
        { message: "An invite already exists for this email" },
        { status: 409 }
      );
    }

    // Generate a secure random invite token
    const inviteToken = randomBytes(32).toString("hex");

    const teamMember = await pb.collection("team_members").create({
      owner: userId,
      member: "", // empty until invite is accepted
      role: validated.role,
      inviteToken,
      inviteEmail: validated.email,
      inviteAccepted: false,
    });

    // In production, you'd send an email here with the invite link
    // For now, return the token in the response for manual sharing
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${inviteToken}`;

    return NextResponse.json(
      { ...teamMember, inviteUrl },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return NextResponse.json(
        { message: `Validation error: ${messages}` },
        { status: 400 }
      );
    }
    console.error("[team POST]", error);
    return NextResponse.json(
      { message: "Failed to send invite" },
      { status: 500 }
    );
  }
}

// PATCH: update a team member's role
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = UpdateMemberSchema.parse(body);

    const pb = getPocketBase(request);
    if (!pb.authStore.isValid || !pb.authStore.record) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = pb.authStore.record.id;

    // Verify the caller owns this team member record
    const existing = await pb.collection("team_members").getOne(validated.id);
    if (existing.owner !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Owner role cannot be changed via this endpoint
    if (existing.role === "owner") {
      return NextResponse.json(
        { message: "Cannot change the role of the owner" },
        { status: 400 }
      );
    }

    const updated = await pb.collection("team_members").update(validated.id, {
      role: validated.role,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return NextResponse.json(
        { message: `Validation error: ${messages}` },
        { status: 400 }
      );
    }
    console.error("[team PATCH]", error);
    return NextResponse.json(
      { message: "Failed to update team member role" },
      { status: 500 }
    );
  }
}

// DELETE: remove a team member
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Team member record ID is required" },
        { status: 400 }
      );
    }

    const validated = DeleteMemberSchema.parse({ id });

    const pb = getPocketBase(request);
    if (!pb.authStore.isValid || !pb.authStore.record) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = pb.authStore.record.id;

    // Verify ownership before deleting
    const existing = await pb
      .collection("team_members")
      .getOne(validated.id);
    if (existing.owner !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Cannot remove the owner record
    if (existing.role === "owner") {
      return NextResponse.json(
        { message: "Cannot remove the brand owner from the team" },
        { status: 400 }
      );
    }

    await pb.collection("team_members").delete(validated.id);

    return NextResponse.json(
      { message: "Team member removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[team DELETE]", error);
    return NextResponse.json(
      { message: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
