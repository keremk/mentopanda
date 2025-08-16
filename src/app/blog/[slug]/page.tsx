import { notFound } from "next/navigation";
import Link from "next/link";
import { InlineTOC } from "fumadocs-ui/components/inline-toc";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { blog } from "@/lib/source";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const page = blog.getPage([params.slug]);
  if (!page) notFound();
  return {
    title: page.data.title,
    description: page.data.description,
  };
}

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const page = blog.getPage([params.slug]);

  if (!page) notFound();
  const Mdx = page.data.body;
  const author = page.data.author ? String(page.data.author) : null;
  const date = page.data.date ? String(page.data.date) : null;

  return (
    <main className="container max-w-4xl py-12">
      <div className="mb-8">
        <Link 
          href="/blog" 
          className="text-fd-muted-foreground hover:text-fd-foreground mb-4 inline-flex items-center gap-2 text-sm transition-colors"
        >
          ← Back to Blog
        </Link>
        <h1 className="mb-4 text-4xl font-bold tracking-tight">{page.data.title}</h1>
        {page.data.description && (
          <p className="text-lg text-fd-muted-foreground mb-6">{page.data.description}</p>
        )}
        
        {(author || date) && (
          <div className="flex flex-wrap gap-4 text-sm text-fd-muted-foreground mb-8 pb-8 border-b">
            {author && (
              <div className="flex items-center gap-1">
                <span>By</span>
                <span className="font-medium text-fd-foreground">{author}</span>
              </div>
            )}
            {date && (
              <time dateTime={date} className="flex items-center gap-1">
                <span>Published</span>
                <span className="font-medium text-fd-foreground">
                  {new Date(date).toLocaleDateString()}
                </span>
              </time>
            )}
          </div>
        )}
      </div>
      
      <article className="prose prose-lg max-w-none">
        <InlineTOC items={page.data.toc} />
        <Mdx components={defaultMdxComponents} />
      </article>
    </main>
  );
}

export function generateStaticParams(): { slug: string }[] {
  return blog.getPages().map((page) => ({
    slug: page.slugs[0],
  }));
}
