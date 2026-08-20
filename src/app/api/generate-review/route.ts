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
        { success: false, error: "GEMINI_API_KEY is not configured in Vercel environment" },
        { status: 500 }
      );
    }

    // 1. Fetch ALL previous reviews from public.reviews
    const { reviews: historicalReviews } = await getAllHistoricalReviews();

    // Take recent reviews to pass to Gemini as negative examples (DO NOT REPEAT)
    const recentSample = historicalReviews.slice(-15);
    const doNotRepeatSnippet =
      recentSample.length > 0
        ? `PREVIOUS REVIEWS ALREADY WRITTEN (DO NOT COPY, REPEAT, OR IMITATE ANY OF THESE):\n${recentSample
            .map((r, i) => `${i + 1}. "${r}"`)
            .join("\n")}`
        : "";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

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
    const maxAttempts = 10;
    let lastGeminiError = "";

    const openingAngles = [
      "Focus on the luxurious fabric quality and comfortable fitting of a two-piece co-ord set.",
      "Focus on how an outfit from this store received compliments at a recent party or family event.",
      "Focus on praising the store's unique range of one-piece dresses and western wear in Kudasan.",
      "Focus on recommending this boutique to anyone visiting Gandhinagar for trendy women's wear.",
      "Focus on the friendly staff assistance and pleasant overall shopping ambiance.",
    ];

    while (attempts < maxAttempts) {
      attempts++;
      const currentAngle = openingAngles[(attempts - 1) % openingAngles.length];

      const prompt = `You are a real customer writing ONE unique Google review for ANUPAMA FASHION.

STORE DETAILS:
- Name: ANUPAMA FASHION
- Category: Women's Clothing & Boutique
- Location: Kudasan, Gandhinagar, Gujarat.
- Offerings: One-Piece dresses, Two-Piece co-ords, Western wear, Ethnic wear, Fashion collections.

${languageInstruction}

REVIEW LENGTH:
- Must be between 45 and 70 words.

OPENING ANGLE FOR THIS DRAFT:
- ${currentAngle}

STRICT OPENING & DIVERSITY RULES (CRITICAL):
- ABSOLUTELY FORBIDDEN OPENING PHRASES (DO NOT START WITH ANY OF THESE):
  * "Finding..." / "Finding a..." / "Finding the..."
  * "Stumbled upon..." / "I stumbled upon..."
  * "Finally found..." / "Finally managed..."
  * "Was looking for..." / "I was looking..."
  * "Visited ANUPAMA FASHION..." / "I visited..."
  * "ANUPAMA FASHION is..." / "ANUPAMA FASHION in Kudasan..."

${doNotRepeatSnippet}

OUTPUT FORMAT:
- Output ONLY the plain text review draft.
- DO NOT include quotation marks, titles, headers, bullet points, hashtags, emojis, or explanations.

${attempts > 1 ? `IMPORTANT: Previous attempt ${attempts - 1} was rejected for similarity to database records. Make this draft 100% distinct in opening, sentence structure, and vocabulary.` : ""}
`;

      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim().replace(/^["']|["']$/g, "");

        const similarityCheck = isReviewSimilar(responseText, historicalReviews);

        if (!similarityCheck.isDuplicateOrSimilar) {
          acceptedDraft = responseText;
          break;
        } else {
          console.log(`[Attempt ${attempts}] Similarity Rejected: ${similarityCheck.reason}`);
        }
      } catch (genError: any) {
        console.error(`Gemini API Error on attempt ${attempts}:`, genError);
        lastGeminiError = genError.message || JSON.stringify(genError);
        // If it's a real API key error or network failure, do not hide it
        break;
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
