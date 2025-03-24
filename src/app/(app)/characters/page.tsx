import { Metadata } from "next";
import { getCharactersActionCached } from "@/app/actions/character-actions";

export const metadata: Metadata = {
  title: "Characters Catalog",
};

export default async function CharactersPage() {
  const characters = await getCharactersActionCached();

  if (characters.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Create a character to get started
      </div>
    );
  }

  return null;
}
