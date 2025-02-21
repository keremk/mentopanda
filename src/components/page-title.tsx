"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function PageTitle() {
  const pathname = usePathname();
  const [title, setTitle] = useState("");

  useEffect(() => {
    // Only access document.title in useEffect (client-side)
    setTitle(document.title);
  }, [pathname]);

  return <h1 className="text-lg font-semibold truncate">{title}</h1>;
}
