import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest(async () => ({
  manifest_version: 3,
  name: "Chronicle",
  description:
    "用文字锚定时间：在浏览器里随时记下灵感，支持文字和图片，保存到你自己部署的 Chronicle 站点。",
  version: pkg.version,
  minimum_chrome_version: "114",
  icons: {
    16: "icons/icon16.png",
    48: "icons/icon48.png",
    128: "icons/icon128.png"
  },
  action: {
    default_popup: "src/popup/index.html",
    default_title: "Chronicle"
  },
  options_page: "src/options/index.html",
  background: {
    service_worker: "src/background/service-worker.ts",
    type: "module"
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/index.tsx"],
      run_at: "document_idle"
    }
  ],
  permissions: ["storage", "alarms"],
  host_permissions: ["<all_urls>"]
}));
