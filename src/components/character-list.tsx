"use client";

import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2 } from "lucide-react";
import type { CharacterSummary } from "@/data/characters";
import { useRouter, useParams } from "next/navigation";

type CharacterListProps = {
  characters: CharacterSummary[];
};

export function CharacterList({ characters }: CharacterListProps) {
  const router = useRouter();
  const params = useParams();
  const currentCharId = params.charId;
  const [newCharacterName, setNewCharacterName] = useState("");

  const selectedCharacterData = characters.find(
    (c) => c.id.toString() === currentCharId
  );
  const isCharacterSelected = Boolean(currentCharId);

  console.log({
    currentCharId,
    characterIds: characters.map((c) => c.id),
    selectedCharacterData,
    match: characters.find((c) => c.id.toString() === currentCharId)?.id,
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-60 border-r">
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {characters.map((character) => (
            <div
              key={character.id}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                character.id.toString() === currentCharId
                  ? "bg-muted"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => router.push(`/characters/${character.id}`)}
            >
              <Avatar>
                <AvatarImage
                  src={character.avatarUrl ?? undefined}
                  alt={character.name}
                />
                <AvatarFallback>
                  {character.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{character.name}</span>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t p-2 flex gap-2">
        {/* Add Character Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Character</DialogTitle>
              <DialogDescription>
                Enter the name for your new character.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={newCharacterName}
              onChange={(e) => setNewCharacterName(e.target.value)}
              placeholder="Character name"
              className="my-4"
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                onClick={() => {
                  // TODO: Implement character creation
                  setNewCharacterName("");
                }}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Character Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={!isCharacterSelected}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Character</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {selectedCharacterData?.name}?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={() => {
                  // TODO: Implement character removal
                  router.push("/characters");
                }}
              >
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}