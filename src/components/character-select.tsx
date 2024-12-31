"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModuleCharacter } from "@/data/modules";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { getCharactersAction } from "@/app/actions/character-actions";
import { addCharacterToModuleAction } from "@/app/actions/character-actions";
import { removeCharacterFromModuleAction } from "@/app/actions/character-actions";
import { CharacterSummary } from "@/data/characters";

type Props = {
  moduleId: number;
  characters: ModuleCharacter[];
  selectedCharacterId?: number;
  onSelectCharacter: (characterId: number) => void;
  onUpdate: () => void;
};

export function CharacterSelect({
  moduleId,
  characters,
  selectedCharacterId,
  onSelectCharacter,
  onUpdate,
}: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableCharacters, setAvailableCharacters] = useState<
    CharacterSummary[]
  >([]);

  useEffect(() => {
    async function fetchCharacters() {
      const characters = await getCharactersAction();
      setAvailableCharacters(characters);
    }
    fetchCharacters();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleAddCharacter = async (character: CharacterSummary) => {
    await addCharacterToModuleAction({
      moduleId,
      characterId: character.id,
      ordinal: characters.length,
      prompt: null,
    });
    setIsDialogOpen(false);
    onUpdate();
  };

  const handleRemoveCharacter = async () => {
    if (!selectedCharacterId) return;

    await removeCharacterFromModuleAction({
      moduleId,
      characterId: selectedCharacterId,
    });
    onUpdate();
  };

  const selectedCharacter = characters.find(
    (c) => c.id === selectedCharacterId
  );

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Character</DialogTitle>
              <DialogDescription>
                Select a character to add to this module
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[300px] mt-4">
              <div className="space-y-4">
                {availableCharacters
                  .filter(
                    (char) =>
                      !characters.some((existing) => existing.id === char.id)
                  )
                  .map((character) => (
                    <div
                      key={character.id}
                      onClick={() => handleAddCharacter(character)}
                      className="flex items-center space-x-4 p-4 rounded-lg border cursor-pointer hover:bg-accent"
                    >
                      <Avatar>
                        <AvatarImage src={character.avatarUrl || undefined} />
                        <AvatarFallback>
                          {getInitials(character.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{character.name}</div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              disabled={!selectedCharacterId}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Character</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {selectedCharacter?.name} from
                this module? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemoveCharacter}>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
