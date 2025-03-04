"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { updateModuleCharacterPromptAction } from "@/app/actions/modules-characters-actions";
import { ModuleCharacter } from "@/data/modules";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type CharacterPromptContextType = {
  selectedCharacterId: number | undefined;
  characterPrompts: Record<number, string>;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  selectCharacter: (characterId: number | undefined) => void;
  updateCharacterPrompt: (characterId: number, prompt: string) => void;
  initializeCharacters: (characters: ModuleCharacter[]) => void;
  saveCharacterPrompt: (characterId: number) => Promise<boolean>;
};

const CharacterPromptContext = createContext<
  CharacterPromptContextType | undefined
>(undefined);

interface CharacterPromptProviderProps {
  children: ReactNode;
  moduleId: number | undefined;
}

export function CharacterPromptProvider({
  children,
  moduleId,
}: CharacterPromptProviderProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<
    number | undefined
  >();
  const [characterPrompts, setCharacterPrompts] = useState<
    Record<number, string>
  >({});
  const [lastSavedPrompts, setLastSavedPrompts] = useState<
    Record<number, string>
  >({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const debouncedPrompts = useDebounce(characterPrompts, 1000);

  // Extracted common save logic
  const performSave = useCallback(
    async (characterId: number, prompt: string) => {
      if (!moduleId) return false;

      try {
        setSaveStatus("saving");
        await updateModuleCharacterPromptAction({
          moduleId,
          characterId,
          prompt: prompt || null,
        });

        // Update last saved prompt for this character
        setLastSavedPrompts((prev) => ({
          ...prev,
          [characterId]: prompt,
        }));

        setLastSavedAt(new Date());
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
        return true;
      } catch (error) {
        console.error("Error saving character prompt:", error);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
        return false;
      }
    },
    [moduleId]
  );

  // Auto-save when prompts change
  useDebounce(async () => {
    if (!moduleId || saveStatus !== "idle" || !selectedCharacterId) return;

    const current = debouncedPrompts[selectedCharacterId];
    const lastSaved = lastSavedPrompts[selectedCharacterId];

    // Only save if prompt has changed compared to last saved version
    if (current === lastSaved) return;

    await performSave(selectedCharacterId, current || "");
  }, 1500);

  // Reset state when module changes
  useEffect(() => {
    setSelectedCharacterId(undefined);
    setCharacterPrompts({});
    setLastSavedPrompts({});
  }, [moduleId]);

  const selectCharacter = useCallback((characterId: number | undefined) => {
    setSelectedCharacterId(characterId);
  }, []);

  const updateCharacterPrompt = useCallback(
    (characterId: number, prompt: string) => {
      setCharacterPrompts((prev) => ({
        ...prev,
        [characterId]: prompt,
      }));
      setSaveStatus("idle");
    },
    []
  );

  const initializeCharacters = useCallback(
    (characters: ModuleCharacter[]) => {
      const prompts: Record<number, string> = {};

      characters.forEach((char) => {
        prompts[char.id] = char.prompt || "";
      });

      setCharacterPrompts(prompts);
      // Initialize last saved prompts with the same values
      setLastSavedPrompts(structuredClone(prompts));

      // Select first character by default if none selected
      if (!selectedCharacterId && characters.length > 0) {
        setSelectedCharacterId(characters[0].id);
      }
    },
    [selectedCharacterId]
  );

  const saveCharacterPrompt = useCallback(
    async (characterId: number) => {
      return performSave(characterId, characterPrompts[characterId] || "");
    },
    [characterPrompts, performSave]
  );

  return (
    <CharacterPromptContext.Provider
      value={{
        selectedCharacterId,
        characterPrompts,
        saveStatus,
        lastSavedAt,
        selectCharacter,
        updateCharacterPrompt,
        initializeCharacters,
        saveCharacterPrompt,
      }}
    >
      {children}
    </CharacterPromptContext.Provider>
  );
}

export function useCharacterPrompt() {
  const context = useContext(CharacterPromptContext);
  if (!context) {
    throw new Error(
      "useCharacterPrompt must be used within a CharacterPromptProvider"
    );
  }
  return context;
}
