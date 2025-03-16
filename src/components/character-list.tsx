"use client";

import { useState, useRef, useEffect } from "react";
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
import { PlusIcon, TrashIcon } from "lucide-react";
import type { CharacterSummary } from "@/data/characters";
import { useRouter, useParams, usePathname } from "next/navigation";
import {
  createCharacterAction,
  deleteCharacterAction,
} from "@/app/actions/character-actions";
import { getInitials } from "@/lib/utils";
type CharacterListProps = {
  characters: CharacterSummary[];
  canManageCharacters: boolean;
};

export function CharacterList({
  characters,
  canManageCharacters,
}: CharacterListProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const currentCharId = params.charId;
  const [newCharacterName, setNewCharacterName] = useState("");
  const createDialogCloseRef = useRef<HTMLButtonElement>(null);
  const deleteDialogCloseRef = useRef<HTMLButtonElement>(null);

  const selectedCharacterData = characters.find(
    (c) => c.id.toString() === currentCharId
  );
  const isCharacterSelected = Boolean(currentCharId);

  // Auto-select first character if none is selected and we're on the main characters page
  useEffect(() => {
    // Only run if we have characters but none is selected in the URL
    // and we're on the main characters page
    if (characters.length > 0 && !currentCharId && pathname === "/characters") {
      // Always navigate to the edit page of the first character
      router.push(`/characters/${characters[0].id}/edit`);
    }
  }, [characters, currentCharId, pathname, router]);

  async function handleCreateCharacter() {
    if (!newCharacterName.trim()) return;

    const result = await createCharacterAction({ name: newCharacterName });

    if (result.success) {
      setNewCharacterName("");
      router.refresh();
      // Close the dialog
      createDialogCloseRef.current?.click();
      // Navigate to the new character's edit page
      router.push(`/characters/${result.data?.id}/edit`);
    } else {
      // TODO: Show error toast
      console.error("Failed to create character:", result.error);
    }
  }

  async function handleDeleteCharacter() {
    if (!currentCharId) return;

    const result = await deleteCharacterAction(Number(currentCharId));

    if (result.success) {
      deleteDialogCloseRef.current?.click();
      router.refresh();
      router.push("/characters");
    } else {
      // TODO: Show error toast
      console.error("Failed to delete character:", result.error);
    }
  }

  return (
    <div className="flex flex-col h-full w-60 border-r">
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
              // Always navigate to edit mode when clicking a character
              onClick={() => router.push(`/characters/${character.id}/edit`)}
            >
              <Avatar>
                <AvatarImage
                  src={character.avatarUrl ?? undefined}
                  alt={character.name}
                />
                <AvatarFallback>{getInitials(character.name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{character.name}</span>
            </div>
          ))}
        </div>
      </ScrollArea>

      {canManageCharacters && (
        <div className="border-t p-2 flex gap-2">
          {/* Add Character Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost-brand" size="sm" className="flex-1">
                <PlusIcon className="h-4 w-4 mr-2" />
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
                <DialogClose ref={createDialogCloseRef} asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleCreateCharacter}
                  variant="brand"
                  disabled={!newCharacterName.trim()}
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
                variant="ghost-danger"
                size="sm"
                className="flex-1"
                disabled={!isCharacterSelected}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
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
                <DialogClose ref={deleteDialogCloseRef} asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <Button
                  variant="danger"
                  onClick={handleDeleteCharacter}
                  disabled={!currentCharId}
                >
                  Remove
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
