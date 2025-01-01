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
      <div className="w-full py-4 px-6 border-b">
        <h1 className="text-2xl font-bold">Characters Catalog</h1>
      </div>
      <div className="flex flex-1">
        <CharacterList characters={characters} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
