"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  renderTrigger?: (props: { label: string; isOpen: boolean }) => ReactNode;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className = "",
  renderTrigger,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation (for remote control)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        if (isOpen) {
          onChange(options[highlightedIndex].value);
          setIsOpen(false);
        } else {
          setIsOpen(true);
        }
        e.preventDefault();
        break;
      case "ArrowUp":
        if (isOpen) {
          setHighlightedIndex((i) => (i > 0 ? i - 1 : options.length - 1));
        }
        e.preventDefault();
        break;
      case "ArrowDown":
        if (isOpen) {
          setHighlightedIndex((i) => (i < options.length - 1 ? i + 1 : 0));
        }
        e.preventDefault();
        break;
      case "Escape":
        setIsOpen(false);
        e.preventDefault();
        break;
    }
  };

  // Methods for remote control
  const open = () => !disabled && setIsOpen(true);
  const close = () => setIsOpen(false);
  const moveUp = () => setHighlightedIndex((i) => (i > 0 ? i - 1 : options.length - 1));
  const moveDown = () => setHighlightedIndex((i) => (i < options.length - 1 ? i + 1 : 0));
  const confirm = () => {
    if (isOpen) {
      onChange(options[highlightedIndex].value);
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      data-dropdown-open={isOpen}
      data-dropdown-methods={JSON.stringify({ open, close, moveUp, moveDown, confirm })}
    >
      {/* Trigger */}
      {renderTrigger ? (
        <div onClick={() => !disabled && setIsOpen(!isOpen)}>
          {renderTrigger({ label: displayLabel, isOpen })}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            flex items-center justify-between gap-2
            px-3 py-2
            min-w-[140px]
            bg-black/60 backdrop-blur-sm
            border border-white/20
            rounded-[var(--radius-lg)]
            text-sm text-white
            transition-all duration-[var(--duration-fast)]
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-black/70 cursor-pointer"}
          `}
        >
          <span className="truncate">{displayLabel}</span>
          <svg
            className={`w-4 h-4 transition-transform duration-[var(--duration-fast)] ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}

      {/* Options */}
      {isOpen && (
        <div
          className={`
            absolute top-full left-0 right-0 mt-1
            bg-[var(--color-surface-elevated)]
            border border-white/20
            rounded-[var(--radius-lg)]
            shadow-xl
            overflow-hidden
            z-[var(--z-floating)]
            dialog-enter
          `}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`
                w-full px-3 py-2
                text-sm text-left
                transition-colors duration-[var(--duration-fast)]
                ${
                  index === highlightedIndex
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-white/80 hover:bg-white/10"
                }
                ${option.value === value ? "font-medium" : ""}
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
