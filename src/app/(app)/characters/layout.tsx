import { getCharactersAction } from "@/app/actions/character-actions";
import { getCurrentUserAction } from "@/app/actions/user-actions";
import { CharacterList } from "@/components/character-list";

export default async function CharactersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [characters, user] = await Promise.all([
    getCharactersAction(),
    getCurrentUserAction(),
  ]);

  const canManageCharacters = user.permissions.includes("training.manage");

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 border-t mt-5">
        <CharacterList
          key={canManageCharacters ? "manager" : "viewer"}
          characters={characters}
          canManageCharacters={canManageCharacters}
        />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
