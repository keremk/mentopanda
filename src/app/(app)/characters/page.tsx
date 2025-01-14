import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Characters Catalog",
};

export default function CharactersPage() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      Select a character to view details
    </div>
  );
}
