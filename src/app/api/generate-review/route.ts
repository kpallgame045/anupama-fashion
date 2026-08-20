import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getRecentHistoricalReviews, saveAcceptedReview } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { language = "English" } = body;
    const dbLanguage: "english" | "gujarati" = language.toLowerCase() === "gujarati" ? "gujarati" : "english";

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const modelName = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY is not configured in Vercel environment" },
        { status: 500 }
      );
    }

    // 1. Fast query: Fetch ONLY the latest 15 recent reviews (<40ms)
    const { reviews: recentReviews } = await getRecentHistoricalReviews(15);

    const doNotRepeatList =
      recentReviews.length > 0
        ? `DO NOT REPEAT OR COPY ANY OF THESE PREVIOUS REVIEWS:\n${recentReviews
            .map((r, i) => `${i + 1}. "${r}"`)
            .join("\n")}`
        : "";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const isGujarati = dbLanguage === "gujarati";

    const languageInstruction = isGujarati
      ? `LANGUAGE: Write in GUJARATI using ONLY ENGLISH / ROMAN ALPHABET LETTERS (WhatsApp style). DO NOT use Gujarati Unicode script (NO કેમ છો).`
      : `LANGUAGE: Write natural Indian English as typed by a real customer.`;

    const openingAngles = [
      "Focus on the luxurious fabric quality and comfortable fitting of a two-piece co-ord set.",
      "Focus on how an outfit from this store received compliments at a recent party or family event.",
      "Focus on praising the store's unique range of one-piece dresses and western wear in Kudasan.",
      "Focus on recommending this boutique to anyone visiting Gandhinagar for trendy women's wear.",
      "Focus on the friendly staff assistance and pleasant overall shopping ambiance.",
    ];

    // Pick a random opening angle for instant diversity
    const randomAngle = openingAngles[Math.floor(Math.random() * openingAngles.length)];

    const prompt = `Write ONE unique Google review for ANUPAMA FASHION (Women's Clothing Boutique, Kudasan, Gandhinagar).

${languageInstruction}

LENGTH: 45 to 65 words.

ANGLE: ${randomAngle}

FORBIDDEN OPENINGS (CRITICAL - DO NOT START WITH ANY OF THESE):
- "Finding..." / "Finding a..." / "Stumbled upon..." / "Finally found..." / "Was looking for..." / "Visited ANUPAMA FASHION..." / "ANUPAMA FASHION is..."

${doNotRepeatList}

OUTPUT FORMAT:
Return ONLY the plain text review. No quotes, no titles, no emojis, no explanations.`;

    let reviewText = "";
    let attemptsUsed = 1;

    // 2. Perform EXACTLY ONE fast Gemini generation request
    try {
      const result = await model.generateContent(prompt);
      reviewText = result.response.text().trim().replace(/^["']|["']$/g, "");
    } catch (firstError: any) {
      console.warn("[GEMINI ATTEMPT 1 FAILED] Retrying once with fallback model...", firstError);
      attemptsUsed = 2;
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await fallbackModel.generateContent(prompt);
        reviewText = result.response.text().trim().replace(/^["']|["']$/g, "");
      } catch (retryError: any) {
        return NextResponse.json(
          {
            success: false,
            error: `Gemini API Error: ${retryError.message || firstError.message}`,
          },
          { status: 500 }
        );
      }
    }

    // 3. Save accepted review row to Supabase public.reviews
    const saveResult = await saveAcceptedReview(reviewText, dbLanguage);

    if (!saveResult.success) {
      console.error("[API ROUTE SUPABASE INSERT FAILED]:", saveResult.error);
      return NextResponse.json(
        {
          success: false,
          error: typeof saveResult.error === "string" ? saveResult.error : JSON.stringify(saveResult.error),
          reviewText,
          language: dbLanguage,
        },
        { status: 500 }
      );
    }

    const durationMs = Date.now() - startTime;
    console.log(`[FAST REVIEW GENERATED IN ${durationMs}ms] ID: ${saveResult.data?.id}`);

    return NextResponse.json(
      {
        success: true,
        reviewText,
        language: dbLanguage,
        insertedRow: saveResult.data,
        attemptsUsed,
        modelUsed: modelName,
        generationTimeMs: durationMs,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-review API route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate review" },
      { status: 500 }
    );
  }
}
