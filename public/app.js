const params =
  new URLSearchParams(
    window.location.search
  );

const code =
  params.get("code") || "qrcode";

const password =
  params.get("password");

/* ---------------- ELEMENTS ---------------- */

const totalEl =
  document.getElementById("total");

const countriesEl =
  document.getElementById("countries");

const citiesEl =
  document.getElementById("cities");

const table =
  document.getElementById("table");

/* ---------------- MAP ---------------- */

const map =
  L.map("map")
    .setView([20, 0], 2);

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution: "Map"
  }
).addTo(map);

let markers = [];

/* ---------------- CHART ---------------- */

const chart = new Chart(
  document.getElementById("chart"),
  {
    type: "bar",

    data: {
      labels: [],
      datasets: [
        {
          label: "Scans",
          data: []
        }
      ]
    }
  }
);

/* ---------------- SOUND ---------------- */

const audio = new Audio(
  "https://actions.google.com/sounds/v1/cartoon/pop.ogg"
);

/* ---------------- LOAD ---------------- */

async function loadStats() {

  const r = await fetch(
    `/stats/${code}?password=${encodeURIComponent(password)}`
  );

  const data = await r.json();

  /* -------- TOTAL -------- */

  totalEl.textContent =
    data.length;

  /* -------- COUNTRIES -------- */

  const countries = {};

  data.forEach(d => {

    const c =
      d.country || "unknown";

    countries[c] =
      (countries[c] || 0) + 1;

  });

  countriesEl.textContent =
    Object.keys(countries).length;

  /* -------- CITIES -------- */

  const cities = {};

  data.forEach(d => {

    const c =
      d.city || "unknown";

    cities[c] =
      (cities[c] || 0) + 1;

  });

  citiesEl.textContent =
    Object.keys(cities).length;

  /* -------- CHART -------- */

  chart.data.labels =
    Object.keys(countries);

  chart.data.datasets[0].data =
    Object.values(countries);

  chart.update();

  /* -------- MAP -------- */

  markers.forEach(m => {
    map.removeLayer(m);
  });

  markers = [];

  data.forEach(d => {

    if (
      d.latitude &&
      d.longitude
    ) {

      const marker =
        L.marker([
          d.latitude,
          d.longitude
        ])
        .addTo(map)
        .bindPopup(`
          <b>${d.city}</b><br>
          ${d.country}<br>
          ${d.os}
        `);

      markers.push(marker);

    }

  });

  /* -------- TABLE -------- */

  table.innerHTML = `

    <tr>
      <th>Heure</th>
      <th>Pays</th>
      <th>Ville</th>
      <th>OS</th>
      <th>Navigateur</th>
    </tr>

    ${data.slice().reverse().map(d => `

      <tr>
        <td>
          ${new Date(
            d.created_at
          ).toLocaleString()}
        </td>

        <td>${d.country}</td>

        <td>${d.city}</td>

        <td>${d.os}</td>

        <td>${d.browser}</td>

      </tr>

    `).join("")}

  `;

  /* -------- NOTIF -------- */

  if (
    window.lastCount &&
    data.length > window.lastCount
  ) {

    audio.play();

    const latest =
      data[data.length - 1];

    showPopup(latest);

  }

  window.lastCount =
    data.length;

}

/* ---------------- POPUP ---------------- */

function showPopup(scan) {

  const div =
    document.createElement("div");

  div.className = "popup";

  div.innerHTML = `
    🔔 Nouveau scan<br>
    ${scan.country} - ${scan.city}
  `;

  document.body.appendChild(div);

  setTimeout(() => {
    div.remove();
  }, 4000);

}

/* ---------------- AUTO REFRESH ---------------- */

loadStats();

setInterval(loadStats, 5000);

/* ---------------- QR GENERATOR ---------------- */

function generateQR() {

  const codeInput =
    document.getElementById("newQR").value;

  const url =
    `${window.location.origin}/r/${codeInput}`;

  const img =
    document.getElementById("qrImage");

  img.src =
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;

}
