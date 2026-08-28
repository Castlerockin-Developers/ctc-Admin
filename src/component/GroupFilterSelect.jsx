import React from "react";

/**
 * Branch / user-group filter used on Dashboard and Analytics.
 */
export default function GroupFilterSelect({ groups, value, onChange, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Filter by user group"
      className={`min-h-[44px] rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-4 py-2.5 text-sm text-white outline-none focus:border-[#A294F9] focus:ring-2 focus:ring-[#A294F9]/30 ${className}`}
    >
      <option value="all">All groups</option>
      {(groups || []).map((g) => (
        <option key={g.id} value={String(g.id)}>
          {g.name}
        </option>
      ))}
    </select>
  );
}
