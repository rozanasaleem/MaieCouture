"use client";

import { ReactNode, useEffect } from "react";

type ModalShellProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidthClassName?: string;
  closeLabel?: string;
};

export function ModalShell({
  open,
  onClose,
  title,
  children,
  maxWidthClassName = "max-w-2xl",
  closeLabel = "Close",
}: ModalShellProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 px-4 py-8 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidthClassName} rounded-[1.5rem] border border-[--line] bg-white p-6 shadow-[0_30px_90px_rgba(0,0,0,0.2)] sm:p-8`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-[family-name:var(--font-display)] text-3xl text-[--ink]">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[--line] px-3 py-1 text-xs tracking-[0.16em] uppercase text-[--muted] transition hover:bg-[--stone]"
            >
              {closeLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[--line] text-base leading-none text-[--muted] transition hover:bg-[--stone]"
            >
              ×
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
