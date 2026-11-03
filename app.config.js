// Completa o app.json. O push no Android precisa do arquivo do Firebase (google-services.json).
// Enquanto ele não existir, o app funciona normalmente (só o push do Android fica desligado no build).
const fs = require("fs");
const path = require("path");

module.exports = ({ config }) => {
  const hasFirebase = fs.existsSync(path.join(__dirname, "google-services.json"));
  return {
    ...config,
    android: {
      ...config.android,
      ...(hasFirebase ? { googleServicesFile: "./google-services.json" } : {}),
    },
  };
};
