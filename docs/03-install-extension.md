# 03 · 安装浏览器插件（本地加载开发者模式）

浏览器插件目前通过「本地加载开发者模式」使用，零成本、无需审核、也无需上架 Chrome Web Store。

## 一、构建插件

插件源码位于 `extension/` 目录。你需要先构建出可加载的 `dist` 文件夹。

```bash
cd extension
npm install
npm run build
```

构建完成后，会生成 `extension/dist` 文件夹。

> 如果你还没有安装 Node.js，先去 [https://nodejs.org](https://nodejs.org) 下载 LTS 版本安装。

---

## 二、在 Chrome 中加载

1. 打开 Chrome，在地址栏输入 `chrome://extensions` 并回车。
2. 打开右上角的 **开发者模式（Developer mode）** 开关。
3. 点击左上角 **加载已解压的扩展程序（Load unpacked）**。
4. 选择刚才构建出的 `extension/dist` 文件夹。
5. 加载成功后，工具栏会出现「极简笔记」图标（可在拼图图标里固定到工具栏）。

---

## 三、在 Edge 中加载

Edge 与 Chrome 同为 Chromium 内核，步骤几乎一致：

1. 打开 `edge://extensions`。
2. 打开左侧 **开发人员模式**。
3. 点击 **加载解压缩的扩展**。
4. 选择 `extension/dist` 文件夹。

---

## 四、固定图标到工具栏

1. 点击浏览器右上角的**拼图图标**（扩展程序列表）。
2. 找到「极简笔记」，点击旁边的**图钉**图标，把它固定到工具栏，方便随时点击使用。

---

## 五、更新插件

当你拉取了最新代码后，重新构建并重新加载：

```bash
cd extension
npm run build
```

然后在 `chrome://extensions` 页面，找到「极简笔记」，点击**刷新**按钮（或先移除再重新加载）。

---

## 下一步

安装完成后，需要把插件连接到你的站点，见 [04-pair-extension.md](./04-pair-extension.md)。
