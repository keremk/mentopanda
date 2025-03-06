"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  updateModuleCharacterPromptAction,
  replaceModuleCharacterAction,
} from "@/app/actions/modules-characters-actions";
import { ModuleCharacter } from "@/data/modules";
import { CharacterSummary } from "@/data/characters";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type CharacterPromptContextType = {
  selectedCharacterId: number | undefined;
  characterPrompt: string;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  selectCharacter: (characterId: number) => Promise<void>;
  updateCharacterPrompt: (prompt: string) => void;
  initializeCharacter: (character: ModuleCharacter | null) => void;
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
  const [characterId, setCharacterId] = useState<number | undefined>(undefined);
  const [prompt, setPrompt] = useState("");
  const [lastSavedPrompt, setLastSavedPrompt] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Track if the prompt was modified by the user
  const [userModified, setUserModified] = useState(false);

  // Track the previous module ID to detect module changes
  const prevModuleIdRef = useRef<number | undefined>(moduleId);

  const debouncedPrompt = useDebounce(prompt, 1000);

  // Save prompt to the server
  const savePrompt = useCallback(
    async (textToSave: string) => {
      if (!moduleId || !characterId) return;

      try {
        setSaveStatus("saving");
        await updateModuleCharacterPromptAction({
          moduleId,
          characterId,
          prompt: textToSave || null,
        });

        setLastSavedPrompt(textToSave);
        setLastSavedAt(new Date());
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Error saving character prompt:", error);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    },
    [moduleId, characterId]
  );

  // Auto-save when prompt changes (debounced)
  useEffect(() => {
    // Only save if:
    // 1. We have a character ID
    // 2. The prompt has changed from what was last saved
    // 3. The user has actually modified the prompt (not just module selection)
    if (!characterId || debouncedPrompt === lastSavedPrompt || !userModified)
      return;

    savePrompt(debouncedPrompt);
  }, [debouncedPrompt, lastSavedPrompt, characterId, savePrompt, userModified]);

  // Reset state when module changes
  useEffect(() => {
    // Check if the module ID has actually changed
    if (moduleId !== prevModuleIdRef.current) {
      setCharacterId(undefined);
      setPrompt("");
      setLastSavedPrompt("");
      setUserModified(false);
      prevModuleIdRef.current = moduleId;
    }
  }, [moduleId]);

  // Select a character - immediately replace if there was a previous character
  const selectCharacter = useCallback(
    async (newCharacterId: number) => {
      if (!moduleId) return;

      // If we already have a character, replace it
      if (characterId) {
        try {
          setSaveStatus("saving");
          await replaceModuleCharacterAction({
            moduleId,
            oldCharacterId: characterId,
            newCharacterId,
          });

          // Update state for the new character but keep the current prompt
          setCharacterId(newCharacterId);
          // Don't reset the prompt - keep the current one
          // Don't reset the userModified flag either

          // Refresh module data
          refreshModule?.();

          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch (error) {
          console.error("Error replacing character:", error);
          setSaveStatus("error");
          setTimeout(() => setSaveStatus("idle"), 3000);
        }
      } else {
        // Just set the character ID if there was no previous character
        setCharacterId(newCharacterId);
        // Don't reset the prompt here either
      }
    },
    [moduleId, characterId, refreshModule]
  );

  // Update prompt text
  const updateCharacterPrompt = useCallback((newPrompt: string) => {
    setPrompt(newPrompt);
    setUserModified(true); // Mark that the user has modified the prompt
  }, []);

  // Initialize with existing character data
  const initializeCharacter = useCallback(
    (character: ModuleCharacter | null) => {
      if (!character) {
        setCharacterId(undefined);
        setPrompt("");
        setLastSavedPrompt("");
        setUserModified(false);
        return;
      }

      setCharacterId(character.id);
      setPrompt(character.prompt || "");
      setLastSavedPrompt(character.prompt || "");
      setUserModified(false); // Reset the user modified flag when initializing
    },
    []
  );

  return (
    <CharacterPromptContext.Provider
      value={{
        selectedCharacterId: characterId,
        characterPrompt: prompt,
        saveStatus,
        lastSavedAt,
        selectCharacter,
        updateCharacterPrompt,
        initializeCharacter,
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
