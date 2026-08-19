import fs from "fs";
import path from "path";

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

// NOW import createClient after process.env is set
import { createClient } from "@supabase/supabase-js";

async function verifyLiveSupabaseConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://oxoruqfjcqhxnxsgwcar.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

  console.log("==================================================");
  console.log("SUPABASE LIVE CONNECTION TEST");
  console.log("Target Project URL:", url);
  console.log("Key Loaded (first 40 chars):", key.slice(0, 40) + "...");
  console.log("==================================================");

  const supabaseClient = createClient(url, key);

  try {
    // 1. SELECT test
    const { data: existingRows, error: selectError } = await supabaseClient
      .from("reviews")
      .select("id, review_text, language, created_at");

    if (selectError) {
      console.error("[SUPABASE SELECT FAILED]:", selectError);
      return;
    }

    console.log(`[SUPABASE SELECT SUCCESS]: Found ${existingRows?.length || 0} existing records in public.reviews`);

    // 2. INSERT test - English
    const engTestText = "ANUPAMA FASHION has an amazing collection of women's wear in Kudasan, Gandhinagar. The quality and designs are exceptional!";
    const { data: insertedEng, error: insertEngError } = await supabaseClient
      .from("reviews")
      .insert({ review_text: engTestText, language: "english" })
      .select()
      .single();

    if (insertEngError) {
      console.error("[SUPABASE ENGLISH INSERT FAILED]:", insertEngError);
      return;
    }

    console.log("[SUPABASE ENGLISH INSERT SUCCESS]:", insertedEng);

    // 3. INSERT test - Gujarati
    const gujTestText = "Shopping mate aavi hati ane ahiya collection ni variety mane ghani game. Kudasan ma ladies fashion mate aa place visit karva jevi chhe.";
    const { data: insertedGuj, error: insertGujError } = await supabaseClient
      .from("reviews")
      .insert({ review_text: gujTestText, language: "gujarati" })
      .select()
      .single();

    if (insertGujError) {
      console.error("[SUPABASE GUJARATI INSERT FAILED]:", insertGujError);
      return;
    }

    console.log("[SUPABASE GUJARATI INSERT SUCCESS]:", insertedGuj);

    console.log("==================================================");
    console.log("ALL SUPABASE DATABASE TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================");
  } catch (err) {
    console.error("[SUPABASE TEST EXCEPTION]:", err);
  }
}

verifyLiveSupabaseConnection();
