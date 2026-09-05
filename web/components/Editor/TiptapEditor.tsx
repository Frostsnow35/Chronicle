"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Heading3,
  ImagePlus,
  Undo2,
  Redo2
} from "lucide-react";
import { twMerge } from "tailwind-merge";

export interface TiptapEditorProps {
  value?: { html?: string; json?: any } | null;
  onChange?: (payload: { html: string; json: any }) => void;
  placeholder?: string;
  editable?: boolean;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  onReady?: (editor: Editor) => void;
}

async function uploadImageViaApi(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/storage/upload", { method: "POST", body: fd });
  if (!r.ok) return null;
  const d = await r.json().catch(() => null);
  return d?.url || null;
}

export default function TiptapEditor({
  value,
  onChange,
  placeholder = "在此处开始写作…",
  editable = true,
  minHeight = 360,
  maxHeight,
  className,
  onReady
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        horizontalRule: false
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Underline,
      Placeholder.configure({ placeholder })
    ],
    editable,
    content: value?.html ?? value?.json ?? "",
    editorProps: {
      attributes: {
        class: "prose-minimal outline-none focus:outline-none"
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const files = Array.from(event.dataTransfer?.files || []).filter((f) =>
          f.type.startsWith("image/")
        );
        if (!files.length) return false;
        files.forEach(async (f) => {
          const url = await uploadImageViaApi(f);
          if (url) {
            editor?.chain().focus().setImage({ src: url }).run();
          }
        });
        return true;
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        for (const it of items) {
          if (it.type.startsWith("image/")) {
            const f = it.getAsFile();
            if (f) {
              uploadImageViaApi(f).then((url) => {
                if (url) editor?.chain().focus().setImage({ src: url }).run();
              });
              return true;
            }
          }
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
      onChange?.({
        html: editor.getHTML(),
        json: editor.getJSON()
      });
    }
  });

  useEffect(() => {
    if (!editor) return;
    if (value?.html && editor.getHTML() !== value.html) {
      editor.commands.setContent(value.html);
    }
    onReady?.(editor);
  }, [editor, value?.html, onReady]);

  useEffect(() => {
    if (editor && editable !== editor.isEditable) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  if (!editor) return null;

  return (
    <div
      className={twMerge(
        "rounded-2xl border border-white/60 bg-white/75 shadow-glass backdrop-blur overflow-hidden",
        className
      )}
      style={{ maxHeight }}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-white/60 bg-white/60 px-3 py-2 backdrop-blur">
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          label="二级标题"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          icon={<Heading2 className="h-4 w-4" />}
        />
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          label="三级标题"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          icon={<Heading3 className="h-4 w-4" />}
        />
        <Divider />
        <ToolbarButton
          active={editor.isActive("bold")}
          label="粗体 (Ctrl+B)"
          onClick={() => editor.chain().focus().toggleBold().run()}
          icon={<Bold className="h-4 w-4" />}
        />
        <ToolbarButton
          active={editor.isActive("italic")}
          label="斜体 (Ctrl+I)"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          icon={<Italic className="h-4 w-4" />}
        />
        <ToolbarButton
          active={editor.isActive("underline")}
          label="下划线"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          icon={<UnderlineIcon className="h-4 w-4" />}
        />
        <Divider />
        <ToolbarButton
          active={editor.isActive("bulletList")}
          label="无序列表"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          icon={<List className="h-4 w-4" />}
        />
        <ToolbarButton
          active={editor.isActive("orderedList")}
          label="有序列表"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          icon={<ListOrdered className="h-4 w-4" />}
        />
        <ToolbarButton
          active={editor.isActive("blockquote")}
          label="引用"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          icon={<Quote className="h-4 w-4" />}
        />
        <Divider />
        <ToolbarButton
          label="插入图片"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.addEventListener("change", async () => {
              const f = input.files?.[0];
              if (!f) return;
              const url = await uploadImageViaApi(f);
              if (url) editor.chain().focus().setImage({ src: url }).run();
            });
            input.click();
          }}
          icon={<ImagePlus className="h-4 w-4" />}
        />
        <div className="ml-auto flex items-center gap-1">
          <ToolbarButton
            label="撤销 (Ctrl+Z)"
            onClick={() => editor.chain().focus().undo().run()}
            icon={<Undo2 className="h-4 w-4" />}
          />
          <ToolbarButton
            label="重做 (Ctrl+Y)"
            onClick={() => editor.chain().focus().redo().run()}
            icon={<Redo2 className="h-4 w-4" />}
          />
        </div>
      </div>
      <div
        className="overflow-y-auto px-6 py-5 md:px-10"
        style={{ minHeight }}
      >
        <EditorContent editor={editor} />
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
      className={twMerge(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl transition",
        active
          ? "bg-gradient-to-br from-hermes-orange-100 to-sky-blue-100 text-ink-900 shadow-inner"
          : "text-ink-600 hover:bg-white/80 hover:text-ink-900"
      )}
    >
      {icon}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-ink-200/80" />;
}
