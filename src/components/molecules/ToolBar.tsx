import { useRef } from "react";
import { Editor } from "@tiptap/react";
import { Icon } from "@iconify/react";
import { MathPicker } from "./MathPicker";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const CHAT_BUTTONS = [
  "text-bold",
  "text-italic",
  "text-strikethrough",
  "left-to-right-list-star",
  "left-to-right-list-number",
  "link-01",
];

interface ToolBarProps {
  editor: Editor;
  onImageUpload?: (file: File) => Promise<string | null>;
  variant?: "full" | "chat";
}

const ToolBar = ({ editor, onImageUpload, variant = "full" }: ToolBarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const buttons = [
    {
      svg: "text-bold",
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive("bold"),
      canRun: () => editor.can().chain().focus().toggleBold().run(),
    },
    {
      svg: "text-italic",
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive("italic"),
      canRun: () => editor.can().chain().focus().toggleItalic().run(),
    },
    {
      svg: "text-underline",
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive("underline"),
      canRun: () => editor.can().chain().focus().toggleUnderline().run(),
    },
    {
      svg: "text-strikethrough",
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive("strike"),
      canRun: () => editor.can().chain().focus().toggleStrike().run(),
    },
    ...[1, 2, 3, 4, 5, 6].map((level) => ({
      svg: `heading-0${level}`,
      action: () =>
        editor
          .chain()
          .focus()
          .toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 })
          .run(),
      isActive: () => editor.isActive("heading", { level }),
      canRun: () => true,
    })),
    {
      svg: "left-to-right-list-star",
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive("bulletList"),
      canRun: () => true,
    },
    {
      svg: "left-to-right-list-number",
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive("orderedList"),
      canRun: () => true,
    },
    {
      svg: "quote-up",
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive("blockquote"),
      canRun: () => true,
    },
    {
      svg: "code",
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: () => editor.isActive("codeBlock"),
      canRun: () => true,
    },
    {
      svg: "link-01",
      action: () => {
        if (editor.isActive("link")) {
          editor.chain().focus().unsetLink().run();
        } else {
          const url = prompt("Enter URL");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }
      },
      isActive: () => editor.isActive("link"),
      canRun: () => editor.can().setLink || editor.isActive("link"),
    },
    {
      svg: "undo",
      action: () => editor.chain().focus().undo().run(),
      isActive: () => false,
      canRun: () => editor.can().undo(),
    },
    {
      svg: "redo",
      action: () => editor.chain().focus().redo().run(),
      isActive: () => false,
      canRun: () => editor.can().redo(),
    },
  ];

  const visibleButtons =
    variant === "chat"
      ? buttons.filter((b) => CHAT_BUTTONS.includes(b.svg))
      : buttons;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;
    const url = await onImageUpload(file);
    if (url) editor.chain().focus().setImage({ src: url }).run();
    e.target.value = "";
  };

  return (
    <div className="flex flex-wrap gap-[8px] px-[14px] py-[6px]">
      {visibleButtons.map((button, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.preventDefault();
            button.action();
          }}
          disabled={!button.canRun()}
          className={`flex h-[32px] w-[32px] items-center justify-center rounded-[6px] transition-all duration-[.4s] ${
            button.isActive()
              ? "bg-[#007fff10] text-[#007fff]"
              : "bg-white text-[#98A2B3]"
          }`}
        >
          <Icon icon={`hugeicons:${button.svg}`} />
        </button>
      ))}

      {/* Math / Science symbol picker — full variant only */}
      {variant !== "chat" && <MathPicker editor={editor} />}

      {onImageUpload && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              fileInputRef.current?.click();
            }}
            className="flex h-[32px] w-[32px] items-center justify-center rounded-[6px] transition-all duration-[.4s] bg-white text-[#98A2B3] hover:text-[#007fff]"
            title="Insert image"
          >
            <Icon icon="hugeicons:image-01" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            className="sr-only"
            onChange={handleFileChange}
          />
        </>
      )}
    </div>
  );
};

export { ToolBar };
