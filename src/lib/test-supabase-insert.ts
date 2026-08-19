import { supabase } from "./supabase";

async function testRealSupabaseInsert() {
  console.log("==================================================");
  console.log("TESTING REAL SUPABASE INSERT on public.reviews");
  console.log("Target Project URL: https://oxoruqfjcqhxnxsgwcar.supabase.co");
  console.log("==================================================");

  const testReviewText = "Test automated review insertion to verify Supabase public.reviews connection.";
  
  try {
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        review_text: testReviewText,
        language: "english",
      })
      .select()
      .single();

    if (error) {
      console.error("[SUPABASE REAL TEST RESULT: FAILED]");
      console.error("Error Message:", error.message);
      console.error("Error Details:", error.details);
      console.error("Error Hint:", error.hint);
      console.error("Error Code:", error.code);
    } else {
      console.log("[SUPABASE REAL TEST RESULT: SUCCESS]");
      console.log("Inserted Row:", data);

      // Clean up test row after verification
      if (data && data.id) {
        await supabase.from("reviews").delete().eq("id", data.id);
        console.log("Cleaned up test row after verification.");
      }
    }
  } catch (err: any) {
    console.error("[SUPABASE EXCEPTION]:", err);
  }

  console.log("==================================================");
}

testRealSupabaseInsert();
