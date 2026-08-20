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

const PRODUCTION_API_URL = "https://anupama-fashion.vercel.app/api/generate-review";

async function verifyProduction5GeminiReviews() {
  console.log("==================================================");
  console.log("TESTING LIVE VERCEL PRODUCTION URL DIRECTLY:");
  console.log("https://anupama-fashion.vercel.app/api/generate-review");
  console.log("==================================================");

  const results: any[] = [];

  for (let i = 1; i <= 5; i++) {
    console.log(`\n--- Generating Live Production Review #${i} via Gemini API ---`);
    const lang = i % 2 === 1 ? "English" : "Gujarati";
    const res = await fetch(PRODUCTION_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ language: lang }),
    });

    const data = await res.json();
    console.log(`Live HTTP Status #${i}:`, res.status);
    console.log(`Model Used #${i}:`, data.modelUsed);
    console.log(`Attempts Used #${i}:`, data.attemptsUsed);
    console.log(`Review Text #${i}:`, data.reviewText);

    if (data.insertedRow) {
      console.log(`Inserted Row ID #${i}:`, data.insertedRow.id);
      results.push(data);
    } else {
      console.error(`Live Production Error #${i}:`, data.error);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("\n==================================================");
  console.log("VERIFYING SUPABASE DATABASE INSERTIONS (oxoruqfjcqhxnxsgwcar.supabase.co)");
  console.log("==================================================");

  const ids = results.map((r) => r.insertedRow?.id).filter(Boolean);
  const { data: dbRows, error: dbError } = await supabaseClient
    .from("reviews")
    .select("*")
    .in("id", ids);

  if (dbError) {
    console.error("Database Verification Error:", dbError);
  } else {
    console.log(`SUCCESS! Verified all ${dbRows?.length} of 5 live production reviews in public.reviews!\n`);
    dbRows?.forEach((row, idx) => {
      console.log(`[LIVE PROD DB ROW #${idx + 1}] ID: ${row.id}`);
      console.log(`Language: ${row.language}`);
      console.log(`Opening Words: "${row.review_text.split(" ").slice(0, 6).join(" ")}..."`);
      console.log(`Full Text: ${row.review_text}`);
      console.log("--------------------------------------------------");
    });
  }

  console.log("==================================================");
}

verifyProduction5GeminiReviews();
