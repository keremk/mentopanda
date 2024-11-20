"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Remove NavItem props as we don't need them anymore
const PATH_SEGMENTS_MAP: Record<string, string> = {
  explore: "Explore",
  "[trainingId]": "Training",
  edit: "Edit",
  "[moduleId]": "Module",
  trainings: "Trainings",
};

export function BreadcrumbNav() {
  const pathname = usePathname();

  const generateBreadcrumbs = () => {
    const paths = pathname.replace(/\/$/, "").split("/").filter(Boolean);

    return paths.map((path, index) => {
      const href = "/" + paths.slice(0, index + 1).join("/");
      // Check if the path segment is a number (ID)
      const isNumber = /^\d+$/.test(path);

      // If it's a number, use the previous segment to determine the label
      let label;
      if (isNumber) {
        const previousSegment = paths[index - 1];
        switch (previousSegment) {
          case "explore":
            label = "Training";
            break;
          case "edit":
            label = "Module";
            break;
          case "trainings":
            label = "Training";
            break;
          default:
            label = path;
        }
      } else {
        // Use mapping or fallback to formatted path
        label =
          PATH_SEGMENTS_MAP[path] ||
          path.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      }

      return { href, label };
    });
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <React.Fragment key={crumb.href}>
              <BreadcrumbItem className="hidden md:block">
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
