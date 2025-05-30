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
import { logger } from "@/lib/logger";

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const createDialogCloseRef = useRef<HTMLButtonElement>(null);
  const deleteDialogCloseRef = useRef<HTMLButtonElement>(null);
  const hasRedirectedRef = useRef(false);

  // Keyboard shortcut for collapsing/expanding the list (MOVED TO FIRST EFFECT)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.altKey &&
        (event.key === "b" || event.key === "B" || event.code === "KeyB")
      ) {
        event.preventDefault();
        setIsCollapsed((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // Dependency array is empty, runs once on mount

  const selectedCharacterData = characters.find(
    (c) => c.id.toString() === currentCharId
  );
  const isCharacterSelected = Boolean(currentCharId);

  // Auto-select first character if none is selected and we're on the main characters page
  useEffect(() => {
    if (
      characters.length > 0 &&
      !currentCharId &&
      pathname === "/characters" &&
      !hasRedirectedRef.current
    ) {
      hasRedirectedRef.current = true;
      router.replace(`/characters/${characters[0].id}`);
    }
  }, [characters, currentCharId, pathname, router]);

  // Reset the redirect flag when navigating away from characters page
  useEffect(() => {
    if (pathname !== "/characters") {
      hasRedirectedRef.current = false;
    }
  }, [pathname]);

  async function handleCreateCharacter() {
    if (!newCharacterName.trim()) return;

    const result = await createCharacterAction({ name: newCharacterName });

    if (result.success) {
      setNewCharacterName("");
      // Close the dialog
      createDialogCloseRef.current?.click();
      // Navigate to the new character's edit page
      router.push(`/characters/${result.data?.id}`);
    } else {
      // TODO: Show error toast
      logger.error("Failed to create character:", result.error);
    }
  }

  async function handleDeleteCharacter() {
    if (!currentCharId) return;

    const result = await deleteCharacterAction(Number(currentCharId));

    if (result.success) {
      deleteDialogCloseRef.current?.click();
      // Use replace instead of push to avoid adding to history stack
      router.replace("/characters");
    } else {
      // TODO: Show error toast
      logger.error("Failed to delete character:", result.error);
    }
  }

  return (
    <div
      className={`flex flex-col h-full border-r transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-24" : "w-60"
      }`}
    >
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {characters.map((character) => (
            <div
              key={character.id}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                character.id.toString() === currentCharId
                  ? "bg-muted"
                  : "hover:bg-muted/50"
              } ${isCollapsed ? "justify-center" : ""}`}
              // Use replace instead of push to avoid adding to history stack
              onClick={() => {
                router.replace(`/characters/${character.id}`);
              }}
              title={isCollapsed ? character.name : undefined}
            >
              <Avatar>
                <AvatarImage
                  src={character.avatarUrl ?? undefined}
                  alt={character.name}
                />
                <AvatarFallback>{getInitials(character.name)}</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <span className="text-sm font-medium truncate">
                  {character.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {canManageCharacters && (
        <div
          className={`border-t p-2 flex gap-2 justify-center ${
            isCollapsed ? "" : ""
          }`}
        >
          {/* Add Character Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost-brand"
                size={isCollapsed ? "icon" : "sm"}
                className={isCollapsed ? "" : "flex-1"}
                title={isCollapsed ? "Add Character" : undefined}
              >
                <PlusIcon className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">Add</span>}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCharacterName.trim()) {
                    handleCreateCharacter();
                  }
                }}
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
                size={isCollapsed ? "icon" : "sm"}
                className={isCollapsed ? "" : "flex-1"}
                disabled={!isCharacterSelected}
                title={isCollapsed ? "Remove Character" : undefined}
              >
                <TrashIcon className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">Remove</span>}
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
