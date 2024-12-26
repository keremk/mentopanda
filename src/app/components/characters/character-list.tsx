import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CharacterSummary } from "@/data/characters";

type CharacterListProps = {
  characters: CharacterSummary[];
};

export function CharacterList({ characters }: CharacterListProps) {
  return (
    <ScrollArea className="h-[calc(100vh-4rem)] w-80 border-r">
      <div className="space-y-1 p-2">
        {characters.map((character) => (
          <div
            key={character.id}
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent cursor-pointer"
          >
            <Avatar>
              <AvatarImage src={character.avatarUrl ?? undefined} alt={character.name} />
              <AvatarFallback>{character.name[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{character.name}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
} 