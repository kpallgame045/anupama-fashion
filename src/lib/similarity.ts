/**
 * Similarity and Duplicate Detection Engine for ANUPAMA FASHION Reviews.
 * Enforces historical uniqueness against all stored reviews in Supabase.
 */

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // remove punctuation
    .replace(/\s+/g, " ") // normalize whitespace
    .trim();
}

/**
 * Common generic customer review phrases to exclude from trigram phrase overlap detection
 * so genuine Gemini reviews are not penalized for using natural shopping terms.
 */
const GENERIC_COMMON_PHRASES = [
  "anupama fashion",
  "kudasan gandhinagar",
  "womens clothing",
  "fabric quality",
  "western and ethnic",
  "ethnic and western",
  "coord set",
  "one piece",
  "two piece",
  "highly recommend",
  "shopping experience",
  "collection is",
  "quality is",
  "fitting is",
];

/**
 * Tokenize text into n-grams (default 3-word grams for phrase matching).
 */
export function getNGrams(text: string, n: number = 3): Set<string> {
  const words = normalizeText(text).split(" ");
  const nGrams = new Set<string>();

  if (words.length < n) {
    nGrams.add(words.join(" "));
    return nGrams;
  }

  for (let i = 0; i <= words.length - n; i++) {
    const gram = words.slice(i, i + n).join(" ");
    let isGeneric = false;
    for (const common of GENERIC_COMMON_PHRASES) {
      if (gram.includes(common)) {
        isGeneric = true;
        break;
      }
    }
    if (!isGeneric) {
      nGrams.add(gram);
    }
  }

  return nGrams;
}

/**
 * Calculate Jaccard similarity between two sets of n-grams or words.
 */
export function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  setA.forEach((item) => {
    if (setB.has(item)) {
      intersection++;
    }
  });

  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

/**
 * Checks if the first 4-5 words (the opening hook) match any existing review.
 */
export function checkOpeningSimilarity(newText: string, existingText: string): boolean {
  const wordsNew = normalizeText(newText).split(" ").slice(0, 4).join(" ");
  const wordsExisting = normalizeText(existingText).split(" ").slice(0, 4).join(" ");

  return wordsNew.length > 5 && wordsNew === wordsExisting;
}

/**
 * Check sentence-level overlap (if any complete sentence is copied).
 */
export function checkSentenceOverlap(newText: string, existingText: string): boolean {
  const newSentences = newText
    .split(/[.!?]+/)
    .map((s) => normalizeText(s))
    .filter((s) => s.length > 15);

  const existingSentences = existingText
    .split(/[.!?]+/)
    .map((s) => normalizeText(s))
    .filter((s) => s.length > 15);

  for (const newSent of newSentences) {
    for (const exSent of existingSentences) {
      if (newSent === exSent) {
        return true;
      }
    }
  }

  return false;
}

export interface SimilarityResult {
  isDuplicateOrSimilar: boolean;
  reason?: string;
  maxSimilarityScore: number;
}

/**
 * Validates a newly generated review text against an array of historical review strings.
 */
export function isReviewSimilar(
  newReviewText: string,
  historicalReviews: string[]
): SimilarityResult {
  const normNew = normalizeText(newReviewText);

  if (!normNew) {
    return { isDuplicateOrSimilar: true, reason: "Empty review text", maxSimilarityScore: 1.0 };
  }

  const newTrigrams = getNGrams(newReviewText, 3);
  const newBigrams = getNGrams(newReviewText, 2);

  let maxScore = 0;

  for (const existingText of historicalReviews) {
    const normExisting = normalizeText(existingText);

    // 1. Exact or normalized duplicate check (Check against ALL historical reviews)
    if (normNew === normExisting) {
      return {
        isDuplicateOrSimilar: true,
        reason: "Exact duplicate of a previous review",
        maxSimilarityScore: 1.0,
      };
    }

    // 2. Check identical opening phrase (first 4 words) (Check against ALL historical reviews)
    if (checkOpeningSimilarity(newReviewText, existingText)) {
      return {
        isDuplicateOrSimilar: true,
        reason: "Repeated opening hook",
        maxSimilarityScore: 0.9,
      };
    }

    // 3. Complete sentence overlap check (Check against ALL historical reviews)
    if (checkSentenceOverlap(newReviewText, existingText)) {
      return {
        isDuplicateOrSimilar: true,
        reason: "Contains an identical full sentence",
        maxSimilarityScore: 0.85,
      };
    }

    // 4. Trigram Jaccard Similarity (Distinct phrase overlap)
    const existingTrigrams = getNGrams(existingText, 3);
    const triScore = jaccardSimilarity(newTrigrams, existingTrigrams);

    // 5. Bigram Jaccard Similarity
    const existingBigrams = getNGrams(existingText, 2);
    const biScore = jaccardSimilarity(newBigrams, existingBigrams);

    const overallScore = Math.max(triScore, biScore * 0.8);
    if (overallScore > maxScore) {
      maxScore = overallScore;
    }

    // Rejection threshold for unique phrase overlap
    if (triScore > 0.50) {
      return {
        isDuplicateOrSimilar: true,
        reason: `High phrase overlap score (${triScore.toFixed(2)})`,
        maxSimilarityScore: triScore,
      };
    }
  }

  return {
    isDuplicateOrSimilar: false,
    maxSimilarityScore: maxScore,
  };
}
