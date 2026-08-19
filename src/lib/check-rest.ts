import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const parts = trimmed.split("=");
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      process.env[key] = val;
    }
  }
}

async function testRestEndpoint() {
  const url = "https://oxoruqfjcqhxnxsgwcar.supabase.co/rest/v1/reviews";
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

  console.log("==================================================");
  console.log("Testing REST Endpoint:", url);
  console.log("Using API Key:", apiKey);
  console.log("==================================================");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "apikey": apiKey,
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    const text = await response.text();
    console.log("HTTP Status:", response.status, response.statusText);
    console.log("Response Body:", text);
  } catch (err) {
    console.error("Fetch Exception:", err);
  }
}

testRestEndpoint();
