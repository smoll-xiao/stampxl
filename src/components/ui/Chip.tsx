import { type ReactNode } from "react";

export default function Chip({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
      {children}
    </div>
  );
}
