# 任务拆分（TASK_BREAKDOWN）

> 更新日期：2026-09-06。每个原子任务不超过 3 个函数。

## 任务 1：移除 Google Fonts 外链

- 输入：`web/styles/globals.css` 第 5 行的 `@import`
- 输出：删除该行，首屏无外部字体请求
- 函数：无（纯删除）

## 任务 2：系统字体栈替换

- 输入：`web/tailwind.config.ts` 的 `fontFamily.serif/sans`、`web/styles/globals.css` 的 `body` 字体
- 输出：改为系统中文字体栈，去掉 Noto Serif SC / Lora / Inter
- 函数：无（纯配置修改）

## 任务 3：服务端 sharp 图片压缩

- 输入：`web/app/api/storage/upload/route.ts` 的 `POST`
- 输出：新增 `compressImage(buffer, mimeType)`，限宽 1920、转 webp、质量 80
- 函数：`compressImage`（1 个）

## 任务 4：声明 sharp 依赖

- 输入：`web/package.json`
- 输出：`dependencies` 增加 `sharp`
- 函数：无

## 任务 5：正文与笔记图片懒加载

- 输入：`web/lib/utils.ts`、`web/app/posts/[id]/page.tsx`、`web/app/admin/notes/page.tsx`
- 输出：新增 `lazyLoadImages(html)`，给 `<img>` 注入 `loading="lazy" decoding="async"`
- 函数：`lazyLoadImages`（1 个）

## 验证

- `web` 下执行 `npm run build` 通过。
