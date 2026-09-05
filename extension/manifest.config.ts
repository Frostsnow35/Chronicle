import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest(async () => ({
  manifest_version: 3,
  name: "极简笔记 · Minimal Notes",
  description:
    "在浏览器里随时记下灵感，支持文字和图片，保存到你自己部署的极简笔记站点。",
  version: pkg.version,
  minimum_chrome_version: "114",
  action: {
    default_popup: "src/popup/index.html",
    default_title: "极简笔记"
  },
  options_page: "src/options/index.html",
  background: {
    service_worker: "src/background/service-worker.ts",
    type: "module"
  },
  permissions: ["storage", "alarms", "tabs"],
  host_permissions: ["<all_urls>"]
}));
