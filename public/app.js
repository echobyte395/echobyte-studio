const params = new URLSearchParams(window.location.search);

const code = params.get("code") || "qrcode";

const password = params.get("password");

fetch(`/stats/${code}?password=${password}`)
  .then(r => r.json())
  .then(data => {

    /* -------- TOTAL -------- */

    document.getElementById("total")
      .textContent = data.length;

    /* -------- COUNTRIES -------- */

    const countries = {};

    data.forEach(d => {
      countries[d.country] =
        (countries[d.country] || 0) + 1;
    });

    document.getElementById("countries")
      .textContent = Object.keys(countries).length;

    /* -------- CITIES -------- */

    const cities = {};

    data.forEach(d => {
      cities[d.city] =
        (cities[d.city] || 0) + 1;
    });

    document.getElementById("cities")
      .textContent = Object.keys(cities).length;

    /* -------- GRAPH -------- */

    new Chart(document.getElementById("chart"), {

      type: "bar",

      data: {
        labels: Object.keys(countries),

        datasets: [{
          label: "Scans",
          data: Object.values(countries)
        }]
      }
    });

    /* -------- MAP -------- */

    const map = L.map("map")
      .setView([20, 0], 2);

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "Map"
      }
    ).addTo(map);

    data.forEach(d => {

      if (d.latitude && d.longitude) {

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

      }

    });

    /* -------- TABLE -------- */

    const table =
      document.getElementById("table");

    table.innerHTML = `
      <tr>
        <th>Heure</th>
        <th>Pays</th>
        <th>Ville</th>
        <th>OS</th>
        <th>Navigateur</th>
        <th>IP</th>
      </tr>

      ${data.slice(-50).reverse().map(d => `
        <tr>
          <td>${new Date(d.time).toLocaleString()}</td>
          <td>${d.country}</td>
          <td>${d.city}</td>
          <td>${d.os}</td>
          <td>${d.browser}</td>
          <td>${d.ip}</td>
        </tr>
      `).join("")}
    `;

  });