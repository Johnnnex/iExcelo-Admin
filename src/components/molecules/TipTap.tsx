"use client";

import Blockquote from "@tiptap/extension-blockquote";
import BulletList from "@tiptap/extension-bullet-list";
import CodeBlock from "@tiptap/extension-code-block";
import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";
import OrderedList from "@tiptap/extension-ordered-list";
import { InlineMathMarkdown, BlockMathMarkdown } from "./MathExtensions";
import Underline from "@tiptap/extension-underline";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, forwardRef, FocusEvent, HTMLAttributes } from "react";
import { ToolBar } from "./ToolBar";
import "@/app/tiptap.css";
import { Icon } from "@iconify/react";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export type SyntheticEvent = {
  target: {
    name: string;
    value: string;
  };
};

export interface RichTextProps {
  image?: {
    allowed: boolean;
    folder: string;
  };
  /** Controls toolbar scope.
   * - `full` (default) — all buttons
   * - `chat` — bold, italic, link, image only
   */
  variant?: "full" | "chat";
  maxHeight?: string;
  minHeight?: string;
}

interface TipTapProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  name?: string;
  value?: string;
  onChange?: (event: { target: { name: string; value: string } }) => void;
  onBlur?: (event: FocusEvent<HTMLDivElement>) => void;
  trigger?: any;
  error?: string;
  readOnly?: boolean;
  richTextProps?: RichTextProps;
  onImageUpload?: (file: File) => Promise<string | null>;
}

const getEditorMarkdown = (editor: Editor): string => {
  return (
    (
      editor.storage as unknown as Record<
        string,
        { getMarkdown?: () => string }
      >
    ).markdown?.getMarkdown?.() ?? ""
  );
};

const TipTap = forwardRef<HTMLDivElement, TipTapProps>(
  (
    {
      name = "rich-text",
      value = undefined,
      onChange,
      onBlur,
      error,
      readOnly = false,
      richTextProps,
      onImageUpload,
      ...rest
    },
    ref,
  ) => {
    const imageAllowed = !!richTextProps?.image?.allowed && !!onImageUpload;

    const handleImageFile = (file: File, editorInstance: Editor) => {
      if (!ALLOWED_TYPES.includes(file.type) || !onImageUpload) return false;
      onImageUpload(file).then((url) => {
        if (url) editorInstance.chain().focus().setImage({ src: url }).run();
      });
      return true;
    };

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: false,
          bulletList: false,
          orderedList: false,
          blockquote: false,
          codeBlock: false,
        }),
        Underline,
        Link,
        Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
        BulletList,
        OrderedList,
        Blockquote,
        CodeBlock,
        Image,
        Markdown,
        InlineMathMarkdown,
        BlockMathMarkdown,
      ],
      content: value,
      onUpdate: ({ editor }) => {
        const markdown = getEditorMarkdown(editor);
        onChange?.({ target: { name, value: markdown } });
      },
      editorProps: {
        attributes: {
          class: `outline-none text-[16px] font-[400] leading-[24px] bg-white p-[1px_14px_10px_14px] rounded-[8px] min-h-[100px] w-full`,
        },
        handleDrop: (_view, event) => {
          if (!imageAllowed || !editor) return false;
          const file = (event as DragEvent).dataTransfer?.files?.[0];
          if (!file || !ALLOWED_TYPES.includes(file.type)) return false;
          event.preventDefault();
          handleImageFile(file, editor);
          return true;
        },
        handlePaste: (_view, event) => {
          if (!imageAllowed) return false;
          const file = event.clipboardData?.files?.[0];
          if (!file || !ALLOWED_TYPES.includes(file.type)) return false;
          event.preventDefault();
          if (editor) handleImageFile(file, editor);
          return true;
        },
      },
      immediatelyRender: false,
      editable: !readOnly,
    });

    useEffect(() => {
      if (!editor || value === undefined) return;
      const current = getEditorMarkdown(editor);
      if (current !== value) {
        editor.commands.setContent(value ?? "");
      }
    }, [editor, value]);

    useEffect(() => {
      editor?.setEditable(!readOnly);
    }, [editor, readOnly]);

    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
      onBlur?.(event);
    };

    return (
      <div
        className={`flex w-full flex-col gap-[1px] rounded-[8px] border transition-all duration-[.4s] ${
          error
            ? "border-[#FDA29B] text-[#F04438]"
            : readOnly
              ? "border-gray-200 bg-gray-50"
              : "border-[#D0D5DD] text-[#667085]"
        }`}
      >
        {!readOnly && (
          <ToolBar
            editor={editor as Editor}
            onImageUpload={imageAllowed ? onImageUpload : undefined}
            variant={richTextProps?.variant ?? "full"}
          />
        )}
        <div
          className="h-fit w-full px-[10px] overflow-y-auto"
          style={{
            ...(richTextProps?.maxHeight ? { maxHeight: richTextProps.maxHeight } : {}),
            ...(richTextProps?.minHeight ? { minHeight: richTextProps.minHeight } : {}),
          }}
        >
          <EditorContent
            ref={ref}
            editor={editor}
            style={{ whiteSpace: "pre-line", width: "100%" }}
            onBlur={handleBlur}
            {...rest}
          />
          {!!error && (
            <Icon
              className="absolute bottom-0 right-[0.875rem] translate-y-[-85%]"
              icon={"hugeicons:information-circle"}
              color="#F04438"
            />
          )}
        </div>
      </div>
    );
  },
);

TipTap.displayName = "TipTap";

export { TipTap };
