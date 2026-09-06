import React from "react";
import { createRoot } from "react-dom/client";
import FloatingFab from "./FloatingFab";

const CSS = `
:host {
  all: initial;
}
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}
button {
  border: none;
  background: none;
  cursor: pointer;
  color: inherit;
}

.fab {
  position: fixed;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, #f97316, #0ea5e9);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
  cursor: grab;
  touch-action: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.fab:hover {
  transform: scale(1.06);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
}
.fab:active {
  cursor: grabbing;
  transform: scale(0.96);
}

.menu {
  position: fixed;
  width: 168px;
  padding: 6px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
  color: #1f2937;
  text-align: left;
}
.menu-item:hover {
  background: #f5f5f4;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.32);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1;
}

.panel {
  width: 100%;
  max-width: 380px;
  max-height: 82vh;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
  overflow: hidden;
}
.panel-wide {
  max-width: 440px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0ee;
}
.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #1c1917;
}
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 8px;
  color: #78716c;
}
.icon-btn:hover {
  background: #f5f5f4;
  color: #1c1917;
}
.btn-confirm {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  color: #fff;
  background: #dc2626;
}
.btn-confirm:hover {
  background: #b91c1c;
}

.panel-body {
  padding: 16px;
}
.panel-scroll {
  overflow-y: auto;
}

.hint {
  font-size: 13px;
  color: #78716c;
  padding: 12px 0;
}
.error {
  font-size: 13px;
  color: #dc2626;
  margin-top: 8px;
}
.success {
  font-size: 13px;
  color: #16a34a;
  margin-top: 8px;
}

.textarea {
  width: 100%;
  min-height: 110px;
  resize: vertical;
  border: 1px solid #e7e5e4;
  border-radius: 12px;
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #1c1917;
  outline: none;
}
.textarea:focus {
  border-color: #f97316;
}

.thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.thumb {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e7e5e4;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.thumb-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
}

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #f0f0ee;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
}
.btn-primary {
  background: #1c1917;
  color: #fff;
}
.btn-primary:hover {
  background: #292524;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-ghost {
  color: #57534e;
}
.btn-ghost:hover {
  background: #f5f5f4;
}

.note {
  border-bottom: 1px solid #f0f0ee;
  padding: 10px 0;
}
.note:last-child {
  border-bottom: none;
}
.note-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.note-title {
  flex: 1;
  text-align: left;
  font-size: 14px;
  color: #1c1917;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.note-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.note-time {
  font-size: 11px;
  color: #a8a29e;
}
.note-body {
  margin-top: 10px;
  padding: 12px;
  border-radius: 10px;
  background: #fafaf9;
  font-size: 14px;
  line-height: 1.7;
  color: #292524;
  word-break: break-word;
}
.note-body img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}
`;

// Shadow DOM 隔离宿主页面样式，固定元素相对视口定位
const host = document.createElement("div");
host.id = "chronicle-fab-host";
host.style.cssText = "width:0;height:0;overflow:visible;";
document.documentElement.appendChild(host);

const shadow = host.attachShadow({ mode: "open" });

const style = document.createElement("style");
style.textContent = CSS;
shadow.appendChild(style);

const mount = document.createElement("div");
shadow.appendChild(mount);

createRoot(mount).render(<FloatingFab />);
