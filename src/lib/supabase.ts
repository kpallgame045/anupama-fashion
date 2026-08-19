import { createClient } from "@supabase/supabase-js";

export interface ReviewRecord {
  id?: string;
  review_text: string;
  language: string;
  created_at?: string;
}

export const SUPABASE_PROJECT_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://oxoruqfjcqhxnxsgwcar.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

/**
 * Initialize Supabase client targeting the real project URL
 */
export const supabase = createClient(
  SUPABASE_PROJECT_URL,
  SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder"
);

/**
 * Check if the publishable key is configured
 */
export function isPublishableKeyConfigured(): boolean {
  return Boolean(
    SUPABASE_PUBLISHABLE_KEY &&
      !SUPABASE_PUBLISHABLE_KEY.includes("placeholder") &&
      !SUPABASE_PUBLISHABLE_KEY.includes("your_supabase_publishable_key") &&
      !SUPABASE_PUBLISHABLE_KEY.includes("<REAL")
  );
}

/**
 * Fetch ALL historical reviews from public.reviews for unrestricted historical similarity checking
 */
export async function getAllHistoricalReviews(): Promise<{ reviews: string[]; error?: any }> {
  if (!isPublishableKeyConfigured()) {
    return { reviews: [] };
  }

  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, review_text, language, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[SUPABASE SELECT ERROR on public.reviews]:", error.message, error.details);
      return { reviews: [], error: error.message || JSON.stringify(error) };
    }

    const reviewsList = (data || []).map((row: { review_text: string }) => row.review_text).filter(Boolean);
    console.log(`[SUPABASE SUCCESS] Fetched ${reviewsList.length} historical reviews from public.reviews`);
    return { reviews: reviewsList };
  } catch (err: any) {
    console.error("[SUPABASE EXCEPTION in getAllHistoricalReviews]:", err);
    return { reviews: [], error: err.message || JSON.stringify(err) };
  }
}

/**
 * Insert accepted unique review draft into public.reviews and log explicit errors
 */
export async function saveAcceptedReview(
  generatedReview: string,
  selectedLanguage: "english" | "gujarati"
): Promise<{ success: boolean; data?: any; error?: any }> {
  if (!isPublishableKeyConfigured()) {
    const errMsg = `Supabase Insert Pending: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not configured in .env.local. Please add your real publishable key (starting with sb_publishable_ or eyJ) for project oxoruqfjcqhxnxsgwcar.`;
    console.warn(errMsg);
    return { success: false, error: errMsg };
  }

  try {
    console.log(`[SUPABASE ATTEMPTING INSERT] URL: ${SUPABASE_PROJECT_URL} | Language: ${selectedLanguage}`);

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        review_text: generatedReview,
        language: selectedLanguage,
      })
      .select()
      .single();

    if (error) {
      console.error("[SUPABASE INSERT FAILURE on public.reviews]:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return {
        success: false,
        error: `Supabase Insert Failed: ${error.message}${error.details ? ` (${error.details})` : ""}${error.hint ? ` - Hint: ${error.hint}` : ""}`,
      };
    }

    console.log("[SUPABASE INSERT SUCCESS] Inserted row into public.reviews:", data);
    return { success: true, data };
  } catch (err: any) {
    console.error("[SUPABASE EXCEPTION during insert]:", err);
    return { success: false, error: err.message || JSON.stringify(err) };
  }
}
