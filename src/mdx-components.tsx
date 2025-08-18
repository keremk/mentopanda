import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { Steps, Step } from "fumadocs-ui/components/steps";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import { FeatureCards } from "@/components/docs/FeatureCards";
import { FeatureTable } from "@/components/docs/FeatureTable";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    Accordion,
    Accordions,
    FeatureCards,
    FeatureTable,
    Steps,
    Step,
    // Override or extend default MDX components
    img: (props: React.ComponentProps<"img">) => (
      <ImageZoom {...(props)} />
    ),
    // Add any additional components you want to use in MDX here
    ...components, // Allow overriding or extending with custom components
  };
}
