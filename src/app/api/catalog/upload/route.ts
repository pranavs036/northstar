import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { CatalogUploadSchema } from "@/types/catalog";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validated = CatalogUploadSchema.parse(body);

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

    // Prepare SKU data for bulk insert
    const skuData = validated.rows.map((row) => ({
      brandId: validated.brandId,
      skuCode: row.sku,
      name: row.product_name,
      category: row.category || null,
      url: row.url || null,
      description: row.description || null,
    }));

    // Use createMany with skipDuplicates to handle duplicate SKU codes
    const result = await prisma.sku.createMany({
      data: skuData,
      skipDuplicates: true,
    });

    return NextResponse.json(
      {
        message: "Catalog uploaded successfully",
        created: result.count,
        total: validated.rows.length,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return NextResponse.json(
        { message: `Validation error: ${messages}` },
        { status: 400 }
      );
    }

    console.error("[catalog/upload]", error);
    return NextResponse.json(
      { message: "Failed to upload catalog" },
      { status: 500 }
    );
  }
}
