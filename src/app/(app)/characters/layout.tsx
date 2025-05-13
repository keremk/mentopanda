import { getCharactersActionCached } from "@/app/actions/character-actions";
import { getCurrentUserAction } from "@/app/actions/user-actions";
import { CharacterList } from "@/components/character-list";

export default async function CharactersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserAction();
  const [characters] = await Promise.all([
    getCharactersActionCached(user.currentProject.id),
  ]);

  const canManageCharacters = user.permissions.includes("training.manage");

  return (
    <div className="flex flex-col h-full py-2">
      <div className="flex flex-1 border-t">
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
