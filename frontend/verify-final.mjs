import { chromium } from "playwright";

const BASE = "http://localhost:5173";

function mockItems(count) {
  return Array.from({ length: count }, (_, i) => ({
    _id: `x${i + 1}`,
    tree_code: `TR-${10000 + i}`,
    status: i < 18 ? "Healthy" : i < 22 ? "Warning" : "Disease",
    tree_age: (i % 6) + 1,
    area_hectare: 5 + (i % 3) * 2,
    branch: i % 2 === 0 ? "Main" : null,
    inspection_date: "2025-01-01",
    inspector_name: "John Wang",
    disease_name: i % 5 === 0 ? "Leaf Blight" : i % 5 === 1 ? "Anthracnose" : "Healthy",
    confidence: 75 + (i % 20),
    priority: i % 4 === 0 ? "high" : i % 4 === 1 ? "medium" : i % 4 === 2 ? "low" : undefined,
    title: `Zone ${String.fromCharCode(65 + (i % 5))} Risk Alert`,
    content: `High humidity detected in Zone ${String.fromCharCode(65 + (i % 5))}`,
    created_at: "2025-06-30T08:00:00Z",
    farm_id: `farm_${i % 4}`,
    tree_id: `tree_${i}`,
    inspection_id: `insp_${i}`,
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
await page.screenshot({ path: "screenshots/dashboard-final.png", fullPage: false });

const bodyText = await page.locator("body").innerText().catch(() => "");
const lines = bodyText.split("\n").filter(Boolean);

console.log("=== ALL VISIBLE TEXT LINES ===");
lines.forEach((l, i) => console.log(`${i}: ${l.trim()}`));
console.log("=== END ===\n");

const sections = [
  ["Title", "Dashboard"],
  ["Subtitle", "Durian Guardian AI"],
  ["KPI: TOTAL TREES", "TOTAL TREES"],
  ["KPI: FARM AREA", "FARM AREA"],
  ["KPI: SYSTEM HEALTH", "SYSTEM HEALTH"],
  ["KPI: CRITICAL ALERT", "CRITICAL ALERT"],
  ["KPI: YIELD FORECAST", "YIELD FORECAST"],
  ["Section: Weather & Disease Forecast", "Weather & Disease Forecast"],
  ["Section: Disease Risk Heatmap", "Disease Risk Heatmap"],
  ["Section: AI Agronomist", "AI Agronomist"],
  ["Section: Tree Distribution", "Tree Distribution by Age"],
  ["Section: Realtime Inspection", "Realtime Inspection Activity"],
  ["Heatmap Legend: Healthy", "Healthy"],
  ["Heatmap Legend: Warning", "Warning"],
  ["Heatmap Legend: High Risk", "High Risk"],
  ["Heatmap Legend: Critical", "Critical"],
  ["Agronomist: Priority Trees", "Priority Trees"],
  ["Agronomist: Strategic Recommendation", "Strategic Recommendation"],
  ["Agronomist: Chat input", "Ask AI Agronomist"],
  ["Inspection Columns: Time", "Time"],
  ["Inspection Columns: Tree ID", "Tree ID"],
  ["Inspection Columns: Farm", "Farm"],
  ["Inspection Columns: Inspector", "Inspector"],
  ["Inspection Columns: AI Model", "AI Model"],
  ["Inspection Columns: Disease", "Disease"],
  ["Inspection Columns: Risk Score", "Risk Score"],
  ["Inspection Columns: Status", "Status"],
  ["Inspection Columns: Action", "Action"],
  ["Heatmap zones visible", "Zone"],
  ["Date picker: Last 30 Days", "Last 30 Days"],
];

console.log("=== VERIFICATION ===\n");
let passCount = 0;
let failCount = 0;
for (const [name, text] of sections) {
  const found = bodyText.includes(text);
  if (found) passCount++; else failCount++;
  console.log(`  ${found ? "✓" : "✗"} ${name}`);
}
console.log(`\n${passCount}/${passCount + failCount} passed, ${failCount} failed`);

await browser.close();
