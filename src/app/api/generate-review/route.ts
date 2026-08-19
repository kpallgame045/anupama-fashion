import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAllHistoricalReviews, saveAcceptedReview } from "@/lib/supabase";
import { isReviewSimilar } from "@/lib/similarity";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
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
        { success: false, error: "GEMINI_API_KEY is not configured in environment" },
        { status: 500 }
      );
    }

    // 1. Fetch ALL previous reviews from public.reviews
    const { reviews: historicalReviews } = await getAllHistoricalReviews();

    const genAI = new GoogleGenerativeAI(apiKey);
    
    let model;
    try {
      model = genAI.getGenerativeModel({ model: modelName });
    } catch {
      model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    const isGujarati = dbLanguage === "gujarati";

    const languageInstruction = isGujarati
      ? `STRICT LANGUAGE REQUIREMENT:
- Write in GUJARATI language using ONLY ENGLISH / ROMAN ALPHABET LETTERS (WhatsApp style Gujarati).
- DO NOT use Gujarati Unicode script (NO કેમ છો).
- DO NOT force "Kem cho" or repetitive greetings.`
      : `STRICT LANGUAGE REQUIREMENT:
- Write natural Indian English as typed by a real customer.`;

    let acceptedDraft = "";
    let attempts = 0;
    const maxAttempts = 15;
    let lastGeminiError = "";

    while (attempts < maxAttempts) {
      attempts++;

      const prompt = `You are a real customer writing ONE unique Google review for ANUPAMA FASHION.

STORE DETAILS:
- Name: ANUPAMA FASHION
- Category: Women's Clothing & Boutique
- Location: Kudasan, Gandhinagar, Gujarat.
- Offerings: One-Piece dresses, Two-Piece co-ords, Western wear, Ethnic wear, Fashion collections.

${languageInstruction}

REVIEW LENGTH:
- Must be between 45 and 70 words.

STRICT OPENING & DIVERSITY RULES (CRITICAL):
- ABSOLUTELY FORBIDDEN OPENING PHRASES (DO NOT START WITH ANY OF THESE):
  * "Finding..." / "Finding a..." / "Finding the..."
  * "Stumbled upon..." / "I stumbled upon..."
  * "Finally found..." / "Finally managed..."
  * "Was looking for..." / "I was looking..."
  * "Visited ANUPAMA FASHION..." / "I visited..."
  * "ANUPAMA FASHION is..." / "ANUPAMA FASHION in Kudasan..."

- RANDOMIZE YOUR OPENING ANGLE:
  * Option A: Start by complimenting the fitting or fabric quality.
  * Option B: Start by describing how an outfit looked at an event.
  * Option C: Start by praising the boutique's unique collection variety.
  * Option D: Start by recommending the store to anyone in Kudasan or Gandhinagar.
  * Option E: Start with a personal shopping experience compliment.

OUTPUT FORMAT:
- Output ONLY the plain text review draft.
- DO NOT include quotation marks, titles, headers, bullet points, hashtags, emojis, or explanations.

${attempts > 1 ? `IMPORTANT: Previous attempt ${attempts - 1} was too similar to database records. Make this draft 100% distinct in opening, sentence structure, and vocabulary.` : ""}
`;

      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim().replace(/^["']|["']$/g, "");

        const similarityCheck = isReviewSimilar(responseText, historicalReviews);

        if (!similarityCheck.isDuplicateOrSimilar) {
          acceptedDraft = responseText;
          break;
        }
      } catch (genError: any) {
        console.error(`Gemini API Error on attempt ${attempts}:`, genError);
        lastGeminiError = genError.message || JSON.stringify(genError);
        try {
          const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          const result = await fallbackModel.generateContent(prompt);
          const responseText = result.response.text().trim().replace(/^["']|["']$/g, "");
          const similarityCheck = isReviewSimilar(responseText, historicalReviews);
          if (!similarityCheck.isDuplicateOrSimilar) {
            acceptedDraft = responseText;
            break;
          }
        } catch (fallbackError: any) {
          console.error(`Fallback Gemini Model Error:`, fallbackError);
          lastGeminiError = fallbackError.message || JSON.stringify(fallbackError);
          break;
        }
      }
    }

    if (!acceptedDraft) {
      return NextResponse.json(
        {
          success: false,
          error: `Gemini API Call Failed: ${lastGeminiError || "Unable to generate unique review through Gemini API"}`,
        },
        { status: 500 }
      );
    }

    // 2. Insert accepted review row into Supabase public.reviews
    const saveResult = await saveAcceptedReview(acceptedDraft, dbLanguage);

    if (!saveResult.success) {
      console.error("[API ROUTE SUPABASE INSERT FAILED]:", saveResult.error);
      return NextResponse.json(
        {
          success: false,
          error: typeof saveResult.error === "string" ? saveResult.error : JSON.stringify(saveResult.error),
          reviewText: acceptedDraft,
          language: dbLanguage,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        reviewText: acceptedDraft,
        language: dbLanguage,
        insertedRow: saveResult.data,
        attemptsUsed: attempts,
        modelUsed: modelName,
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
