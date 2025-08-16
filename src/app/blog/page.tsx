import Link from "next/link";
import { blog } from "@/lib/source";

export default function Home() {
  const posts = blog.getPages();

  return (
    <main className="container max-w-6xl py-12 lg:py-16">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Latest Blog Posts
        </h1>
        <p className="text-lg text-fd-muted-foreground max-w-2xl mx-auto">
          Discover insights, tutorials, and updates from our team
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const author = post.data.author ? String(post.data.author) : null;
          const date = post.data.date ? String(post.data.date) : null;
          
          return (
            <article key={post.url} className="group">
              <Link
                href={post.url}
                className="block rounded-xl border bg-fd-card p-6 transition-all hover:bg-fd-accent/50 hover:shadow-lg"
              >
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold group-hover:text-fd-primary transition-colors">
                    {post.data.title}
                  </h2>
                  <p className="text-fd-muted-foreground line-clamp-3">
                    {post.data.description}
                  </p>
                  {(author || date) && (
                    <div className="flex items-center justify-between text-sm text-fd-muted-foreground">
                      {author ? (
                        <span>By {author}</span>
                      ) : (
                        <span></span>
                      )}
                      {date && (
                        <time dateTime={date}>
                          {new Date(date).toLocaleDateString()}
                        </time>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            </article>
          );
        })}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-fd-muted-foreground">No blog posts found.</p>
        </div>
      )}
    </main>
  );
}
