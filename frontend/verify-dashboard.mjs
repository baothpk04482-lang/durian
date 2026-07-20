import { chromium } from "playwright";

const BASE = "http://localhost:5173";

function mockItems(count) {
  return Array.from({ length: count }, (_, i) => ({
    _id: `x${i+1}`, id: `x${i+1}`, name: `Item ${i}`, status: "Active",
    created_at: "2025-01-01", tree_code: `TR-${i+1}`, variety: "Ri6", tree_age: 5, age: 5,
    full_name: "User", email: "a@b.com", role: "Inspector", company_name: "Co",
    farm_code: "FM-1", district: "D", province: "P", area_hectare: 10, tree_count: 100,
    zone_code: "ZN-1", description: "D", symptoms: "S", treatment: "T", prevention: "P",
    scientific_name: "SN", common_name: "CN", category: "Fungal",
    planting_date: "2025-01-01", planted_date: "2025-01-01",
    inspection_date: "2025-01-01", inspector_name: "IN", notes: "N",
    health_status: "Healthy", image_url: "",
    inspection_code: `INS-${i}`, disease_name: "Leaf Blight", severity: "Mild", confidence: 85 + Math.floor(Math.random()*15),
    title: `Alert ${i}`, content: `Zone ${String.fromCharCode(65+i)} high humidity`,
    priority: i % 3 === 0 ? "high" : i % 3 === 1 ? "medium" : "low",
    farm_id: "f1", tree_id: "t1", inspection_id: "i1", user_code: "U001",
    status: i === 0 ? "unread" : "read",
  }));
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();

await page.route("**/api/v1/**", (route) => {
  const url = route.request().url();
  const method = route.request().method();
  if (method === "GET" && url.includes("/auth/me")) {
    return route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ success: true, data: { id: "1", email: "test@test.com", role: "Admin" } }) });
  }
  if (method === "GET") {
    const items = mockItems(25);
    return route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ success: true, data: { items, total: 25, page: 1, per_page: 20, total_pages: 2 } }) });
  }
  route.continue();
});

await page.goto(BASE + "/login", { waitUntil: "domcontentloaded", timeout: 15000 });
await page.evaluate(() => {
  localStorage.setItem("access_token", "test");
  localStorage.setItem("user", JSON.stringify({ id: "1", email: "test@test.com", role: "Admin" }));
});

await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded", timeout: 20000 });
await page.waitForTimeout(5000);
await page.screenshot({ path: "screenshots/dashboard-enterprise.png", fullPage: false });

// Dump body text for debugging
const bodyText = await page.locator("body").innerText().catch(() => "");
console.log("=== BODY TEXT (first 3000 chars) ===");
console.log(bodyText.substring(0, 3000));
console.log("=== END ===");

// Check for "Risk Forecast" specifically
const hasRiskForecastText = bodyText.includes("Risk Forecast");
console.log(`\nBody contains "Risk Forecast": ${hasRiskForecastText}`);

// Check all section titles
const sections = [
  "Dashboard", "Farm Health", "Active Alerts", "Weather Risk", "Yield Prediction",
  "Disease Heatmap", "Latest Detection", "AI Agronomist",
  "Disease Trend", "Risk Forecast", "Disease Distribution", "Today's Alerts",
  "AI Preview", "AI Vision", "AI Forecast",
];

console.log("\n=== SECTION CHECK ===");
let passCount = 0;
let failCount = 0;
for (const s of sections) {
  const found = bodyText.includes(s);
  if (found) passCount++; else failCount++;
  console.log(`  ${found ? "✓" : "✗"} ${s}`);
}
console.log(`\n${passCount}/${sections.length} passed`);

await browser.close();
