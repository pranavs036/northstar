import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";
import { CatalogUploadSchema } from "@/types/catalog";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CatalogUploadSchema.parse(body);

    const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
    const pb = new PocketBase(pbUrl);

    // Load auth from cookie
    const pbCookie = request.cookies.get("pb_auth");
    if (pbCookie) {
      pb.authStore.loadFromCookie(`pb_auth=${pbCookie.value}`);
    }

    if (!pb.authStore.isValid) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Verify user exists (brandId = userId in PocketBase)
    try {
      await pb.collection("users").getOne(validated.brandId);
    } catch {
      return NextResponse.json({ message: "Brand not found" }, { status: 404 });
    }

    // Create SKUs sequentially (PocketBase SQLite can't handle concurrent writes)
    let created = 0;
    const errors: string[] = [];
    for (const row of validated.rows) {
      try {
        await pb.collection("skus").create({
          user: validated.brandId,
          skuCode: row.sku,
          name: row.product_name,
          category: row.category || "",
          url: row.url || "",
          description: row.description || "",
        });
        created++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`${row.sku}: ${msg}`);
      }
    }

    return NextResponse.json(
      {
        message: "Catalog uploaded successfully",
        created,
        total: validated.rows.length,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return NextResponse.json({ message: `Validation error: ${messages}` }, { status: 400 });
    }

    console.error("[catalog/upload]", error);
    return NextResponse.json({ message: "Failed to upload catalog" }, { status: 500 });
  }
}
