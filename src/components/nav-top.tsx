"use client";

import * as React from "react";
import Image from "next/image";
import { useSidebar } from "@/components/ui/sidebar";

export function NavTop({ title }: { title: string }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="w-full px-2 pb-5">
      <div
        className={`flex w-full items-center transition-all duration-300 ease-in-out ${
          isCollapsed ? "justify-center" : ""
        }`}
      >
        <div
          className={`flex aspect-square size-12 items-center justify-center rounded-lg bg-sidebar-secondary text-sidebar-primary-foreground transition-transform duration-300 ease-in-out ${
            isCollapsed ? "transform translate-x-[calc(50%-1.12rem)]" : ""
          }`}
        >
          <Image
            src="/panda-light.svg"
            alt="MentoPanda Logo"
            width={32}
            height={32}
            className="w-10 h-auto"
          />
        </div>
        <div
          className={`grid flex-1 text-left text-lg leading-tight ml-3 transition-all duration-300 ease-in-out ${
            isCollapsed ? "opacity-0 w-0 ml-0" : "opacity-100"
          }`}
        >
          <span className="truncate font-semibold">{title}</span>
        </div>
      </div>
    </div>
  );
}
