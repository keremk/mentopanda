import { getCharactersAction } from "@/app/actions/character-actions";
import { CharacterList } from "@/app/components/characters/character-list";

export default async function CharactersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const characters = await getCharactersAction();

  return (
    <div className="flex h-full">
      <CharacterList characters={characters} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
