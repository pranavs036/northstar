import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { ZodError } from "zod";

const CreateCompetitorSchema = z.object({
  brandId: z.string().cuid("Invalid brand ID"),
  domain: z
    .string()
    .min(1, "Domain is required")
    .refine(
      (domain) => {
        try {
          new URL(`https://${domain}`);
          return true;
        } catch {
          return false;
        }
      },
      "Invalid domain format"
    ),
  name: z.string().optional(),
});

type CreateCompetitorRequest = z.infer<typeof CreateCompetitorSchema>;

const DeleteCompetitorSchema = z.object({
  id: z.string().cuid("Invalid competitor ID"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validated = CreateCompetitorSchema.parse(body);

    // Verify brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: validated.brandId },
    });

    if (!brand) {
      return NextResponse.json(
        { message: "Brand not found" },
        { status: 404 }
      );
    }

    // Create competitor
    const competitor = await prisma.competitor.create({
      data: {
        brandId: validated.brandId,
        domain: validated.domain.toLowerCase(),
        name: validated.name || null,
      },
    });

    return NextResponse.json(competitor, { status: 201 });
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

    console.error("[competitors POST]", error);
    return NextResponse.json(
      { message: "Failed to add competitor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Competitor ID is required" },
        { status: 400 }
      );
    }

    // Validate ID
    const validated = DeleteCompetitorSchema.parse({ id });

    // Verify competitor exists
    const competitor = await prisma.competitor.findUnique({
      where: { id: validated.id },
    });

    if (!competitor) {
      return NextResponse.json(
        { message: "Competitor not found" },
        { status: 404 }
      );
    }

    // Delete competitor
    await prisma.competitor.delete({
      where: { id: validated.id },
    });

    return NextResponse.json(
      { message: "Competitor deleted successfully" },
      { status: 200 }
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

    console.error("[competitors DELETE]", error);
    return NextResponse.json(
      { message: "Failed to delete competitor" },
      { status: 500 }
    );
  }
}
