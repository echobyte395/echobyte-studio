const express = require("express");
const fs = require("fs");
const axios = require("axios");
const useragent = require("useragent");
const path = require("path");

const app = express();

app.use(express.static("public"));

/* ---------------- CONFIG ---------------- */

const PORT = process.env.PORT || 3000;

const PASSWORD = "Riri2002213";

const REDIRECT_URL = "https://echobytestudio.pages.dev";

const DB_FILE = "data.json";

/* ---------------- DATA ---------------- */

function loadData() {
  if (!fs.existsSync(DB_FILE)) return [];

  try {
    return JSON.parse(fs.readFileSync(DB_FILE));
  } catch {
    return [];
  }
}

function saveData(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

/* ---------------- AUTH ---------------- */

function protect(req, res, next) {
  const pass = req.query.password;

  if (pass !== PASSWORD) {
    return res.redirect("/login.html");
  }

  next();
}

/* ---------------- IP ---------------- */

function getIP(req) {
  let ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "";

  if (ip.includes(",")) {
    ip = ip.split(",")[0];
  }

  if (ip === "::1") {
    ip = "127.0.0.1";
  }

  return ip;
}

/* ---------------- TRACKING ---------------- */

app.get("/r/:code", async (req, res) => {
  const code = req.params.code;

  const ip = getIP(req);

  const ua = useragent.parse(req.headers["user-agent"]);

  let geo = {
    country: "unknown",
    city: "unknown",
    region: "unknown",
    latitude: 0,
    longitude: 0
  };

  try {
    const queryIP =
      ip === "127.0.0.1"
        ? "8.8.8.8"
        : ip;

    const r = await axios.get(
      `https://ipapi.co/${queryIP}/json/`
    );

    geo = {
      country: r.data.country_name || "unknown",
      city: r.data.city || "unknown",
      region: r.data.region || "unknown",
      latitude: r.data.latitude || 0,
      longitude: r.data.longitude || 0
    };
  } catch {}

  const entry = {
    code,
    ip,
    country: geo.country,
    city: geo.city,
    region: geo.region,
    latitude: geo.latitude,
    longitude: geo.longitude,
    os: ua.os.toString(),
    browser: ua.family,
    time: new Date().toISOString()
  };

  const data = loadData();

  data.push(entry);

  saveData(data);

  res.redirect(REDIRECT_URL);
});

/* ---------------- STATS API ---------------- */

app.get("/stats/:code", protect, (req, res) => {
  const data = loadData();

  const filtered = data.filter(
    x => x.code === req.params.code
  );

  res.json(filtered);
});

/* ---------------- DASHBOARD ---------------- */

app.get("/dashboard", protect, (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "dashboard.html")
  );
});

/* ---------------- ROOT ---------------- */

app.get("/", (req, res) => {
  res.send("🚀 QR Tracker PRO MAX");
});

/* ---------------- SERVER ---------------- */

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});