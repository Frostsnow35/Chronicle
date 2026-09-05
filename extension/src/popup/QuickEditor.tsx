"use client";

import React, { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ImagePlus,
  Send,
  Save,
  CheckCircle2,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { Profile, getDraft, saveDraft, clearDraft } from "@/lib/storage";
import { saveNote } from "@/lib/api-client";

interface Props {
  profile: Profile;
}

type SaveState = "idle" | "saving" | "success" | "error";

export default function QuickEditor({ profile }: Props) {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const autosaveRef = useRef<number | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        orderedList: {},
        bulletList: {},
        blockquote: {},
        code: {},
        codeBlock: false,
        horizontalRule: false
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({
        placeholder: "此刻在想什么？写下来吧…"
      })
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "min-h-[360px] max-h-[360px] overflow-y-auto font-serif text-[15px] leading-[1.8] text-ink-800 outline-none px-4 py-4 focus:outline-none"
      }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (autosaveRef.current) window.clearTimeout(autosaveRef.current);
      autosaveRef.current = window.setTimeout(() => {
        saveDraft({
          html,
          json: editor.getJSON(),
          updatedAt: Date.now()
        });
      }, 800);
    }
  });

  useEffect(() => {
    (async () => {
      const draft = await getDraft();
      if (draft && draft.html && editor) {
        editor.commands.setContent(draft.html);
      }
    })();
  }, [editor]);

  const addImage = async () => {
    if (!editor) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        editor.chain().focus().setImage({ src: result }).run();
      };
      reader.readAsDataURL(file);
    });
    input.click();
  };

  const handleSave = async () => {
    if (!editor) return;
    const html = editor.getHTML();
    const text = editor.getText().trim();
    if (!text) return;

    setSaveState("saving");
    setErrorMsg("");
    setSavedNoteId(null);
    try {
      const res = await saveNote(profile, {
        content_html: html,
        content_json: editor.getJSON(),
        source_url: await activeTabUrl()
      });
      setSavedNoteId(res.id);
      await clearDraft();
      editor.commands.clearContent();
      setSaveState("success");
      window.setTimeout(() => setSaveState("idle"), 2200);
    } catch (e: any) {
      setSaveState("error");
      setErrorMsg(e?.message || "保存失败，请检查网络或重新配对插件。");
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* 顶栏 */}
      <div className="flex items-center justify-between border-b border-white/60 bg-white/70 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-1">
          <ToolbarButton
            label="粗体"
            active={editor?.isActive("bold")}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            icon={<Bold className="h-4 w-4" />}
          />
          <ToolbarButton
            label="斜体"
            active={editor?.isActive("italic")}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            icon={<Italic className="h-4 w-4" />}
          />
          <ToolbarButton
            label="列表"
            active={editor?.isActive("bulletList")}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            icon={<List className="h-4 w-4" />}
          />
          <div className="mx-1 h-5 w-px bg-ink-200" />
          <ToolbarButton
            label="插入图片"
            onClick={addImage}
            icon={<ImagePlus className="h-4 w-4" />}
          />
        </div>
        <div className="flex items-center gap-2">
          {saveState === "success" && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              已保存
              {savedNoteId && (
                <a
                  href={`${profile.siteUrl.replace(/\/$/, "")}/admin/notes`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1 inline-flex items-center gap-0.5 underline-offset-2 hover:underline"
                >
                  查看<ExternalLink className="h-3 w-3" />
                </a>
              )}
            </span>
          )}
          {saveState === "error" && (
            <span
              className="inline-flex items-center gap-1 text-xs text-red-600"
              title={errorMsg}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              保存失败
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saveState === "saving" || !editor?.getText().trim()}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-gradient-to-r from-hermes-orange-500 to-hermes-orange-400 px-4 text-xs font-medium text-white shadow-glass transition hover:from-hermes-orange-600 hover:to-hermes-orange-500 disabled:opacity-50"
          >
            {saveState === "saving" ? (
              <>
                <Save className="h-3.5 w-3.5 animate-pulse" />
                保存中
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                保存到我的站点
              </>
            )}
          </button>
        </div>
      </div>

      {/* 编辑区 */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* 底部站点信息 */}
      <div className="border-t border-white/60 bg-white/60 px-4 py-2 backdrop-blur">
        <p className="truncate text-[11px] text-ink-500">
          已连接 ·{" "}
          <span className="text-ink-700">{profile.siteUrl.replace(/^https?:\/\//, "")}</span>
          <span className="ml-3 inline-flex items-center gap-1 text-hermes-orange-600/80">
            · 草稿自动保存
          </span>
        </p>
      </div>
    </div>
  );
}

function ToolbarButton({
  icon,
  onClick,
  active,
  label
}: {
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
        active
          ? "bg-gradient-to-br from-hermes-orange-100 to-sky-blue-100 text-ink-900 shadow-inner"
          : "text-ink-600 hover:bg-white/80 hover:text-ink-900"
      }`}
    >
      {icon}
    </button>
  );
}

async function activeTabUrl(): Promise<string | undefined> {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    });
    return tab?.url;
  } catch {
    return undefined;
  }
}
