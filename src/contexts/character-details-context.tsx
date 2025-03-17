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
import { CharacterDetails, UpdateCharacterInput } from "@/data/characters";
import { updateCharacterAction } from "@/app/actions/character-actions";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type CharacterDetailsContextType = {
  character: CharacterDetails;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  updateCharacterField: <K extends keyof UpdateCharacterInput>(
    field: K,
    value: UpdateCharacterInput[K]
  ) => void;
  saveCharacter: () => Promise<boolean>;
};

const CharacterDetailsContext = createContext<
  CharacterDetailsContextType | undefined
>(undefined);

interface CharacterDetailsProviderProps {
  children: ReactNode;
  initialCharacter: CharacterDetails;
}

export function CharacterDetailsProvider({
  children,
  initialCharacter,
}: CharacterDetailsProviderProps) {
  const [character, setCharacter] =
    useState<CharacterDetails>(initialCharacter);
  const [lastSavedCharacter, setLastSavedCharacter] =
    useState<CharacterDetails>(structuredClone(initialCharacter));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [userModified, setUserModified] = useState(false);

  const debouncedCharacter = useDebounce(character, 1000);

  // Extracted common save logic
  const performSave = useCallback(async (characterData: CharacterDetails) => {
    try {
      setSaveStatus("saving");
      await updateCharacterAction(characterData.id, {
        name: characterData.name,
        voice: characterData.voice || null,
        aiModel: characterData.aiModel,
        aiDescription: characterData.aiDescription || "",
        description: characterData.description || "",
      });

      // Update the last saved version with current values using deep clone
      setLastSavedCharacter(structuredClone(characterData));

      setLastSavedAt(new Date());
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      return true;
    } catch (error) {
      console.error("Error saving character:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return false;
    }
  }, []);

  // Auto-save when character changes
  useEffect(() => {
    // Skip if already saving or not user modified
    if (saveStatus !== "idle" || !userModified) return;

    const hasChanges =
      JSON.stringify({
        name: lastSavedCharacter.name,
        voice: lastSavedCharacter.voice,
        aiModel: lastSavedCharacter.aiModel,
        aiDescription: lastSavedCharacter.aiDescription,
        description: lastSavedCharacter.description,
      }) !==
      JSON.stringify({
        name: debouncedCharacter.name,
        voice: debouncedCharacter.voice,
        aiModel: debouncedCharacter.aiModel,
        aiDescription: debouncedCharacter.aiDescription,
        description: debouncedCharacter.description,
      });

    if (hasChanges) {
      // Add additional delay after debounce
      const timeoutId = setTimeout(() => {
        performSave(debouncedCharacter);
      }, 500); // Additional 500ms delay after debounce

      return () => clearTimeout(timeoutId);
    }
  }, [
    debouncedCharacter,
    lastSavedCharacter,
    saveStatus,
    performSave,
    userModified,
  ]);

  const updateCharacterField = useCallback(
    <K extends keyof UpdateCharacterInput>(
      field: K,
      value: UpdateCharacterInput[K]
    ) => {
      setCharacter((prev) => ({ ...prev, [field]: value }));
      setUserModified(true);
      setSaveStatus("idle");
    },
    []
  );

  const saveCharacter = useCallback(async () => {
    return performSave(character);
  }, [character, performSave]);

  return (
    <CharacterDetailsContext.Provider
      value={{
        character,
        saveStatus,
        lastSavedAt,
        updateCharacterField,
        saveCharacter,
      }}
    >
      {children}
    </CharacterDetailsContext.Provider>
  );
}

export function useCharacterDetails() {
  const context = useContext(CharacterDetailsContext);
  if (!context) {
    throw new Error(
      "useCharacterDetails must be used within a CharacterDetailsProvider"
    );
  }
  return context;
}
