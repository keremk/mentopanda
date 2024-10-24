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
import type { NavItem } from "@/types/nav";

interface BreadcrumbNavProps {
  navItems: NavItem[];
}

export function BreadcrumbNav({ navItems }: BreadcrumbNavProps) {
  const pathname = usePathname();

  // Function to find the current active items in the navigation
  const findActivePath = () => {
    // Find the main nav item that matches the current path
    const mainItem = navItems.find((item) => {
      if (item.url === pathname) return true;
      if (item.items) {
        return item.items.some((subItem) => subItem.url === pathname);
      }
      return false;
    });

    if (!mainItem) return [];

    // If it's a main item without subitems, return just that
    if (mainItem.url === pathname) {
      return [mainItem];
    }

    // If it has subitems, find the active subitem
    const subItem = mainItem.items?.find((item) => item.url === pathname);
    if (subItem) {
      return [mainItem, subItem];
    }

    return [mainItem];
  };

  const activePath = findActivePath();

  if (activePath.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {activePath.map((item, index) => {
          const isLast = index === activePath.length - 1;
          return (
            <React.Fragment key={item.title}>
              <BreadcrumbItem className="hidden md:block">
                {isLast ? (
                  <BreadcrumbPage>{item.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.url}>{item.title}</BreadcrumbLink>
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
