import { isReviewSimilar } from "./similarity";
import { saveAcceptedReview, getAllHistoricalReviews } from "./supabase";

async function runLiveVerification() {
  console.log("==================================================");
  console.log("LIVE SUPABASE & DUPLICATE CHECK VERIFICATION TEST");
  console.log("==================================================");

  // 1. Fetch all historical reviews from public.reviews
  const historical = await getAllHistoricalReviews();
  console.log(`[Supabase Read] Total historical reviews fetched from DB: ${historical.length}`);

  // 2. Generate sample English review candidate
  const sampleEnglish = "Was looking for something nice for an upcoming occasion and found quite a few good options here. The collection has a nice mix of modern designs, and I liked the variety available. The overall shopping experience at ANUPAMA FASHION in Kudasan was comfortable and pleasant.";
  
  // Verify similarity against DB
  const checkEng = isReviewSimilar(sampleEnglish, historical);
  console.log("[Duplicate Check English]:", checkEng);

  // Save accepted English review to Supabase public.reviews with language = 'english'
  const savedEng = await saveAcceptedReview(sampleEnglish, "english");
  console.log(`[Supabase Insert English]: Saved = ${savedEng}`);

  // 3. Generate sample Gujarati Roman review candidate
  const sampleGujarati = "Shopping mate aavi hati ane ahiya collection ni variety mane ghani game. One-piece ane two-piece ma pan sara options jova malya. Designs modern hata ane overall shopping experience comfortable rahyo. Kudasan ma women's clothing mate aa place par visit karvano experience saro lagyo.";
  
  // Verify similarity against DB
  const checkGuj = isReviewSimilar(sampleGujarati, historical);
  console.log("[Duplicate Check Gujarati]:", checkGuj);

  // Save accepted Gujarati review to Supabase public.reviews with language = 'gujarati'
  const savedGuj = await saveAcceptedReview(sampleGujarati, "gujarati");
  console.log(`[Supabase Insert Gujarati]: Saved = ${savedGuj}`);

  // 4. Test Duplicate Rejection Logic
  const duplicateAttempt = sampleEnglish;
  const checkDuplicate = isReviewSimilar(duplicateAttempt, [...historical, sampleEnglish]);
  console.log("[Duplicate Rejection Test]:", checkDuplicate.isDuplicateOrSimilar ? "PASS (Successfully Rejected Duplicate)" : "FAIL", checkDuplicate);

  console.log("==================================================");
}

runLiveVerification();
