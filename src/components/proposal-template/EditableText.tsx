import React, { useRef, useState, useCallback } from "react";
import { useBrand } from "./BrandTheme";

interface EditableTextProps {
  value: string;
  placeholder?: string;
  onSave: (value: string) => void;
  as?: "h1" | "h3" | "p" | "span";
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Inline-editable text that clears placeholder on focus,
 * shows a subtle editing indicator, and restores default if left empty.
 */
export function EditableText({
  value,
  placeholder,
  onSave,
  as: Tag = "p",
  className = "",
  style,
}: EditableTextProps) {
  const brand = useBrand();
  const ref = useRef<HTMLElement>(null);
  const [editing, setEditing] = useState(false);
  const isPlaceholder = !value || value === placeholder;

  const handleFocus = useCallback(() => {
    setEditing(true);
    const el = ref.current;
    if (!el) return;
    // If showing placeholder/default text, clear it for a fresh start
    if (isPlaceholder) {
      el.textContent = "";
    }
    // Select all existing text so user can type over it easily
    const range = document.createRange();
    const sel = window.getSelection();
    if (sel && el.childNodes.length > 0) {
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [isPlaceholder]);

  const handleBlur = useCallback(() => {
    setEditing(false);
    const el = ref.current;
    if (!el) return;
    const newText = (el.textContent || "").trim();
    if (newText && newText !== value) {
      onSave(newText);
    } else if (!newText) {
      // Restore placeholder display
      el.textContent = placeholder || value;
    }
  }, [value, placeholder, onSave]);

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
        ...(editing
          ? { ["--tw-ring-color" as any]: `${brand.primaryColor}55`, ["--tw-ring-offset-color" as any]: "white" }
          : { ["--tw-ring-color" as any]: `${brand.primaryColor}30`, ["--tw-ring-offset-color" as any]: "white" }),
      }}
      contentEditable
      suppressContentEditableWarning
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {value || placeholder}
    </Tag>
  );
}
