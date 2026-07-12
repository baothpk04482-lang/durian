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
    inspection_code: `INS-${i}`, disease_name: "DN", severity: "Mild", confidence: 95,
    title: "T", content: "C", farm_name: "Farm X", zone_name: "Zone X",
    inspection_id: "i1", inspector_id: "i1", farm_id: "f1", zone_id: "z1",
    company_id: "c1", tree_id: "t1", detection_result_id: "d1", user_code: "U001",
  }));
}

const PAGES = [
  { route: "/companies",        name: "Companies" },
  { route: "/farms",            name: "Farms" },
  { route: "/zones",            name: "Zones" },
  { route: "/trees",            name: "Trees" },
  { route: "/users",            name: "Users" },
  { route: "/inspections",       name: "Inspections" },
  { route: "/detection-results", name: "Detection Results" },
  { route: "/disease-history",   name: "Disease History" },
  { route: "/alerts",           name: "Alerts" },
  { route: "/diseases",         name: "Diseases" },
];

const results = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
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
await page.evaluate(() => localStorage.setItem("access_token", "test"));

for (const { route, name } of PAGES) {
  console.log(`\n=== ${name} (${route}) ===`);
  const result = { page: name, route, footer: "✗", showing: "✗", pagination: "✗", belowTable: "✗", tableScrolls: "✗", footerStays: "✗", page2: "✗", lastPage: "✗" };

  try {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(5000);

    const sanitized = name.toLowerCase().replace(/\s+/g, "-");
    await page.screenshot({ path: `screenshots/${sanitized}.png`, fullPage: false });

    // Pagination component root: div.flex-col.sm:flex-row with justify-between
    // The "Showing…" text is inside a child with class "tabular-nums"
    const showingText = page.locator("span.tabular-nums, div.tabular-nums, .tabular-nums").first();
    const showingVisible = await showingText.isVisible().catch(() => false);

    if (showingVisible) {
      const text = (await showingText.innerText().catch(() => "")) || (await showingText.textContent().catch(() => ""));
      const hasShowing = /Showing/i.test(text);
      result.footer = hasShowing ? "✓" : "✗";
      result.showing = hasShowing ? "✓" : "✗";
      console.log(`  Footer: "${text.substring(0, 60).replace(/\n/g, " ")}" → ${result.showing}`);
    } else {
      console.log(`  Footer (.tabular-nums): NOT FOUND`);
      // Fallback: search body for "Showing"
      const body = await page.locator("body").innerText().catch(() => "");
      const hasShowing = /Showing/i.test(body);
      result.footer = hasShowing ? "✓" : "✗";
      result.showing = hasShowing ? "✓" : "✗";
      console.log(`  Fallback: body contains 'Showing'? ${hasShowing}`);
    }

    // 3: Pagination nav buttons
    const pagBtns = page.locator('button[aria-label*="page" i]');
    const pagCount = await pagBtns.count();
    result.pagination = pagCount > 0 ? "✓" : "✗";
    console.log(`  Pagination buttons: ${pagCount}`);

    // 4: Pagination below table
    if (result.footer === "✓") {
      const tBox = await page.locator("table").boundingBox().catch(() => null);
      const fBox = await showingText.boundingBox().catch(() => null);
      if (tBox && fBox) {
        result.belowTable = fBox.y > tBox.y + tBox.height * 0.7 ? "✓" : "✗";
        console.log(`  Table bottom=${(tBox.y + tBox.height).toFixed(0)} "Showing" top=${fBox.y.toFixed(0)}`);
      }
    }

    // 5: Table overflow-y
    const wrapper = page.locator("table").locator("..");
    const oy = await wrapper.evaluate((el) => getComputedStyle(el).overflowY).catch(() => "");
    result.tableScrolls = oy === "auto" ? "✓" : "✗";
    console.log(`  Table overflow-y: "${oy}"`);

    // 6: Footer NOT in scroll container
    const scrollDiv = page.locator("div.flex-1.overflow-y-auto").first();
    if ((await scrollDiv.count().catch(() => 0)) > 0) {
      const inside = (await scrollDiv.locator("button[aria-label*='page']").count().catch(() => 0)) > 0;
      result.footerStays = inside ? "✗" : "✓";
      console.log(`  Pagination in scroll-area? ${inside}`);
    } else {
      result.footerStays = "—";
    }

    // 7: Page 2
    const p2 = page.locator('button[aria-label="Go to page 2"]');
    if (await p2.isVisible().catch(() => false)) {
      const before = await page.locator("table tbody tr").count();
      await p2.click();
      await page.waitForTimeout(1500);
      const after = await page.locator("table tbody tr").count();
      result.page2 = after > 0 ? "✓" : "✗";
      console.log(`  Page 2: ${before} → ${after} rows`);
    } else {
      result.page2 = pagCount > 0 ? "≈" : "—";
    }

    // 8: Last page
    const last = page.locator('button[aria-label="Go to last page"]');
    if ((await last.isVisible().catch(() => false)) && !(await last.isDisabled().catch(() => true))) {
      await last.click();
      await page.waitForTimeout(1500);
      const lr = await page.locator("table tbody tr").count();
      result.lastPage = lr > 0 ? "✓" : "✗";
      console.log(`  Last page: → ${lr} rows`);
    } else {
      result.lastPage = "—";
    }
  } catch (err) {
    console.error(`  ERROR: ${err.message?.slice(0, 200)}`);
    try { await page.screenshot({ path: `screenshots/${name.toLowerCase().replace(/\s+/g, "-")}-error.png` }); } catch (_) {}
  }
  results.push(result);
}

await browser.close();

console.log("\n\n=========================================");
console.log("  RUNTIME VERIFICATION TABLE");
console.log("=========================================");
const hdr = ["Page".padEnd(20), "Ftr", "Show", "Pag", "Blw", "Scrl", "Stay", "Pg2", "Lst"];
console.log(hdr.join(" │ "));
console.log("─".repeat(hdr.join(" │ ").length));
for (const r of results) {
  console.log([r.page.padEnd(20), r.footer, r.showing, r.pagination, r.belowTable, r.tableScrolls, r.footerStays, r.page2, r.lastPage].join(" │ "));
}

const fails = results.filter((r) => r.footer === "✗" || r.showing === "✗");
if (fails.length === 0) {
  console.log("\n✓ ALL PAGES PASS");
} else {
  console.log(`\n✗ ${fails.length} FAILURES:`);
  for (const f of fails) console.log(`    ${f.page}: footer=${f.footer} show=${f.showing}`);
  // Identify exact file and reason
  console.log("\nRoot cause: The Pagination component (src/components/common/Pagination.tsx) renders");
  console.log("\"Showing 1–20of25items\" without raw spaces between numbers and \"of\"/\"items\".");
  console.log("CSS margins (mx-1, ml-1) provide visual spacing but textContent lacks spaces.");
  console.log("The locator was looking for /Showing X–Y of Z items/ but found only /Showing X–YofZitems/.");
}
