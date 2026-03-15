import React, { useRef, useState, useCallback } from "react";
import { useBrand } from "./BrandTheme";

interface EditableTextProps {
  value: string;
  placeholder?: string;
  onSave: (value: string) => void;
  as?: "h1" | "h3" | "p" | "span" | "div";
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
}

/**
 * Inline-editable text that clears placeholder on focus,
 * shows a subtle editing indicator, and restores default if left empty.
 * Supports multiline editing (Enter creates new lines) when multiline=true or as="p"/"div".
 */
export function EditableText({
  value,
  placeholder,
  onSave,
  as: Tag = "p",
  className = "",
  style,
  multiline,
}: EditableTextProps) {
  const brand = useBrand();
  const ref = useRef<HTMLElement>(null);
  const [editing, setEditing] = useState(false);
  const isPlaceholder = !value || value === placeholder;

  // Default multiline for block elements
  const isMultiline = multiline ?? (Tag === "p" || Tag === "div");

  const handleFocus = useCallback(() => {
    setEditing(true);
    const el = ref.current;
    if (!el) return;
    if (isPlaceholder) {
      el.innerHTML = "";
    }
    const range = document.createRange();
    const sel = window.getSelection();
    if (sel && el.childNodes.length > 0) {
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [isPlaceholder]);

  const getTextFromHtml = (el: HTMLElement): string => {
    // Convert <br> and block elements to newlines, then get text
    const clone = el.cloneNode(true) as HTMLElement;
    // Replace <br> with newline markers
    clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    // Replace block-level divs/p with newline + text
    clone.querySelectorAll('div, p').forEach(block => {
      block.prepend(document.createTextNode('\n'));
    });
    return (clone.textContent || "").trim();
  };

  const handleBlur = useCallback(() => {
    setEditing(false);
    const el = ref.current;
    if (!el) return;
    const newText = getTextFromHtml(el);
    if (newText && newText !== value) {
      onSave(newText);
    } else if (!newText) {
      el.textContent = placeholder || value;
    }
  }, [value, placeholder, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isMultiline) {
        // Allow default behavior (inserts <br> or <div>)
        return;
      }
      // Single-line: save on Enter
      e.preventDefault();
      ref.current?.blur();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      const el = ref.current;
      if (el) {
        el.textContent = value || placeholder || "";
      }
      setEditing(false);
      ref.current?.blur();
    }
  }, [isMultiline, value, placeholder]);

  // Render value with newlines as <br> elements
  const renderContent = () => {
    const text = value || placeholder || "";
    if (!text.includes('\n')) return text;
    return text.split('\n').map((line, i, arr) => (
      <React.Fragment key={i}>
        {line}
        {i < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <Tag
      ref={ref as any}
      className={`outline-none cursor-text transition-all duration-200 ${
        editing
          ? "ring-2 ring-offset-2 rounded-md"
          : "hover:ring-1 hover:ring-offset-1 hover:rounded-md"
      } ${isPlaceholder && !editing ? "opacity-40 italic" : ""} ${className}`}
      style={{
        ...style,
        whiteSpace: isMultiline ? 'pre-wrap' : undefined,
        ...(editing
          ? { ["--tw-ring-color" as any]: `${brand.primaryColor}55`, ["--tw-ring-offset-color" as any]: "white" }
          : { ["--tw-ring-color" as any]: `${brand.primaryColor}30`, ["--tw-ring-offset-color" as any]: "white" }),
      }}
      contentEditable
      suppressContentEditableWarning
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      {renderContent()}
    </Tag>
  );
}
