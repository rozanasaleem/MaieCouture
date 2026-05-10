"use client";

import { useState } from "react";
import { ModalShell } from "@/components/modal-shell";

const rows = [
  { label: "XS", bust: "80-84", waist: "60-64", hips: "86-90" },
  { label: "S", bust: "84-88", waist: "64-68", hips: "90-94" },
  { label: "M", bust: "88-92", waist: "68-72", hips: "94-98" },
  { label: "L", bust: "92-97", waist: "72-77", hips: "98-103" },
  { label: "XL", bust: "97-103", waist: "77-83", hips: "103-109" },
];

export function SizeGuideLightbox() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs tracking-[0.18em] uppercase text-[--ink] underline underline-offset-4"
      >
        Size Guide
      </button>

      <ModalShell open={open} onClose={() => setOpen(false)} title="Size Guide">
        <p className="mb-5 text-sm text-[--muted]">
          Body measurements in centimeters. If between sizes, choose the larger size
          for a softer couture fit.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-[11px] tracking-[0.18em] uppercase text-[--muted]">
                <th className="border-b border-[--line] px-3 py-3">Size</th>
                <th className="border-b border-[--line] px-3 py-3">Bust</th>
                <th className="border-b border-[--line] px-3 py-3">Waist</th>
                <th className="border-b border-[--line] px-3 py-3">Hips</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="border-b border-[--line] px-3 py-3 font-medium text-[--ink]">
                    {row.label}
                  </td>
                  <td className="border-b border-[--line] px-3 py-3 text-[--muted]">
                    {row.bust}
                  </td>
                  <td className="border-b border-[--line] px-3 py-3 text-[--muted]">
                    {row.waist}
                  </td>
                  <td className="border-b border-[--line] px-3 py-3 text-[--muted]">
                    {row.hips}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-[--muted]">
          Need help choosing size? Book a consultation for personalized fit guidance.
        </p>
      </ModalShell>
    </>
  );
}
