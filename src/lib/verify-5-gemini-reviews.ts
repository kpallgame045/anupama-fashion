import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const parts = trimmed.split("=");
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://oxoruqfjcqhxnxsgwcar.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const supabaseClient = createClient(supabaseUrl, supabaseKey);

async function verify5GeminiReviews() {
  console.log("==================================================");
  console.log("VERIFYING 5 CONSECUTIVE REAL GEMINI REVIEWS");
  console.log("==================================================");

  const results: any[] = [];

  for (let i = 1; i <= 5; i++) {
    console.log(`\n--- Generating Review #${i} via Real Gemini API ---`);
    const lang = i % 2 === 1 ? "English" : "Gujarati";
    const res = await fetch("http://localhost:3000/api/generate-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: lang }),
    });

    const data = await res.json();
    console.log(`Status #${i}:`, res.status);
    console.log(`Model Used #${i}:`, data.modelUsed);
    console.log(`Attempts Used #${i}:`, data.attemptsUsed);
    console.log(`Review Text #${i}:`, data.reviewText);

    if (data.insertedRow) {
      console.log(`Inserted Row ID #${i}:`, data.insertedRow.id);
      results.push(data);
    } else {
      console.error(`Failed to insert row #${i}:`, data.error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  console.log("\n==================================================");
  console.log("VERIFYING DATABASE RECORDS IN SUPABASE (public.reviews)");
  console.log("==================================================");

  const ids = results.map((r) => r.insertedRow?.id).filter(Boolean);
  const { data: dbRows, error: dbError } = await supabaseClient
    .from("reviews")
    .select("*")
    .in("id", ids);

  if (dbError) {
    console.error("Database Verification Error:", dbError);
  } else {
    console.log(`SUCCESS! Verified all ${dbRows?.length} inserted rows live in public.reviews!\n`);
    dbRows?.forEach((row, idx) => {
      console.log(`[DB ROW #${idx + 1}] ID: ${row.id}`);
      console.log(`Language: ${row.language}`);
      console.log(`Opening Words: "${row.review_text.split(" ").slice(0, 5).join(" ")}..."`);
      console.log(`Full Text: ${row.review_text}`);
      console.log("--------------------------------------------------");
    });
  }

  console.log("==================================================");
}

verify5GeminiReviews();
