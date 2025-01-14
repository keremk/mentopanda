import { getCharactersAction } from "@/app/actions/character-actions";
import { CharacterList } from "@/components/character-list";

export default async function CharactersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const characters = await getCharactersAction();

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 border-t mt-5">
        <CharacterList characters={characters} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
