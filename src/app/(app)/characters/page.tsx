import { Metadata } from "next";
import { getCharactersActionCached } from "@/app/actions/character-actions";
import { getCurrentUserAction } from "@/app/actions/user-actions";

export const metadata: Metadata = {
  title: "Characters Catalog",
};

export default async function CharactersPage() {
  const user = await getCurrentUserAction();
  const characters = await getCharactersActionCached(user.currentProject.id);

  if (characters.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Create a character to get started
      </div>
    );
  }

  return null;
}
