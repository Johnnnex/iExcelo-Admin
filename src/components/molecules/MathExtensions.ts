"use client";

import { InlineMath, BlockMath } from "@tiptap/extension-mathematics";

// ─── markdown-it plugin ────────────────────────────────────────────────────
// Converts $...$ → <span data-type="inline-math" data-latex="...">
// Converts $$...$$ → <div data-type="block-math" data-latex="...">
// so tiptap-markdown's DOMParser picks them up via InlineMath/BlockMath parseHTML.

function mathPlugin(md: any) {
  // Block math — must run before inline rules
  md.block.ruler.before(
    "fence",
    "math_block",
    (state: any, start: number, end: number, silent: boolean) => {
      let pos = state.bMarks[start] + state.tShift[start];
      let max = state.eMarks[start];

      if (state.src.slice(pos, pos + 2) !== "$$") return false;
      pos += 2;

      let firstLine = state.src.slice(pos, max).trim();
      if (silent) return true;

      let nextLine = start;
      let found = false;
      let lastPos = 0;

      while (nextLine < end) {
        nextLine++;
        if (nextLine >= end) break;
        pos = state.bMarks[nextLine] + state.tShift[nextLine];
        max = state.eMarks[nextLine];
        if (pos < max && state.sCount[nextLine] < state.blkIndent) break;
        if (state.src.slice(pos, max).trim() === "$$") {
          found = true;
          lastPos = pos;
          break;
        }
      }

      state.line = nextLine + (found ? 1 : 0);

      const token = state.push("math_block", "math", 0);
      token.block = true;
      token.content =
        firstLine +
        (firstLine ? "\n" : "") +
        state.getLines(start + 1, nextLine, state.tShift[start], true);
      token.map = [start, state.line];
      token.markup = "$$";
      return true;
    },
  );

  // Inline math
  md.inline.ruler.after(
    "escape",
    "math_inline",
    (state: any, silent: boolean) => {
      const start = state.pos;
      if (state.src[start] !== "$") return false;
      if (state.src[start + 1] === "$") return false; // let block rule handle $$

      let pos = start + 1;
      while (pos < state.posMax && state.src[pos] !== "$") pos++;
      if (pos >= state.posMax) return false;

      const latex = state.src.slice(start + 1, pos);
      if (!latex.trim()) return false;

      if (!silent) {
        const token = state.push("math_inline", "", 0);
        token.markup = "$";
        token.content = latex;
      }
      state.pos = pos + 1;
      return true;
    },
  );

  // Renderers — output the HTML that InlineMath/BlockMath parseHTML expects
  md.renderer.rules.math_inline = (tokens: any[], idx: number) => {
    const latex = tokens[idx].content
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;");
    return `<span data-type="inline-math" data-latex="${latex}"></span>`;
  };

  md.renderer.rules.math_block = (tokens: any[], idx: number) => {
    const latex = tokens[idx].content
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;");
    return `<div data-type="block-math" data-latex="${latex}"></div>\n`;
  };
}

// ─── Extended InlineMath ───────────────────────────────────────────────────
// Adds storage.markdown so tiptap-markdown can serialize and parse this node.

export const InlineMathMarkdown = InlineMath.extend({
  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(`$${node.attrs.latex}$`);
        },
        parse: {
          // Called once with the markdown-it instance — add all math rules here.
          setup(md: any) {
            md.use(mathPlugin);
          },
        },
      },
    };
  },
});

// ─── Extended BlockMath ────────────────────────────────────────────────────

export const BlockMathMarkdown = BlockMath.extend({
  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.ensureNewLine();
          state.write(`$$\n${node.attrs.latex}\n$$`);
          state.closeBlock(node);
        },
        parse: {
          // math plugin already registered by InlineMathMarkdown above
        },
      },
    };
  },
});
