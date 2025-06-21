"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { features } from "./features-section";
import { solutions } from "./solution-section";

export function Header() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  type ListItemProps = {
    className?: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick?: () => void;
  } & React.HTMLAttributes<HTMLAnchorElement>;

  const ListItem = ({
    className,
    title,
    description,
    icon,
    onClick,
    ...props
  }: ListItemProps) => {
    const { id, ...anchorProps } = props; // eslint-disable-line @typescript-eslint/no-unused-vars
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer",
              className
            )}
            onClick={onClick}
            {...anchorProps}
          >
            <div className="flex items-center gap-2 mb-1">
              {icon}
              <div className="text-sm font-medium leading-none">{title}</div>
            </div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {description}
            </p>
          </a>
        </NavigationMenuLink>
      </li>
    );
  };

  const MobileNavigation = () => (
    <div className="flex flex-col space-y-6 -mx-6 mt-6">
      <Button
        variant="ghost"
        className="w-full justify-start px-6"
        onClick={() => scrollToSection("features")}
      >
        Features
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start px-6"
        onClick={() => scrollToSection("solutions")}
      >
        Solutions
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start px-6"
        onClick={() => scrollToSection("pricing")}
      >
        Pricing
      </Button>
      <Button variant="ghost" className="w-full justify-start px-6" asChild>
        <Link href="/blog">Blog</Link>
      </Button>
      <div className="px-6 pt-6 border-t">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  return (
    <header className="fixed top-0 w-full bg-background/80 backdrop-blur-sm z-50 border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
          <Image
            src="/panda-light.svg"
            alt="MentoPanda Logo"
            width={32}
            height={32}
            className="w-8 h-auto sm:w-10 sm:h-auto"
            priority
          />
          <span className="font-semibold text-sm sm:text-xl pl-2">
            MentoPanda
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <NavigationMenu className="hidden lg:block">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  onClick={() => scrollToSection("features")}
                >
                  Features
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4">
                    {features.map((feature, index) => (
                      <ListItem
                        key={index}
                        title={feature.title}
                        description={feature.description}
                        icon={feature.icon}
                        onClick={() => scrollToSection("features")}
                      />
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  onClick={() => scrollToSection("solutions")}
                >
                  Solutions
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4">
                    {solutions.map((solution, index) => (
                      <ListItem
                        key={index}
                        title={solution.title}
                        description={solution.description}
                        icon={solution.icon}
                        onClick={() => scrollToSection("solutions")}
                      />
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                  onClick={() => scrollToSection("pricing")}
                >
                  Pricing
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/blog" legacyBehavior passHref>
                  <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                    Blog
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <div className="hidden lg:flex items-center gap-4">
            <ThemeToggle />
            <Button
              className="bg-brand hover:bg-brand-hover text-brand-foreground"
              asChild
            >
              <Link href="/login?mode=signup">Get Started</Link>
            </Button>
          </div>
          <div className="lg:hidden flex items-center gap-2">
            <Button
              size="sm"
              className="bg-brand hover:bg-brand-hover text-brand-foreground px-3 text-sm"
              asChild
            >
              <Link href="/login?mode=signup">Get Started</Link>
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-1">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[220px]">
                <SheetHeader className="mb-2">
                  <SheetTitle className="text-left">MentoPanda</SheetTitle>
                </SheetHeader>
                <MobileNavigation />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
