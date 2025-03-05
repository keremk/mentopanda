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
import {
  updateModuleCharacterPromptAction,
  replaceModuleCharacterAction,
} from "@/app/actions/modules-characters-actions";
import { ModuleCharacter } from "@/data/modules";
import { CharacterSummary } from "@/data/characters";

type SaveStatus = "idle" | "saving" | "saved" | "error";

// Simplified state structure
type CharacterState = {
  characterId: number | null;
  prompt: string;
  lastSavedPrompt: string;
};

type CharacterPromptContextType = {
  selectedCharacterId: number | undefined;
  characterPrompt: string;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  selectCharacter: (characterId: number | undefined) => void;
  updateCharacterPrompt: (prompt: string) => void;
  initializeCharacter: (character: ModuleCharacter | null) => void;
  saveCharacterPrompt: () => Promise<boolean>;
  replaceCharacter: (newCharacterId: number) => Promise<void>;
  characters: CharacterSummary[];
};

const CharacterPromptContext = createContext<
  CharacterPromptContextType | undefined
>(undefined);

interface CharacterPromptProviderProps {
  children: ReactNode;
  moduleId: number | undefined;
  characters: CharacterSummary[];
  refreshModule?: () => void;
}

export function CharacterPromptProvider({
  children,
  moduleId,
  characters,
  refreshModule,
}: CharacterPromptProviderProps) {
  // Simplified state - only tracking the current character for the module
  const [characterState, setCharacterState] = useState<CharacterState>({
    characterId: null,
    prompt: "",
    lastSavedPrompt: "",
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Add a flag to track if changes were made by the user
  const [userModified, setUserModified] = useState(false);

  const debouncedPrompt = useDebounce(characterState.prompt, 1000);

  // Extracted common save logic
  const performSave = useCallback(
    async (prompt: string) => {
      if (!moduleId || !characterState.characterId) return false;

      try {
        setSaveStatus("saving");
        await updateModuleCharacterPromptAction({
          moduleId,
          characterId: characterState.characterId,
          prompt: prompt || null,
        });

        // Update last saved prompt
        setCharacterState((prev) => ({
          ...prev,
          lastSavedPrompt: prompt,
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
    [moduleId, characterState.characterId]
  );

  // Auto-save when prompt changes
  useEffect(() => {
    if (
      !moduleId ||
      saveStatus !== "idle" ||
      !characterState.characterId ||
      !userModified
    )
      return;

    // Only save if prompt has changed compared to last saved version
    if (debouncedPrompt === characterState.lastSavedPrompt) return;

    const timeoutId = setTimeout(() => {
      performSave(debouncedPrompt);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [
    debouncedPrompt,
    characterState.lastSavedPrompt,
    characterState.characterId,
    moduleId,
    saveStatus,
    performSave,
    userModified,
  ]);

  // Reset state when module changes
  useEffect(() => {
    setCharacterState({
      characterId: null,
      prompt: "",
      lastSavedPrompt: "",
    });
    setUserModified(false);
  }, [moduleId]);

  const selectCharacter = useCallback(
    (characterId: number | undefined) => {
      if (!characterId) {
        setCharacterState({
          characterId: null,
          prompt: "",
          lastSavedPrompt: "",
        });
        return;
      }

      // Keep the existing prompt if we're just selecting the same character
      if (characterId === characterState.characterId) return;

      // Otherwise reset the prompt for the new character
      setCharacterState({
        characterId,
        prompt: "",
        lastSavedPrompt: "",
      });

      // Reset the user modified flag when selecting a new character
      setUserModified(false);
    },
    [characterState.characterId]
  );

  const updateCharacterPrompt = useCallback((prompt: string) => {
    setCharacterState((prev) => ({
      ...prev,
      prompt,
    }));

    // Set the user modified flag when the prompt is updated
    setUserModified(true);
    setSaveStatus("idle");
  }, []);

  const initializeCharacter = useCallback(
    (character: ModuleCharacter | null) => {
      if (!character) {
        setCharacterState({
          characterId: null,
          prompt: "",
          lastSavedPrompt: "",
        });
        return;
      }

      setCharacterState({
        characterId: character.id,
        prompt: character.prompt || "",
        lastSavedPrompt: character.prompt || "",
      });

      // Reset the user modified flag when initializing a character
      setUserModified(false);
    },
    []
  );

  const saveCharacterPrompt = useCallback(async () => {
    if (!characterState.characterId) return false;
    return performSave(characterState.prompt);
  }, [characterState, performSave]);

  const replaceCharacter = useCallback(
    async (newCharacterId: number) => {
      if (!moduleId || !characterState.characterId) return;

      try {
        setSaveStatus("saving");
        await replaceModuleCharacterAction({
          moduleId,
          oldCharacterId: characterState.characterId,
          newCharacterId,
        });

        // Update state to reflect the new character
        setCharacterState({
          characterId: newCharacterId,
          prompt: "", // Reset prompt for new character
          lastSavedPrompt: "",
        });

        // Refresh module data
        refreshModule?.();

        setLastSavedAt(new Date());
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Error replacing character:", error);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    },
    [moduleId, characterState.characterId, refreshModule]
  );

  return (
    <CharacterPromptContext.Provider
      value={{
        selectedCharacterId: characterState.characterId || undefined,
        characterPrompt: characterState.prompt,
        saveStatus,
        lastSavedAt,
        selectCharacter,
        updateCharacterPrompt,
        initializeCharacter,
        saveCharacterPrompt,
        replaceCharacter,
        characters,
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
