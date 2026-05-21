const express = require("express");
const axios = require("axios");
const useragent = require("useragent");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(express.static("public"));

/* ---------------- CONFIG ---------------- */

const PORT = process.env.PORT || 3000;

const PASSWORD = "Riri2002213";

const REDIRECT_URL =
  "https://echobytestudio.pages.dev";

/* ---------------- SUPABASE ---------------- */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/* ---------------- IP ---------------- */

function getIP(req) {
  let ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "";

  if (ip.includes(",")) {
    ip = ip.split(",")[0];
  }

  if (ip === "::1") ip = "127.0.0.1";

  return ip;
}

/* ---------------- QR ROUTE ---------------- */

app.get("/r/:code", async (req, res) => {
  const code = req.params.code;
  const ip = getIP(req);
  const ua = useragent.parse(req.headers["user-agent"]);

  let geo = {
    country: "unknown",
    city: "unknown",
    region: "unknown",
    latitude: null,
    longitude: null
  };

  /* -------- GEO LOOKUP -------- */

  try {
    const r = await axios.get(
      `https://ipapi.co/${ip}/json/`
    );

    geo = {
      country: r.data.country_name,
      city: r.data.city,
      region: r.data.region,
      latitude: r.data.latitude,
      longitude: r.data.longitude
    };
  } catch (e) {
    console.log("Geo error:", e.message);
  }

  /* -------- SAVE SUPABASE -------- */

  try {
    await supabase.from("scans").insert([
      {
        code,
        ip,
        country: geo.country,
        city: geo.city,
        region: geo.region,
        os: ua.os.toString(),
        browser: ua.family,
        latitude: geo.latitude,
        longitude: geo.longitude,
        created_at: new Date().toISOString()
      }
    ]);
  } catch (e) {
    console.log("Supabase error:", e.message);
  }

  /* -------- REDIRECT -------- */

  res.redirect(REDIRECT_URL);
});

/* ---------------- STATS ---------------- */

app.get("/stats/:code", async (req, res) => {
  const pass = req.query.password;

  if (pass !== PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .eq("code", req.params.code);

  if (error) return res.json([]);

  res.json(data);
});

/* ---------------- DASHBOARD ---------------- */

app.get("/dashboard", (req, res) => {
  const pass = req.query.password;

  if (pass !== PASSWORD) {
    return res.redirect("/login.html");
  }

  res.sendFile(
    path.join(__dirname, "public", "dashboard.html")
  );
});

/* ---------------- LOGIN ---------------- */

app.get("/login", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "login.html")
  );
});

/* ---------------- HOME ---------------- */

app.get("/", (req, res) => {
  res.send("🚀 QR Tracker ONLINE");
});

/* ---------------- START ---------------- */

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
