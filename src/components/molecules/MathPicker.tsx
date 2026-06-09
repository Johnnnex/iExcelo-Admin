"use client";

import { useState, useRef, useEffect } from "react";
import { Editor } from "@tiptap/react";

// Each symbol: what label to show in the grid, and what LaTeX gets inserted at cursor.
// Short snippets are wrapped in $...$. Block math uses $$...$$
type Sym = { label: string; latex: string; block?: boolean };

const SECTIONS: Record<string, Sym[]> = {
  Math: [
    // ── Templates ──────────────────────────────────────────────────
    { label: "a/b",       latex: "\\frac{a}{b}" },
    { label: "√x",        latex: "\\sqrt{x}" },
    { label: "ⁿ√x",       latex: "\\sqrt[n]{x}" },
    { label: "xⁿ",        latex: "x^{n}" },
    { label: "xₙ",        latex: "x_{n}" },
    { label: "nCr",       latex: "\\binom{n}{r}" },
    { label: "|x|",       latex: "|x|" },
    { label: "‖x‖",       latex: "\\|x\\|" },
    // ── Greek ──────────────────────────────────────────────────────
    { label: "α",  latex: "\\alpha" },
    { label: "β",  latex: "\\beta" },
    { label: "γ",  latex: "\\gamma" },
    { label: "Γ",  latex: "\\Gamma" },
    { label: "δ",  latex: "\\delta" },
    { label: "Δ",  latex: "\\Delta" },
    { label: "ε",  latex: "\\epsilon" },
    { label: "η",  latex: "\\eta" },
    { label: "θ",  latex: "\\theta" },
    { label: "Θ",  latex: "\\Theta" },
    { label: "λ",  latex: "\\lambda" },
    { label: "Λ",  latex: "\\Lambda" },
    { label: "μ",  latex: "\\mu" },
    { label: "ν",  latex: "\\nu" },
    { label: "ξ",  latex: "\\xi" },
    { label: "π",  latex: "\\pi" },
    { label: "Π",  latex: "\\Pi" },
    { label: "ρ",  latex: "\\rho" },
    { label: "σ",  latex: "\\sigma" },
    { label: "Σ",  latex: "\\Sigma" },
    { label: "τ",  latex: "\\tau" },
    { label: "φ",  latex: "\\phi" },
    { label: "Φ",  latex: "\\Phi" },
    { label: "χ",  latex: "\\chi" },
    { label: "ψ",  latex: "\\psi" },
    { label: "Ψ",  latex: "\\Psi" },
    { label: "ω",  latex: "\\omega" },
    { label: "Ω",  latex: "\\Omega" },
    // ── Relations ──────────────────────────────────────────────────
    { label: "≤",  latex: "\\leq" },
    { label: "≥",  latex: "\\geq" },
    { label: "≠",  latex: "\\neq" },
    { label: "≈",  latex: "\\approx" },
    { label: "≡",  latex: "\\equiv" },
    { label: "∝",  latex: "\\propto" },
    { label: "~",  latex: "\\sim" },
    { label: "∞",  latex: "\\infty" },
    { label: "±",  latex: "\\pm" },
    { label: "∓",  latex: "\\mp" },
    { label: "×",  latex: "\\times" },
    { label: "÷",  latex: "\\div" },
    { label: "⋅",  latex: "\\cdot" },
    // ── Sets / Logic ───────────────────────────────────────────────
    { label: "∈",  latex: "\\in" },
    { label: "∉",  latex: "\\notin" },
    { label: "⊂",  latex: "\\subset" },
    { label: "⊃",  latex: "\\supset" },
    { label: "⊆",  latex: "\\subseteq" },
    { label: "∪",  latex: "\\cup" },
    { label: "∩",  latex: "\\cap" },
    { label: "∅",  latex: "\\emptyset" },
    { label: "∀",  latex: "\\forall" },
    { label: "∃",  latex: "\\exists" },
    { label: "¬",  latex: "\\neg" },
    { label: "∧",  latex: "\\wedge" },
    { label: "∨",  latex: "\\vee" },
    { label: "ℝ",  latex: "\\mathbb{R}" },
    { label: "ℤ",  latex: "\\mathbb{Z}" },
    { label: "ℕ",  latex: "\\mathbb{N}" },
    { label: "ℂ",  latex: "\\mathbb{C}" },
    // ── Calculus ───────────────────────────────────────────────────
    { label: "∫",        latex: "\\int" },
    { label: "∫ᵃᵇ",     latex: "\\int_{a}^{b}" },
    { label: "∬",        latex: "\\iint" },
    { label: "∮",        latex: "\\oint" },
    { label: "Σᵢ",       latex: "\\sum_{i=1}^{n}" },
    { label: "Πᵢ",       latex: "\\prod_{i=1}^{n}" },
    { label: "lim",       latex: "\\lim_{x \\to \\infty}" },
    { label: "d/dx",      latex: "\\frac{d}{dx}" },
    { label: "∂/∂x",     latex: "\\frac{\\partial}{\\partial x}" },
    { label: "∇",         latex: "\\nabla" },
    { label: "d²/dx²",   latex: "\\frac{d^2}{dx^2}" },
    // ── Trig ───────────────────────────────────────────────────────
    { label: "sin",  latex: "\\sin" },
    { label: "cos",  latex: "\\cos" },
    { label: "tan",  latex: "\\tan" },
    { label: "cot",  latex: "\\cot" },
    { label: "sec",  latex: "\\sec" },
    { label: "csc",  latex: "\\csc" },
    { label: "sin⁻¹", latex: "\\arcsin" },
    { label: "cos⁻¹", latex: "\\arccos" },
    { label: "tan⁻¹", latex: "\\arctan" },
    { label: "sinh",  latex: "\\sinh" },
    { label: "cosh",  latex: "\\cosh" },
    { label: "tanh",  latex: "\\tanh" },
    // ── Misc ───────────────────────────────────────────────────────
    { label: "log",  latex: "\\log" },
    { label: "ln",   latex: "\\ln" },
    { label: "exp",  latex: "\\exp" },
    { label: "max",  latex: "\\max" },
    { label: "min",  latex: "\\min" },
    { label: "⌊x⌋", latex: "\\lfloor x \\rfloor" },
    { label: "⌈x⌉", latex: "\\lceil x \\rceil" },
    { label: "→",   latex: "\\to" },
    { label: "⟹",  latex: "\\Rightarrow" },
    { label: "⟺",  latex: "\\Leftrightarrow" },
    { label: "…",   latex: "\\ldots" },
    { label: "⋮",   latex: "\\vdots" },
    { label: "⋱",   latex: "\\ddots" },
  ],

  Physics: [
    // ── Derivatives / Rate of change ───────────────────────────────
    { label: "dx/dt",     latex: "\\frac{dx}{dt}" },
    { label: "d²x/dt²",  latex: "\\frac{d^2x}{dt^2}" },
    { label: "ẋ",         latex: "\\dot{x}" },
    { label: "ẍ",         latex: "\\ddot{x}" },
    { label: "∂u/∂t",    latex: "\\frac{\\partial u}{\\partial t}" },
    // ── Vectors ────────────────────────────────────────────────────
    { label: "v⃗",  latex: "\\vec{v}" },
    { label: "n̂",  latex: "\\hat{n}" },
    { label: "F",   latex: "\\mathbf{F}" },
    { label: "|F⃗|", latex: "|\\vec{F}|" },
    { label: "A·B", latex: "\\vec{A} \\cdot \\vec{B}" },
    { label: "A×B", latex: "\\vec{A} \\times \\vec{B}" },
    // ── Constants / Special ────────────────────────────────────────
    { label: "ℏ",    latex: "\\hbar" },
    { label: "ħ",    latex: "\\hbar" },
    { label: "c",    latex: "c" },
    { label: "ε₀",  latex: "\\varepsilon_0" },
    { label: "μ₀",  latex: "\\mu_0" },
    { label: "kB",  latex: "k_B" },
    // ── Famous equations ───────────────────────────────────────────
    { label: "E=mc²",    latex: "E = mc^2",          block: false },
    { label: "F=ma",     latex: "F = ma" },
    { label: "KE=½mv²",  latex: "KE = \\frac{1}{2}mv^2" },
    { label: "p=mv",     latex: "p = mv" },
    { label: "W=Fd",     latex: "W = Fd\\cos\\theta" },
    { label: "P=W/t",    latex: "P = \\frac{W}{t}" },
    { label: "E=hf",     latex: "E = hf" },
    { label: "λ=h/p",   latex: "\\lambda = \\frac{h}{p}" },
    { label: "V=IR",     latex: "V = IR" },
    { label: "P=IV",     latex: "P = IV" },
    // ── Notation ───────────────────────────────────────────────────
    { label: "Δx",    latex: "\\Delta x" },
    { label: "Δt",    latex: "\\Delta t" },
    { label: "ΔE",    latex: "\\Delta E" },
    { label: "Δv",    latex: "\\Delta v" },
    { label: "θ",     latex: "\\theta" },
    { label: "ω",     latex: "\\omega" },
    { label: "α",     latex: "\\alpha" },
    { label: "τ",     latex: "\\tau" },
    { label: "ρ",     latex: "\\rho" },
    { label: "Φ",     latex: "\\Phi" },
  ],

  Chemistry: [
    // ── Reaction arrows ────────────────────────────────────────────
    { label: "→",   latex: "\\rightarrow" },
    { label: "←",   latex: "\\leftarrow" },
    { label: "⇌",   latex: "\\rightleftharpoons" },
    { label: "↔",   latex: "\\leftrightarrow" },
    { label: "⟶",  latex: "\\longrightarrow" },
    // ── Charge superscripts ────────────────────────────────────────
    { label: "⁺",    latex: "^{+}" },
    { label: "⁻",    latex: "^{-}" },
    { label: "²⁺",  latex: "^{2+}" },
    { label: "²⁻",  latex: "^{2-}" },
    { label: "³⁺",  latex: "^{3+}" },
    // ── Common subscripts ──────────────────────────────────────────
    { label: "₂",   latex: "_{2}" },
    { label: "₃",   latex: "_{3}" },
    { label: "₄",   latex: "_{4}" },
    // ── Common compounds ───────────────────────────────────────────
    { label: "H₂O",  latex: "\\text{H}_2\\text{O}" },
    { label: "CO₂",  latex: "\\text{CO}_2" },
    { label: "O₂",   latex: "\\text{O}_2" },
    { label: "N₂",   latex: "\\text{N}_2" },
    { label: "NaCl", latex: "\\text{NaCl}" },
    { label: "H₂SO₄",latex: "\\text{H}_2\\text{SO}_4" },
    { label: "HCl",  latex: "\\text{HCl}" },
    { label: "NaOH", latex: "\\text{NaOH}" },
    // ── Thermodynamics ─────────────────────────────────────────────
    { label: "ΔH",   latex: "\\Delta H" },
    { label: "ΔG",   latex: "\\Delta G" },
    { label: "ΔS",   latex: "\\Delta S" },
    { label: "Keq",  latex: "K_{eq}" },
    { label: "Ksp",  latex: "K_{sp}" },
    { label: "Ka",   latex: "K_a" },
    { label: "Kb",   latex: "K_b" },
    { label: "Kw",   latex: "K_w" },
    // ── Concentration / Acid-base ──────────────────────────────────
    { label: "pH",   latex: "\\text{pH} = -\\log[\\text{H}^+]" },
    { label: "[A]",  latex: "[\\text{A}]" },
    { label: "mol/L",latex: "\\text{mol/L}" },
    // ── Orbital / electron notation ────────────────────────────────
    { label: "1s²",  latex: "1s^2" },
    { label: "2p⁶",  latex: "2p^6" },
    { label: "n,l,m",latex: "n, l, m_l, m_s" },
    { label: "λ",    latex: "\\lambda" },
    { label: "ν",    latex: "\\nu" },
  ],
};

interface MathPickerProps {
  editor: Editor;
}

export function MathPicker({ editor }: MathPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<keyof typeof SECTIONS>("Math");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const insert = (sym: Sym) => {
    const wrapped = sym.block ? `$$\n${sym.latex}\n$$` : `$${sym.latex}$`;
    editor.chain().focus().insertContent(wrapped).run();
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title="Insert math / science symbol"
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        className={`flex h-[32px] min-w-[32px] px-1.5 items-center justify-center rounded-[6px] transition-all duration-[.4s] font-mono text-sm font-semibold ${
          open ? "bg-[#007fff10] text-[#007fff]" : "bg-white text-[#98A2B3] hover:text-[#007fff]"
        }`}
      >
        fx
      </button>

      {open && (
        <div
          className="absolute left-0 top-[36px] z-[9999] w-[320px] rounded-[8px] border border-[#EAECF0] bg-white shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08)]"
          style={{ maxHeight: "360px", display: "flex", flexDirection: "column" }}
        >
          {/* Tabs */}
          <div className="flex border-b border-[#EAECF0] px-2 pt-2 gap-1 shrink-0">
            {(Object.keys(SECTIONS) as (keyof typeof SECTIONS)[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-[4px] transition-colors ${
                  tab === t
                    ? "bg-white text-[#007FFF] border border-b-white border-[#EAECF0] -mb-px"
                    : "text-[#667085] hover:text-[#344054]"
                }`}
              >
                {t}
              </button>
            ))}
            <p className="ml-auto self-center text-[10px] text-[#98A2B3] pr-1">
              click to insert
            </p>
          </div>

          {/* Symbol grid */}
          <div className="overflow-y-auto p-2 grid grid-cols-6 gap-1">
            {SECTIONS[tab].map((sym, i) => (
              <button
                key={`${tab}-${i}`}
                type="button"
                title={`$${sym.latex}$`}
                onClick={() => insert(sym)}
                className="h-9 flex items-center justify-center rounded-[4px] text-sm font-medium text-[#344054] bg-[#F9FAFB] hover:bg-[#DBEDFF] hover:text-[#007FFF] transition-colors overflow-hidden px-0.5 leading-none"
              >
                {sym.label}
              </button>
            ))}
          </div>

          {/* Hint */}
          <div className="border-t border-[#F0F2F5] px-3 py-1.5 text-[10px] text-[#98A2B3] shrink-0">
            Tip: type <code className="bg-[#F9FAFB] px-0.5 rounded">$...$</code> for inline math,{" "}
            <code className="bg-[#F9FAFB] px-0.5 rounded">$$...$$</code> for block
          </div>
        </div>
      )}
    </div>
  );
}
