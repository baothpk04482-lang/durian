const http = require("http");
const WebSocket = require("ws");

function cdpSend(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 100000);
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === id) resolve(msg);
    };
    ws.on("message", handler);
    setTimeout(() => {
      ws.removeListener("message", handler);
      resolve(null);
    }, 15000);
  });
}

(async () => {
  const tabs = await new Promise((resolve) =>
    http.get("http://localhost:9222/json", (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve(JSON.parse(d)));
    })
  );
  const wsUrl = tabs[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.on("open", resolve));
  console.log("CDP connected");

  const logs = [];
  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.method === "Runtime.consoleAPICalled") {
        const args = msg.params.args
          .map((a) => a.value || a.description || JSON.stringify(a))
          .join(" ");
        logs.push(args);
      }
      if (msg.method === "Runtime.exceptionThrown") {
        logs.push("EXCEPTION: " + msg.params.exceptionDetails.text);
      }
    } catch (e) {}
  });

  await cdpSend(ws, "Console.enable");
  await cdpSend(ws, "Runtime.enable");

  // Login
  const token = await new Promise((resolve) => {
    const data = JSON.stringify({
      email: "audit@test.com",
      password: "audit123",
    });
    const req = http.request(
      {
        hostname: "localhost",
        port: 8000,
        path: "/api/v1/auth/login",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve(JSON.parse(d).data.access_token));
      }
    );
    req.write(data);
    req.end();
  });

  // Set localStorage
  await cdpSend(ws, "Runtime.evaluate", {
    expression: 'localStorage.setItem("access_token","' + token + '")',
  });
  await cdpSend(ws, "Runtime.evaluate", {
    expression: 'localStorage.setItem("refresh_token","' + token + '")',
  });

  // Navigate to dashboard
  await cdpSend(ws, "Page.enable");
  await cdpSend(ws, "Page.navigate", { url: "http://localhost:5173/dashboard" });

  console.log("Waiting for dashboard to load...");
  await new Promise((r) => setTimeout(r, 25000));

  // Filter relevant logs
  const relevant = logs.filter(
    (l) =>
      l.includes("kpiHealthyCount") ||
      l.includes("HEALTHY") ||
      l.includes("healthy =") ||
      l.includes("AFTER PROMISE") ||
      l.includes("RETURN HEALTHY") ||
      l.includes("Received") ||
      l.includes("PAGE ERROR") ||
      l.includes("fetchAllTreePages") ||
      l.includes("fetching page") ||
      l.includes("Fetching page") ||
      l.includes("restPages") ||
      l.includes("Healthy %") ||
      l.includes("DashboardData") ||
      l.includes("FINAL HEALTHY")
  );

  console.log("\n=== CAPTURED CONSOLE (" + logs.length + " total) ===\n");
  if (relevant.length > 0) {
    relevant.forEach((l) => console.log(l));
  } else {
    console.log("--- No relevant logs found, dumping all ---");
    logs.forEach((l) => console.log(l));
  }
  console.log("\n=== END ===");

  ws.close();
  process.exit(0);
})();
