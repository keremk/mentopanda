import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import type { CharacterDetails } from "@/data/characters";

type CharacterDetailsViewProps = {
  character: CharacterDetails;
};

export function CharacterDetailsView({ character }: CharacterDetailsViewProps) {
  return (
    <div className="p-6">
      <div className="flex items-start gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage
            src={character.avatarUrl ?? undefined}
            alt={character.name}
          />
          <AvatarFallback className="text-2xl">
            {character.name[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">{character.name}</h1>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={!character.voice}
            >
              <PlayCircle className="h-4 w-4" />
              Play Voice
            </Button>
          </div>

          {character.description && (
            <p className="text-muted-foreground max-w-2xl">
              {character.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
