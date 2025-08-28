import { defineDocs } from 'fumadocs-mdx/config';
import { defineCollections, frontmatterSchema } from "fumadocs-mdx/config";
import { z } from 'zod/v3';

export const docs = defineDocs({
  dir: 'content/docs',
});

export const blogPosts = defineCollections({
  type: "doc",
  dir: "content/blog",
  // add required frontmatter properties
  schema: frontmatterSchema.extend({
    author: z.string(),
    date: z.string().date().or(z.date()),
  }),
});