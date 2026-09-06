# 修复文章图片显示 + 插件浮动速记图标 Spec

## Why
用户反馈两个问题：其一（严重），文章正文插入的图片在阅读页完全看不到；其二，速记不应全部转为文章，作者需要随时在浏览器中查看、阅读并删除速记。当前插件只有弹窗与选项页，缺少页面内悬浮入口。

## What Changes
- 修复文章正文图片在阅读页不显示的问题（严重）
- 新增浏览器页面内浮动图标（内容脚本注入所有页面），可拖动、位置持久化
- 浮动图标菜单提供「写速记」与「看速记」两个入口
- 「写速记」在页面内浮层输入并保存到作者站点
- 「看速记」在页面内浮层列表浏览、展开阅读、删除单条
- 速记保持独立，不自动转为文章

## Impact
- Affected specs: 插件能力（内容脚本）、web 图片上传与渲染
- Affected code:
  - web/app/api/storage/upload/route.ts（图片上传容错）
  - web/app/posts/[id]/page.tsx（阅读渲染）
  - web/lib/utils.ts（lazyLoadImages 容错）
  - extension/manifest.config.ts（注册 content_scripts）
  - extension/src/lib/api-client.ts（复用保存 / 删除 / 拉取）
  - extension/src/lib/storage.ts（图标位置持久化）
  - extension/src/content/（新增浮动图标、浮层编辑器、浮层列表）

## ADDED Requirements

### Requirement: 文章图片正常显示
系统 SHALL 保证作者在文章正文插入的图片在阅读页正确显示。

#### Scenario: 阅读含图文章
- **WHEN** 作者发布一篇包含图片的文章
- **THEN** 访客与作者在阅读页能看到图片

### Requirement: 图片上传容错
图片上传 SHALL 具备容错能力：压缩失败时退回原图上传，确保图片始终可保存。

#### Scenario: 压缩失败退回原图
- **WHEN** 图片压缩（sharp）抛出异常
- **THEN** 系统退回原始图片字节上传，仍返回公开 URL

### Requirement: 页面浮动图标
插件 SHALL 在启用后于所有网页注入一个可拖动的浮动图标。

#### Scenario: 图标浮现与拖动
- **WHEN** 用户启用插件并打开任意网页
- **THEN** 页面边缘出现浮动图标；用户拖动图标后位置被保存，刷新后仍在原位

### Requirement: 浮动菜单
点击浮动图标 SHALL 弹出菜单，包含「写速记」与「看速记」。

#### Scenario: 打开菜单
- **WHEN** 用户点击浮动图标
- **THEN** 弹出菜单，展示「写速记」与「看速记」两个入口

### Requirement: 页面内写速记
「写速记」SHALL 在页面内弹出浮层输入框，支持文字（可选图片），保存到作者站点。

#### Scenario: 页面内保存速记
- **WHEN** 用户在浮层输入内容并点击保存
- **THEN** 速记保存到作者站点，浮层关闭并给出成功反馈

### Requirement: 页面内浏览速记
「看速记」SHALL 在页面内弹出浮层列表，展示作者最近速记，支持展开阅读与删除单条。

#### Scenario: 浏览与删除速记
- **WHEN** 用户点击「看速记」
- **THEN** 浮层展示最近速记列表；用户可展开阅读全文、删除单条

### Requirement: 速记独立性
速记 SHALL 保持独立存储，不自动转为文章；作者可随时查看与删除。

#### Scenario: 速记不自动转文章
- **WHEN** 作者保存一条速记
- **THEN** 速记仅作为速记存储，不会被自动转为文章

## MODIFIED Requirements

### Requirement: 文章阅读渲染
阅读页 SHALL 优先渲染 content_html；仅当 content_html 为空时回退到摘要，且不得因此丢失图片。
