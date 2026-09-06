import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Feather,
  PenLine,
  NotebookText,
  X,
  Trash2,
  ImagePlus
} from "lucide-react";
import {
  getProfile,
  getFabPosition,
  saveFabPosition,
  type Profile,
  type FabPosition
} from "@/lib/storage";
import { saveNote, listNotes, deleteNote, type NoteItem } from "@/lib/api-client";

const FAB_SIZE = 52;
const MENU_WIDTH = 168;

function clamp(p: FabPosition): FabPosition {
  const maxX = Math.max(0, window.innerWidth - FAB_SIZE);
  const maxY = Math.max(0, window.innerHeight - FAB_SIZE);
  return {
    x: Math.min(Math.max(0, p.x), maxX),
    y: Math.min(Math.max(0, p.y), maxY)
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", { hour12: false });
  } catch {
    return "";
  }
}

export default function FloatingFab() {
  const [pos, setPos] = useState<FabPosition>(() =>
    clamp({ x: window.innerWidth - FAB_SIZE - 20, y: window.innerHeight - FAB_SIZE - 20 })
  );
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<"write" | "browse" | null>(null);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const p = await getProfile();
      setProfile(p);
      const saved = await getFabPosition();
      if (saved) setPos(clamp(saved));
    })();
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: pos.x,
      baseY: pos.y,
      moved: false
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    if (d.moved) setPos(clamp({ x: d.baseX + dx, y: d.baseY + dy }));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d) return;
    if (d.moved) {
      const final = clamp({
        x: d.baseX + (e.clientX - d.startX),
        y: d.baseY + (e.clientY - d.startY)
      });
      setPos(final);
      saveFabPosition(final);
    } else {
      setMenuOpen((v) => !v);
    }
    dragRef.current = null;
  };

  const openWrite = () => {
    setMenuOpen(false);
    setMode("write");
  };

  const openBrowse = () => {
    setMenuOpen(false);
    setMode("browse");
  };

  const menuLeft = Math.max(8, pos.x + FAB_SIZE - MENU_WIDTH);
  const menuBottom = window.innerHeight - pos.y + 8;

  return (
    <>
      <button
        className="fab"
        style={{ left: pos.x, top: pos.y }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        aria-label="Chronicle 速记"
      >
        <Feather size={22} />
      </button>

      {menuOpen && (
        <div className="menu" style={{ left: menuLeft, bottom: menuBottom }}>
          <button className="menu-item" onClick={openWrite}>
            <PenLine size={16} />
            <span>写速记</span>
          </button>
          <button className="menu-item" onClick={openBrowse}>
            <NotebookText size={16} />
            <span>看速记</span>
          </button>
        </div>
      )}

      {mode === "write" && (
        <WriteOverlay profile={profile} onClose={() => setMode(null)} />
      )}

      {mode === "browse" && (
        <BrowseOverlay profile={profile} onClose={() => setMode(null)} />
      )}
    </>
  );
}

function WriteOverlay({
  profile,
  onClose
}: {
  profile: Profile | null;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addImage = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setImages((arr) => [...arr, dataUrl]);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!profile) {
      setError("尚未配对站点，请先在插件设置中完成配对。");
      return;
    }
    const trimmed = text.trim();
    if (!trimmed && images.length === 0) {
      setError("请输入内容或插入图片。");
      return;
    }
    const paras = trimmed
      .split(/\n+/)
      .map((line) => `<p>${escapeHtml(line)}</p>`);
    const imgs = images.map((d) => `<img src="${d}" alt="" />`);
    const content_html = [...paras, ...imgs].join("");

    setSaving(true);
    setError(null);
    try {
      await saveNote(profile, { content_html, content_json: {} });
      setDone(true);
      setTimeout(onClose, 900);
    } catch (e: any) {
      setError(e?.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay">
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">写速记</span>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <div className="panel-body">
          {!profile && (
            <div className="hint">
              尚未配对站点，请先打开插件设置完成配对后使用。
            </div>
          )}
          <textarea
            className="textarea"
            placeholder="记下此刻的想法…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            autoFocus
          />

          {images.length > 0 && (
            <div className="thumbs">
              {images.map((d, i) => (
                <div className="thumb" key={i}>
                  <img src={d} alt="" />
                  <button
                    className="thumb-remove"
                    onClick={() => setImages((arr) => arr.filter((_, j) => j !== i))}
                    aria-label="移除图片"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && <div className="error">{error}</div>}
          {done && <div className="success">已保存</div>}
        </div>

        <div className="panel-footer">
          <button
            className="btn btn-ghost"
            onClick={() => fileRef.current?.click()}
            disabled={saving}
          >
            <ImagePlus size={16} />
            <span>图片</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) addImage(f);
              e.target.value = "";
            }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BrowseOverlay({
  profile,
  onClose
}: {
  profile: Profile | null;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) {
      setError("尚未配对站点，请先在插件设置中完成配对。");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await listNotes(profile);
      setNotes(list);
    } catch (e: any) {
      setError(e?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!profile) return;
    if (confirmingId !== id) {
      setConfirmingId(id);
      return;
    }
    setConfirmingId(null);
    try {
      await deleteNote(profile, id);
      setNotes((arr) => arr.filter((n) => n.id !== id));
      if (expanded === id) setExpanded(null);
    } catch (e: any) {
      setError(e?.message || "删除失败");
    }
  };

  return (
    <div className="overlay">
      <div className="panel panel-wide">
        <div className="panel-header">
          <span className="panel-title">我的速记</span>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <div className="panel-body panel-scroll">
          {loading && <div className="hint">加载中…</div>}
          {error && <div className="error">{error}</div>}
          {!loading && !error && notes.length === 0 && (
            <div className="hint">还没有速记，点击右下角图标写一条吧。</div>
          )}

          {notes.map((n) => (
            <div className="note" key={n.id}>
              <div className="note-head">
                <button
                  className="note-title"
                  onClick={() => setExpanded(expanded === n.id ? null : n.id)}
                >
                  {stripHtml(n.content_html).slice(0, 60) || "（无文字）"}
                </button>
                <div className="note-actions">
                  <span className="note-time">{formatTime(n.created_at)}</span>
                  <button
                    className={
                      confirmingId === n.id ? "btn-confirm" : "icon-btn"
                    }
                    onClick={() => handleDelete(n.id)}
                    aria-label="删除速记"
                  >
                    {confirmingId === n.id ? (
                      <span>确认删除</span>
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              </div>
              {expanded === n.id && (
                <div
                  className="note-body"
                  dangerouslySetInnerHTML={{ __html: n.content_html }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
