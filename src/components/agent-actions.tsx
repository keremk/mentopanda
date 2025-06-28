"use client";

import React from "react";

export function AgentActions() {
  const actions = [
    "Created the new module",
    "Created the character",
    "Configured the mentor agent",
    "Generated the training outline",
    "Saved progress",
  ];

  return (
    <div className="w-full max-h-48 overflow-y-auto border rounded-md p-2 bg-muted/40">
      <ul className="space-y-1">
        {actions.map((action, idx) => (
          <li key={idx} className="text-sm leading-tight">
            • {action}
          </li>
        ))}
      </ul>
    </div>
  );
}
