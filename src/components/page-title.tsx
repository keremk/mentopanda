"use client";

import { useEffect, useState } from "react";

export function PageTitle() {
  const [title, setTitle] = useState("");

  useEffect(() => {
    // Only access document.title in useEffect (client-side)
    setTitle(document.title);
  }, []);

  return <h1 className="text-lg font-semibold truncate">{title}</h1>;
}
