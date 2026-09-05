import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dist = resolve(root, "dist");
const outZip = resolve(root, "chronicle-extension.zip");

if (!existsSync(dist)) {
  console.error("请先运行 npm run build 生成 dist/ 目录。");
  process.exit(1);
}

if (existsSync(outZip)) rmSync(outZip, { force: true });

if (process.platform === "win32") {
  // 使用 PowerShell Compress-Archive 打包 dist 目录（ZIP 内 manifest.json 位于根级）
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${dist}\\*' -DestinationPath '${outZip}' -Force"`,
    { stdio: "inherit" }
  );
} else {
  // macOS / Linux：使用系统 zip（如未安装请手动将 dist 目录打包为 ZIP）
  execSync(`cd "${dist}" && zip -r "${outZip}" .`, { stdio: "inherit" });
}

console.log("已生成商店打包产物：" + outZip);
