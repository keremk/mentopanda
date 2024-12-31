"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModuleCharacter } from "@/data/modules";
import { Plus, Trash2 } from "lucide-react";

type Props = {
  characters: ModuleCharacter[];
  selectedCharacterId?: number;
  onSelectCharacter: (characterId: number) => void;
};

export function CharacterSelect({
  characters,
  selectedCharacterId,
  onSelectCharacter,
}: Props) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium ml-4 my-4">Characters</h3>
      <ScrollArea className="h-[400px] w-full rounded-md border p-4">
        <div className="space-y-4">
          {characters.map((character) => (
            <div
              key={character.id}
              className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-accent ${
                selectedCharacterId === character.id ? "bg-accent" : ""
              }`}
              onClick={() => onSelectCharacter(character.id)}
            >
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={character.avatarUrl || undefined} />
                  <AvatarFallback>{getInitials(character.name)}</AvatarFallback>
                </Avatar>
                <div className="font-medium">{character.name}</div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
        <Button variant="destructive" size="sm" disabled={!selectedCharacterId}>
          <Trash2 className="h-4 w-4 mr-1" />
          Remove
        </Button>
      </div>
    </div>
  );
}
