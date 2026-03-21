import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";
import { z, ZodError } from "zod";
import { suggestPrompts } from "@/lib/ai/prompt-suggester";

const SuggestSchema = z.object({
  brandDomain: z.string().min(1, "Brand domain is required"),
  productCategories: z.array(z.string()).default([]),
  existingPromptTexts: z.array(z.string()).default([]),
});

function getPocketBase(request: NextRequest) {
  const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
  const pb = new PocketBase(pbUrl);
  const pbCookie = request.cookies.get("pb_auth");
  if (pbCookie) {
    pb.authStore.loadFromCookie(`pb_auth=${pbCookie.value}`);
  }
  return pb;
}

export async function POST(request: NextRequest) {
  try {
    const pb = getPocketBase(request);
    if (!pb.authStore.isValid) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = SuggestSchema.parse(body);

    const suggestions = await suggestPrompts(
      validated.brandDomain,
      validated.productCategories,
      validated.existingPromptTexts
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return NextResponse.json({ message: `Validation error: ${messages}` }, { status: 400 });
    }

    console.error("[prompts/suggest POST]", error);
    return NextResponse.json({ message: "Failed to generate suggestions" }, { status: 500 });
  }
}
