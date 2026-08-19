async function checkRootRest() {
  const url = "https://oxoruqfjcqhxnxsgwcar.supabase.co/rest/v1/";
  console.log("Checking root REST endpoint:", url);

  try {
    const response = await fetch(url);
    console.log("Status:", response.status, response.statusText);
    const text = await response.text();
    console.log("Response (first 300 chars):", text.slice(0, 300));
  } catch (err) {
    console.error("Error:", err);
  }
}

checkRootRest();
