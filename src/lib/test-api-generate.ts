async function testApiGenerateGujarati() {
  console.log("Testing Gujarati POST /api/generate-review on http://localhost:3000...");
  try {
    const res = await fetch("http://localhost:3000/api/generate-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: "Gujarati" }),
    });

    const data = await res.json();
    console.log("Gujarati API Response Status:", res.status);
    console.log("Gujarati API Response Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Gujarati API Test Error:", err);
  }
}

testApiGenerateGujarati();
