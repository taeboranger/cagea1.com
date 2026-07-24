"use client";

import { useState } from "react";
import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style/text-style-kit";

const FONT_FAMILIES = [
  { label: "고딕", value: "" },
  { label: "명조", value: "var(--font-serif), serif" },
  { label: "모노스페이스", value: "ui-monospace, SFMono-Regular, monospace" },
];

const FONT_SIZES = [
  { label: "보통", value: "" },
  { label: "작게", value: "0.8rem" },
  { label: "크게", value: "1.1rem" },
  { label: "아주 크게", value: "1.35rem" },
];

const COLORS = [
  { label: "기본", value: "" },
  { label: "포인트", value: "var(--color-accent)" },
  { label: "프로스트", value: "var(--color-frost)" },
  { label: "회색", value: "var(--color-mist)" },
];

const toolButtonClass = (active?: boolean) =>
  `border px-2 py-1 font-sans text-xs transition-colors ${
    active
      ? "border-ink bg-ink text-paper"
      : "border-line text-ink-soft hover:border-accent hover:text-accent"
  }`;

export default function RichTextEditor({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string;
}) {
  const [html, setHtml] = useState(defaultValue);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [3, 4] },
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        link: false,
        strike: false,
      }),
      TextStyleKit,
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class: "rich-content",
      },
    },
    onUpdate: ({ editor }) => {
      setHtml(editor.getHTML());
    },
  });

  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      bold: ctx.editor?.isActive("bold") ?? false,
      italic: ctx.editor?.isActive("italic") ?? false,
      underline: ctx.editor?.isActive("underline") ?? false,
      heading3: ctx.editor?.isActive("heading", { level: 3 }) ?? false,
      heading4: ctx.editor?.isActive("heading", { level: 4 }) ?? false,
      bulletList: ctx.editor?.isActive("bulletList") ?? false,
      orderedList: ctx.editor?.isActive("orderedList") ?? false,
    }),
  });

  if (!editor) {
    return (
      <div className="min-h-[8rem] w-full border border-line bg-transparent p-3 font-sans text-sm text-mist">
        에디터 불러오는 중...
      </div>
    );
  }

  const {
    bold = false,
    italic = false,
    underline = false,
    heading3 = false,
    heading4 = false,
    bulletList = false,
    orderedList = false,
  } = state ?? {};

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className={toolButtonClass(bold)}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <b>B</b>
        </button>
        <button
          type="button"
          className={`${toolButtonClass(italic)} italic`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </button>
        <button
          type="button"
          className={`${toolButtonClass(underline)} underline`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          U
        </button>
        <button
          type="button"
          className={toolButtonClass(heading3)}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          제목1
        </button>
        <button
          type="button"
          className={toolButtonClass(heading4)}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
        >
          제목2
        </button>
        <button
          type="button"
          className={toolButtonClass(bulletList)}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          목록
        </button>
        <button
          type="button"
          className={toolButtonClass(orderedList)}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          번호목록
        </button>
        <select
          className={toolButtonClass()}
          defaultValue=""
          onChange={(e) => {
            const value = e.target.value;
            if (value) editor.chain().focus().setFontFamily(value).run();
            else editor.chain().focus().unsetFontFamily().run();
          }}
        >
          <option value="" disabled>
            글꼴
          </option>
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          className={toolButtonClass()}
          defaultValue=""
          onChange={(e) => {
            const value = e.target.value;
            if (value) editor.chain().focus().setFontSize(value).run();
            else editor.chain().focus().unsetFontSize().run();
          }}
        >
          <option value="" disabled>
            크기
          </option>
          {FONT_SIZES.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          className={toolButtonClass()}
          defaultValue=""
          onChange={(e) => {
            const value = e.target.value;
            if (value) editor.chain().focus().setColor(value).run();
            else editor.chain().focus().unsetColor().run();
          }}
        >
          <option value="" disabled>
            색상
          </option>
          {COLORS.map((c) => (
            <option key={c.label} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <label
          className={`${toolButtonClass()} flex cursor-pointer items-center gap-1.5`}
        >
          직접 선택
          <input
            type="color"
            className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
            onChange={(e) =>
              editor.chain().focus().setColor(e.target.value).run()
            }
          />
        </label>
        <button
          type="button"
          className={toolButtonClass()}
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
        >
          서식 지우기
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="rich-editor min-h-[8rem] w-full border border-line bg-transparent p-3 transition-colors focus-within:border-accent"
      />
      <input type="hidden" name={name} value={html} readOnly />
    </div>
  );
}
