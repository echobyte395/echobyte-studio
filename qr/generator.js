const QRCode = require("qrcode");

const baseURL =
  "https://TON-SITE.onrender.com/r/";

function create(code) {

  QRCode.toFile(
    `${code}.png`,
    baseURL + code
  );

}

create("qrcode");
create("insta");
create("youtube");
create("flyer");