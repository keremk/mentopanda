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
import { LayoutGrid, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";

const features = [
  {
    title: "Task Automation",
    description: "Automate repetitive tasks and save time.",
    icon: <LayoutGrid className="w-5 h-5" />,
  },
  {
    title: "Workflow Optimization",
    description: "Optimize your processes with AI-driven insights.",
    icon: <Workflow className="w-5 h-5" />,
  },
];

const solutions = [
  {
    title: "AI-Powered Automation",
    description: "Streamline your workflow with intelligent automation.",
    icon: <LayoutGrid className="w-5 h-5" />,
  },
  {
    title: "Intelligent Scheduling",
    description: "AI-powered scheduling for maximum efficiency.",
    icon: <Workflow className="w-5 h-5" />,
  },
];

export function Header() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const ListItem = ({ className, title, description, icon, ...props }: any) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className
            )}
            {...props}
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

  return (
    <header className="fixed top-0 w-full bg-background/80 backdrop-blur-sm z-50 border-b px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/panda-light.svg"
            alt="MentoPanda Logo"
            width={40}
            height={40}
            className=""
          />
          <span className="font-semibold text-xl">MentoPanda</span>
        </Link>
        <div className="flex items-center gap-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Features</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4">
                    {features.map((feature, index) => (
                      <ListItem key={index} {...feature} />
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4">
                    {solutions.map((solution, index) => (
                      <ListItem key={index} {...solution} />
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
          <ThemeToggle />
          <Button variant="outline" asChild>
            <Link href="/login?mode=signin">Login</Link>
          </Button>
          <Button className="bg-red-500 hover:bg-red-600" asChild>
            <Link href="/login?mode=signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
