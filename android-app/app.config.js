/* global __dirname */

const app = require("./app.json");
const fs = require("fs");
const path = require("path");

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((values, line) => {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);

      if (!match) {
        return values;
      }

      const key = match[1].trim();
      const value = match[2].replace(/^["']|["']$/g, "").trim();

      return {
        ...values,
        [key]: value,
      };
    }, {});
}

const rootEnv = {
  ...readEnvFile(path.resolve(__dirname, "../.env")),
  ...readEnvFile(path.resolve(__dirname, "../.env.local")),
  ...process.env,
};

module.exports = ({ config }) => ({
  ...config,
  ...app.expo,
  extra: {
    ...app.expo.extra,
    apiUrl: rootEnv.EXPO_PUBLIC_API_URL || app.expo.extra?.apiUrl,
    googleAndroidClientId:
      rootEnv.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
      rootEnv.GOOGLE_ANDROID_CLIENT_ID ||
      "",
    googleWebClientId:
      rootEnv.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
      rootEnv.GOOGLE_CLIENT_ID ||
      rootEnv.AUTH_GOOGLE_ID ||
      "",
  },
});
