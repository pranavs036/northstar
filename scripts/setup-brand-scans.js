// Run this script to create the brand_scans collection in PocketBase
// Usage: node scripts/setup-brand-scans.js

const PocketBase = require("pocketbase/cjs");

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || "admin@northstar.dev";
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || "adminadmin123";

async function setup() {
  const pb = new PocketBase(POCKETBASE_URL);

  // Auth as admin
  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log("Authenticated as admin");
  } catch (err) {
    console.error("Failed to auth as admin. Make sure PocketBase is running and admin credentials are correct.");
    console.error("Admin URL:", `${POCKETBASE_URL}/_/`);
    process.exit(1);
  }

  // Get users collection ID for relation
  let usersCollectionId;
  try {
    const users = await pb.collections.getOne("users");
    usersCollectionId = users.id;
    console.log("Found users collection:", usersCollectionId);
  } catch {
    console.error("Users collection not found!");
    process.exit(1);
  }

  // Check if brand_scans already exists
  try {
    const existing = await pb.collections.getOne("brand_scans");
    console.log("brand_scans collection already exists:", existing.id);
    console.log("Done!");
    return;
  } catch {
    // Doesn't exist yet — create it
  }

  // Create brand_scans collection
  try {
    const collection = await pb.collections.create({
      name: "brand_scans",
      type: "base",
      schema: [
        { name: "user", type: "relation", required: true, options: { collectionId: usersCollectionId, maxSelect: 1 } },
        { name: "status", type: "select", required: true, options: { values: ["PENDING", "SCANNING", "COMPLETE", "FAILED"] } },
        { name: "brandName", type: "text", required: false },
        { name: "brandDomain", type: "text", required: false },
        { name: "brandDescription", type: "text", required: false },
        { name: "categories", type: "text", required: false },
        { name: "totalQueries", type: "number", required: false },
        { name: "completedQueries", type: "number", required: false },
        { name: "brandVisibleCount", type: "number", required: false },
        { name: "visibilityScore", type: "number", required: false },
        { name: "results", type: "json", required: false },
        { name: "tierScores", type: "json", required: false },
        { name: "completedAt", type: "date", required: false },
      ],
      listRule: '@request.auth.id = user',
      viewRule: '@request.auth.id = user',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id = user',
      deleteRule: '@request.auth.id = user',
    });
    console.log("Created brand_scans collection:", collection.id);
  } catch (err) {
    console.error("Failed to create brand_scans collection:", err);

    // Try with field-level collectionId (PocketBase 0.36+ format)
    try {
      const collection = await pb.collections.create({
        name: "brand_scans",
        type: "base",
        schema: [
          { name: "user", type: "relation", required: true, collectionId: usersCollectionId, maxSelect: 1 },
          { name: "status", type: "select", required: true, values: ["PENDING", "SCANNING", "COMPLETE", "FAILED"] },
          { name: "brandName", type: "text" },
          { name: "brandDomain", type: "text" },
          { name: "brandDescription", type: "text" },
          { name: "categories", type: "text" },
          { name: "totalQueries", type: "number" },
          { name: "completedQueries", type: "number" },
          { name: "brandVisibleCount", type: "number" },
          { name: "visibilityScore", type: "number" },
          { name: "results", type: "json" },
          { name: "tierScores", type: "json" },
          { name: "completedAt", type: "date" },
        ],
        listRule: '@request.auth.id = user',
        viewRule: '@request.auth.id = user',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id = user',
        deleteRule: '@request.auth.id = user',
      });
      console.log("Created brand_scans collection (alt format):", collection.id);
    } catch (err2) {
      console.error("Both creation attempts failed:", err2);
      console.log("\nManual steps:");
      console.log("1. Open PocketBase Admin: http://127.0.0.1:8090/_/");
      console.log("2. Create a new collection called 'brand_scans'");
      console.log("3. Add these fields:");
      console.log("   - user (relation -> users)");
      console.log("   - status (select: PENDING, SCANNING, COMPLETE, FAILED)");
      console.log("   - brandName (text)");
      console.log("   - brandDomain (text)");
      console.log("   - brandDescription (text)");
      console.log("   - categories (text)");
      console.log("   - totalQueries (number)");
      console.log("   - completedQueries (number)");
      console.log("   - brandVisibleCount (number)");
      console.log("   - visibilityScore (number)");
      console.log("   - results (json)");
      console.log("   - tierScores (json)");
      console.log("   - completedAt (date)");
      console.log("4. Set API rules: listRule/viewRule = '@request.auth.id = user'");
    }
  }

  console.log("Done!");
}

setup().catch(console.error);
