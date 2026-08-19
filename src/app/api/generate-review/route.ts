import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAllHistoricalReviews, saveAcceptedReview } from "@/lib/supabase";
import { isReviewSimilar } from "@/lib/similarity";

// Fallback reviews (45–70 words each, featuring natural local references and opening variation)
const FALLBACK_ENGLISH = [
  "Was looking for something nice for an upcoming occasion and found quite a few good options here. The collection has a nice mix of modern designs, and I liked the variety available. The overall shopping experience at ANUPAMA FASHION in Kudasan was comfortable and pleasant.",
  "Found a broad selection of women's wear while browsing around Gandhinagar. The fitting and fabric quality felt great, especially among their two-piece and one-piece outfits. Neat store presentation and helpful assistance while choosing sizes made it a great visit.",
  "Exploring ladies fashion in Kudasan led me to ANUPAMA FASHION. They have a good variety of clothing collections ranging from daily wear to stylish designer pieces. Enjoyed looking through their latest patterns and found the outfit quality very reliable.",
  "Shopping for women's clothing here was very convenient. The collection features clean stitching, good fabric choices, and reasonable variety for different preferences. Very satisfied with the overall experience during my visit to their Gandhinagar store.",
  "A pleasant surprise while shopping in Kudasan. ANUPAMA FASHION has an impressive range of women's wear, from elegant one-piece outfits to casual attire. The store atmosphere is welcoming and browsing through their collection was smooth."
];

const FALLBACK_GUJARATI = [
  "Shopping mate aavi hati ane ahiya collection ni variety mane ghani game. One-piece ane two-piece ma pan sara options jova malya. Designs modern hata ane overall shopping experience comfortable rahyo. Kudasan ma women's clothing mate aa place par visit karvano experience saro lagyo.",
  "Gandhinagar ma kapda ni sari variety sodhta sodhta ahiya aavya. ANUPAMA FASHION ma women's wear nu collection ghanu saras chhe. Outfits ni fitting ane fabric quality sari lagi. Outfits jovama ghanu easy rahyo ane shopping experience smooth rahyo.",
  "Ahiya aavine dresses ane clothing range jovani maja aavi. Kapda ni quality sari chhe ane designs ma saras variation mali gayu. Kudasan ma aavel aa boutique ma ladies fashion mate sara choices available chhe.",
  "Women's clothing mate ahiya visit kari tyare ghana interesting options jova malya. One-piece outfits ane casual wear nu fitting ghanu saro chhe. Store nu ambience ane service pan sari lagi, ahiya shopping karvano anubhav ghanu saro rahyo.",
  "Kapda ni quality ane stitching neat lagi. ANUPAMA FASHION ma alag alag designs ane patterns jova malya. Gandhinagar ma aavya hoy tyare ladies fashion collection mate ahiya visit karvu ek saro option chhe."
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { language = "English" } = body;
    const dbLanguage: "english" | "gujarati" = language.toLowerCase() === "gujarati" ? "gujarati" : "english";

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

    // 1. Fetch ALL previous reviews from public.reviews
    const { reviews: historicalReviews } = await getAllHistoricalReviews();

    let acceptedDraft = "";
    let attempts = 0;
    const maxAttempts = 5;

    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      let model;
      try {
        model = genAI.getGenerativeModel({ model: modelName });
      } catch {
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      }

      const isGujarati = dbLanguage === "gujarati";

      const languageInstruction = isGujarati
        ? `STRICT REQUIREMENT: Write in GUJARATI language using ONLY ENGLISH / ROMAN ALPHABET LETTERS.
DO NOT use Gujarati script or Unicode characters (STRICTLY NO કેમ છો).
Write naturally like how a Gujarati customer types Gujarati on WhatsApp with English letters.
Example style ONLY: "Shopping mate aavi hati ane ahiya collection ni variety mane ghani game. One-piece ane two-piece ma pan sara options jova malya. Designs modern hata ane overall shopping experience comfortable rahyo. Kudasan ma women's clothing mate aa place par visit karvano experience saro lagyo."
DO NOT force "Kem cho" at the beginning of every review.`
        : `Write natural Indian English. Keep it realistic, descriptive, and comfortable.
Example style ONLY: "Was looking for something nice for an upcoming occasion and found quite a few good options here. The collection has a nice mix of modern designs, and I liked the variety available. The overall shopping experience at ANUPAMA FASHION in Kudasan was comfortable and pleasant."`;

      while (attempts < maxAttempts) {
        attempts++;

        const prompt = `You are an AI assistant generating ONE natural, original Google review DRAFT for a real customer of ANUPAMA FASHION.

BUSINESS DETAILS:
Name: ANUPAMA FASHION
Category: Women's Clothing & Boutique
Location: 1st Floor, Siddhraj Z Square, E-104, Opposite The Landmark, Kudasan, Gandhinagar, Gujarat 382419.
Products: One-Piece, Two-Piece, Women's Wear, Fashion Collections, Western & Ethnic Wear.

LANGUAGE RULE:
${languageInstruction}

REVIEW LENGTH RULE (CRITICAL):
- Target length: APPROXIMATELY 45 TO 70 WORDS.
- Must feel like a detailed, genuine customer-written Google review (NOT an advertisement or SEO article).

LOCAL & NATURAL SEO:
- Naturally incorporate relevant terms when appropriate (e.g. "ANUPAMA FASHION", "Kudasan", "Gandhinagar", "women's clothing", "one-piece", "two-piece", "quality", "variety").
- DO NOT force all keywords into every review. DO NOT keyword-stuff.
- DO NOT repeat the full street address in every review. Naturally mention "Kudasan" or "Gandhinagar" when appropriate.

FIRST LINE & STRUCTURE VARIATION (CRITICAL):
- Create a brand-new, unique opening sentence every single time.
- NEVER start repeatedly with "Visited ANUPAMA FASHION...", "I visited...", "The collection...", "Kudasan...", "Kem cho...", or "ANUPAMA FASHION...".
- Vary the focus: some reviews focus on finding an outfit for an occasion, some on fabric quality & fitting, some on collection variety, some on store atmosphere.

SAFETY & REALISM:
- Do NOT fabricate specific purchases, staff names, fake prices, discounts, or offers.
- Output ONLY the plain text review draft. Do NOT include quotation marks, titles, bullet points, hashtags, emojis, or explanations.

${attempts > 1 ? `NOTE: Previous attempt was too similar to historical database reviews. Generate a completely different opening and sentence structure this time (attempt ${attempts}).` : ""}
`;

        try {
          const result = await model.generateContent(prompt);
          const responseText = result.response.text().trim().replace(/^["']|["']$/g, "");

          const similarityCheck = isReviewSimilar(responseText, historicalReviews);

          if (!similarityCheck.isDuplicateOrSimilar) {
            acceptedDraft = responseText;
            break;
          }
        } catch (genError) {
          console.error("Gemini API call error on attempt", attempts, genError);
          try {
            const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await fallbackModel.generateContent(prompt);
            const responseText = result.response.text().trim().replace(/^["']|["']$/g, "");
            const similarityCheck = isReviewSimilar(responseText, historicalReviews);
            if (!similarityCheck.isDuplicateOrSimilar) {
              acceptedDraft = responseText;
              break;
            }
          } catch {
            break;
          }
        }
      }
    }

    // Fallback if Gemini key is missing or attempts failed uniqueness threshold
    if (!acceptedDraft) {
      const fallbackList = dbLanguage === "gujarati" ? FALLBACK_GUJARATI : FALLBACK_ENGLISH;
      
      for (const candidate of fallbackList) {
        const check = isReviewSimilar(candidate, historicalReviews);
        if (!check.isDuplicateOrSimilar) {
          acceptedDraft = candidate;
          break;
        }
      }

      if (!acceptedDraft) {
        acceptedDraft = fallbackList[Math.floor(Math.random() * fallbackList.length)];
      }
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

    return NextResponse.json({
      success: true,
      reviewText: acceptedDraft,
      language: dbLanguage,
      insertedRow: saveResult.data,
      attemptsUsed: attempts,
      modelUsed: modelName,
    });
  } catch (error: any) {
    console.error("Error in generate-review API route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate review" },
      { status: 500 }
    );
  }
}
