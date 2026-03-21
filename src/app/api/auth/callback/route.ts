import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const brandCreateSchema = z.object({
  email: z.string().email("Invalid email address"),
  brandName: z.string().min(1, "Brand name is required"),
  domain: z.string().url("Invalid domain URL"),
  supabaseId: z.string().optional(),
});

type BrandCreateRequest = z.infer<typeof brandCreateSchema>;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = brandCreateSchema.parse(body);

    // Check if brand already exists
    const existingBrand = await prisma.brand.findUnique({
      where: { email: validatedData.email },
    });

    if (existingBrand) {
      return Response.json(
        { error: "Brand with this email already exists" },
        { status: 409 }
      );
    }

    // Create brand record
    const brand = await prisma.brand.create({
      data: {
        name: validatedData.brandName,
        email: validatedData.email,
        domain: validatedData.domain,
        supabaseId: validatedData.supabaseId,
        plan: "FREE",
      },
    });

    return Response.json(brand, { status: 201 });
  } catch (error) {
    console.error("Auth callback error:", error);

    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
