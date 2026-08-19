import { isReviewSimilar } from "./similarity";

const sampleHistoricalReviews = [
  "Visited ANUPAMA FASHION recently and found nice options in women's wear. The fabric quality feels quite comfortable and the store layout is easy to browse.",
  "Found a broad selection of clothing items here. The designs offer good variety and the overall shopping atmosphere was pleasant.",
  "Kapda ni quality sari lagi ane overall experience pan saro rahyo. Variety ghani sari chhe."
];

console.log("=== SIMILARITY DETECTION TEST ===");

// Test 1: Exact duplicate
const res1 = isReviewSimilar(sampleHistoricalReviews[0], sampleHistoricalReviews);
console.log("Test 1 (Exact duplicate):", res1.isDuplicateOrSimilar === true ? "PASS" : "FAIL", res1);

// Test 2: Opening phrase match
const res2 = isReviewSimilar("Visited ANUPAMA FASHION recently and bought some lovely dresses.", sampleHistoricalReviews);
console.log("Test 2 (Opening match):", res2.isDuplicateOrSimilar === true ? "PASS" : "FAIL", res2);

// Test 3: Completely unique review
const res3 = isReviewSimilar("The two-piece ethnic outfit I picked was perfectly fitted. Staff was helpful with trial sizing.", sampleHistoricalReviews);
console.log("Test 3 (Unique review):", res3.isDuplicateOrSimilar === false ? "PASS" : "FAIL", res3);

// Test 4: Gujarati duplicate
const res4 = isReviewSimilar("Kapda ni quality sari lagi ane overall experience pan saro rahyo.", sampleHistoricalReviews);
console.log("Test 4 (Gujarati duplicate):", res4.isDuplicateOrSimilar === true ? "PASS" : "FAIL", res4);

// Test 5: Unique Gujarati review
const res5 = isReviewSimilar("Ahiya aavine dresses jovani ghani maja aavi. Patterns and stitching neat chhe.", sampleHistoricalReviews);
console.log("Test 5 (Unique Gujarati):", res5.isDuplicateOrSimilar === false ? "PASS" : "FAIL", res5);
