"use client";

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { TrainingEdit, UpdateTrainingInput } from "@/data/trainings";
import { Module, ModulePrompt, ModuleCharacter } from "@/data/modules";
import { CharacterSummary } from "@/data/characters";
import { useDebounce } from "@/hooks/use-debounce";
import { updateTrainingAction } from "@/app/actions/trainingActions";
import { updateModuleAction } from "@/app/actions/moduleActions";
import { updateModuleCharacterPromptAction } from "@/app/actions/modules-characters-actions";

// --- State Definition ---

type SaveStatus = "idle" | "saving" | "error" | "saved";

type TrainingEditState = {
  training: TrainingEdit;
  selectedModuleId: number | undefined;
  availableCharacters: CharacterSummary[];
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  isSaving: boolean; // Aggregate saving status
  lastSavedState: TrainingEdit | null; // Store the last successfully saved state
  userModified: boolean; // Track if user has made changes since last save/load
};

// --- Action Definitions ---

type TrainingEditAction =
  // Training Actions
  | {
      type: "UPDATE_TRAINING_FIELD";
      payload: {
        field: keyof UpdateTrainingInput;
        value: UpdateTrainingInput[keyof UpdateTrainingInput];
      };
    }
  // Module List Actions
  | { type: "ADD_MODULE"; payload: Module }
  | { type: "DELETE_MODULE"; payload: { moduleId: number } }
  | { type: "REORDER_MODULES"; payload: { modules: Module[] } }
  // Module Selection
  | { type: "SELECT_MODULE"; payload: { moduleId: number | undefined } }
  // Module Detail Actions
  | {
      type: "UPDATE_MODULE_FIELD";
      payload: {
        moduleId: number;
        field: keyof Module;
        value: Module[keyof Module];
      };
    }
  | {
      type: "UPDATE_MODULE_PROMPT_FIELD";
      payload: {
        moduleId: number;
        field: keyof ModulePrompt;
        value: ModulePrompt[keyof ModulePrompt];
      };
    }
  // Module Character Actions
  | {
      type: "SELECT_MODULE_CHARACTER";
      payload: { moduleId: number; character: ModuleCharacter };
    }
  | {
      type: "UPDATE_MODULE_CHARACTER_PROMPT";
      payload: { moduleId: number; characterId: number; prompt: string };
    }
  | {
      type: "REMOVE_MODULE_CHARACTER";
      payload: { moduleId: number; characterId: number };
    }
  // Internal Actions (for saving status)
  | { type: "SAVE_STARTED" }
  | { type: "SAVE_SUCCESS"; payload: { savedState: TrainingEdit } }
  | { type: "SAVE_ERROR" }
  | { type: "RESET_MODIFIED_FLAG" };

// --- Reducer (without Immer) ---

function trainingEditReducer(
  state: TrainingEditState,
  action: TrainingEditAction
): TrainingEditState {
  // Initialize base state properties for the return value
  const baseStateUpdate = {
    userModified: true,
    saveStatus: "idle" as SaveStatus, // Cast for clarity
  };

  switch (action.type) {
    // --- Training ---
    case "UPDATE_TRAINING_FIELD": {
      const { field, value } = action.payload;
      return {
        ...state,
        training: {
          ...state.training,
          [field]: value,
        },
        ...baseStateUpdate,
      };
    }

    // --- Module List ---
    case "ADD_MODULE": {
      const newModules = [...state.training.modules, action.payload];
      const newTrainingState = { ...state.training, modules: newModules };
      return {
        ...state,
        training: newTrainingState,
        selectedModuleId: action.payload.id,
        lastSavedState: structuredClone(newTrainingState),
        lastSavedAt: new Date(),
        isSaving: false,
        saveStatus: "saved",
        userModified: false,
      };
    }
    case "DELETE_MODULE": {
      const { moduleId } = action.payload;
      const remainingModules = state.training.modules.filter(
        (m: Module) => m.id !== moduleId
      );
      const updatedModules = remainingModules.map(
        (m: Module, index: number) => ({
          ...m,
          ordinal: index,
        })
      );
      const newSelectedModuleId =
        state.selectedModuleId === moduleId
          ? updatedModules[0]?.id
          : state.selectedModuleId;
      return {
        ...state,
        training: {
          ...state.training,
          modules: updatedModules,
        },
        selectedModuleId: newSelectedModuleId,
        ...baseStateUpdate,
      };
    }
    case "REORDER_MODULES": {
      const reorderedModules = action.payload.modules.map(
        (m: Module, index: number) => ({ ...m, ordinal: index })
      );
      return {
        ...state,
        training: {
          ...state.training,
          modules: reorderedModules,
        },
        ...baseStateUpdate,
      };
    }
    // --- Module Selection ---
    case "SELECT_MODULE":
      return {
        ...state,
        selectedModuleId: action.payload.moduleId,
        userModified: false, // Reset modified flag
        saveStatus: "idle", // Keep status idle
      };

    // --- Module Details ---
    case "UPDATE_MODULE_FIELD": {
      const { moduleId, field, value } = action.payload;
      const updatedModules = state.training.modules.map((m: Module) => {
        if (m.id === moduleId) {
          return { ...m, [field]: value };
        }
        return m;
      });
      return {
        ...state,
        training: {
          ...state.training,
          modules: updatedModules,
        },
        ...baseStateUpdate,
      };
    }
    case "UPDATE_MODULE_PROMPT_FIELD": {
      const { moduleId, field, value } = action.payload;
      const updatedModules = state.training.modules.map((m: Module) => {
        if (m.id === moduleId) {
          return {
            ...m,
            modulePrompt: {
              ...m.modulePrompt,
              [field]: value,
            },
          };
        }
        return m;
      });
      return {
        ...state,
        training: {
          ...state.training,
          modules: updatedModules,
        },
        ...baseStateUpdate,
      };
    }

    // --- Module Character ---
    case "SELECT_MODULE_CHARACTER": {
      const { moduleId, character } = action.payload;
      const moduleIndex = state.training.modules.findIndex(
        (m) => m.id === moduleId
      );

      if (moduleIndex === -1) return state; // Module not found

      // Get the current prompt from the state *before* updating
      const currentPrompt =
        state.training.modules[moduleIndex].modulePrompt.characters[0]
          ?.prompt || "";

      // Create the new character object, preserving the current prompt
      const characterToStore: ModuleCharacter = {
        ...character, // Spread the incoming character data (id, name, etc.)
        prompt: currentPrompt, // Overwrite with the existing prompt from state
      };

      // Create a new modules array with the updated module
      const updatedModules = [
        ...state.training.modules.slice(0, moduleIndex),
        {
          ...state.training.modules[moduleIndex],
          modulePrompt: {
            ...state.training.modules[moduleIndex].modulePrompt,
            characters: [characterToStore], // Replace with the character preserving the prompt
          },
        },
        ...state.training.modules.slice(moduleIndex + 1),
      ];

      return {
        ...state,
        training: {
          ...state.training,
          modules: updatedModules,
        },
        ...baseStateUpdate, // Apply base updates (userModified=true, etc.)
        // Keep userModified = true because the *selection* changed, even if prompt text looks the same
      };
    }
    case "UPDATE_MODULE_CHARACTER_PROMPT": {
      const { moduleId, characterId, prompt } = action.payload;
      const updatedModules = state.training.modules.map((m: Module) => {
        if (m.id === moduleId) {
          const updatedCharacters = m.modulePrompt.characters.map(
            (c: ModuleCharacter) => {
              if (c.id === characterId) {
                return { ...c, prompt: prompt };
              }
              return c;
            }
          );
          return {
            ...m,
            modulePrompt: {
              ...m.modulePrompt,
              characters: updatedCharacters,
            },
          };
        }
        return m;
      });
      return {
        ...state,
        training: {
          ...state.training,
          modules: updatedModules,
        },
        ...baseStateUpdate,
      };
    }
    case "REMOVE_MODULE_CHARACTER": {
      const { moduleId, characterId } = action.payload;
      const updatedModules = state.training.modules.map((m: Module) => {
        if (m.id === moduleId) {
          const updatedCharacters = m.modulePrompt.characters.filter(
            (c: ModuleCharacter) => c.id !== characterId
          );
          return {
            ...m,
            modulePrompt: {
              ...m.modulePrompt,
              characters: updatedCharacters,
            },
          };
        }
        return m;
      });
      return {
        ...state,
        training: {
          ...state.training,
          modules: updatedModules,
        },
        ...baseStateUpdate,
      };
    }

    // --- Internal Save Status ---
    case "SAVE_STARTED":
      return { ...state, isSaving: true, saveStatus: "saving" };
    case "SAVE_SUCCESS":
      return {
        ...state,
        isSaving: false,
        saveStatus: "saved",
        lastSavedAt: new Date(),
        lastSavedState: action.payload.savedState,
        userModified: false,
      };
    case "SAVE_ERROR":
      return { ...state, isSaving: false, saveStatus: "error" };
    case "RESET_MODIFIED_FLAG":
      return { ...state, userModified: false };

    default:
      return { ...state, userModified: false }; // Return current state, ensure modified is false
  }
}

// --- Context Definition ---

type TrainingEditContextType = {
  state: TrainingEditState;
  dispatch: React.Dispatch<TrainingEditAction>;
  saveNow: () => Promise<boolean>;
  getModuleById: (moduleId: number | undefined) => Module | undefined;
};

const TrainingEditContext = createContext<TrainingEditContextType | undefined>(
  undefined
);

// --- Provider Component ---

interface TrainingEditProviderProps {
  children: ReactNode;
  initialTraining: TrainingEdit;
  initialCharacters: CharacterSummary[];
}

export function TrainingEditProvider({
  children,
  initialTraining,
  initialCharacters,
}: TrainingEditProviderProps) {
  const initialState: TrainingEditState = {
    training: initialTraining,
    selectedModuleId: initialTraining.modules[0]?.id,
    availableCharacters: initialCharacters,
    saveStatus: "idle",
    lastSavedAt: null,
    isSaving: false,
    lastSavedState: structuredClone(initialTraining),
    userModified: false,
  };

  const [state, dispatch] = useReducer(trainingEditReducer, initialState);
  const debouncedTrainingState = useDebounce(state.training, 1500);
  const savePromiseRef = useRef<Promise<unknown> | null>(null);
  // Ref to track the previous debounced state, initialized to undefined
  const prevDebouncedStateRef = useRef<TrainingEdit | undefined>(undefined);

  // --- Auto-Save Logic ---
  const performSave = useCallback(async () => {
    // Prevent concurrent saves
    if (state.isSaving || savePromiseRef.current) {
      console.log("Auto-save skipped: Already saving.");
      return;
    }
    if (!state.userModified || !state.lastSavedState) {
      console.log("Auto-save skipped: No modifications detected.");
      if (state.saveStatus !== "saved") {
        dispatch({ type: "RESET_MODIFIED_FLAG" });
      }
      return;
    }

    dispatch({ type: "SAVE_STARTED" });

    const currentState = state.training;
    const lastSaved = state.lastSavedState;
    const saveOperations: Promise<unknown>[] = [];

    // 1. Check Training Details Changes
    const trainingFields: (keyof UpdateTrainingInput)[] = [
      "title",
      "tagline",
      "description",
      "imageUrl",
      "previewUrl",
    ];
    const trainingChanged = trainingFields.some(
      (field) => currentState[field] !== lastSaved[field]
    );
    if (trainingChanged) {
      console.log("Auto-saving Training Details...");
      saveOperations.push(
        updateTrainingAction({
          id: currentState.id,
          title: currentState.title,
          tagline: currentState.tagline,
          description: currentState.description,
          imageUrl: currentState.imageUrl,
          previewUrl: currentState.previewUrl,
        })
      );
    }

    // 2. Check Module Changes (Updates, Character Prompts)
    currentState.modules.forEach((currentModule) => {
      const lastSavedModule = lastSaved.modules.find(
        (m) => m.id === currentModule.id
      );

      if (!lastSavedModule) {
        console.warn(
          `Module ${currentModule.id} not in last saved state during auto-save.`
        );
        return; // Skip module if it wasn't in the last save (should be handled by ADD)
      }

      // Check module fields
      const moduleFields: (keyof Module)[] = [
        "title",
        "instructions",
        "ordinal",
      ];
      const modulePropsChanged = moduleFields.some(
        (field) => currentModule[field] !== lastSavedModule[field]
      );
      // Check module prompt fields
      const promptFields: (keyof ModulePrompt)[] = ["scenario", "assessment"];
      const modulePromptChanged = promptFields.some(
        (field) =>
          currentModule.modulePrompt[field] !==
          lastSavedModule.modulePrompt[field]
      );

      if (modulePropsChanged || modulePromptChanged) {
        console.log(`Auto-saving Module ${currentModule.id} Details...`);
        saveOperations.push(
          updateModuleAction({
            id: currentModule.id,
            trainingId: currentState.id,
            title: currentModule.title,
            instructions: currentModule.instructions,
            ordinal: currentModule.ordinal,
            modulePrompt: {
              // Pass the whole prompt object, assuming updateModuleAction handles it
              aiModel: currentModule.modulePrompt.aiModel,
              scenario: currentModule.modulePrompt.scenario,
              assessment: currentModule.modulePrompt.assessment,
              moderator: currentModule.modulePrompt.moderator,
              // Pass the full characters array directly
              characters: currentModule.modulePrompt.characters,
            },
          })
        );
      }

      // Check character prompt changes specifically
      const currentCharacter = currentModule.modulePrompt.characters[0];
      const lastSavedCharacter = lastSavedModule.modulePrompt.characters[0];
      if (
        currentCharacter &&
        lastSavedCharacter &&
        currentCharacter.id === lastSavedCharacter.id &&
        currentCharacter.prompt !== lastSavedCharacter.prompt
      ) {
        // Avoid duplicate saves if the entire module was already saved
        if (!modulePropsChanged && !modulePromptChanged) {
          console.log(
            `Auto-saving Character Prompt for Module ${currentModule.id}, Character ${currentCharacter.id}...`
          );
          saveOperations.push(
            updateModuleCharacterPromptAction({
              moduleId: currentModule.id,
              characterId: currentCharacter.id,
              prompt: currentCharacter.prompt || null,
            })
          );
        } else {
          console.log(
            `Skipping separate character prompt save for Module ${currentModule.id} as module update includes it.`
          );
        }
      }
    });

    if (saveOperations.length === 0) {
      console.log("Auto-save: No specific changes detected to save.");
      dispatch({ type: "RESET_MODIFIED_FLAG" });
      return;
    }

    try {
      savePromiseRef.current = Promise.all(saveOperations);
      await savePromiseRef.current;
      console.log("Auto-save successful.");
      dispatch({
        type: "SAVE_SUCCESS",
        payload: { savedState: structuredClone(currentState) },
      });
    } catch (error) {
      console.error("Auto-save failed:", error);
      dispatch({ type: "SAVE_ERROR" });
    } finally {
      savePromiseRef.current = null;
    }
  }, [
    state.training,
    state.lastSavedState,
    state.userModified,
    state.isSaving,
    state.saveStatus,
  ]);

  // Effect to trigger auto-save
  useEffect(() => {
    // Check if the debounced state has actually changed since the last run
    const hasDebouncedStateChanged =
      JSON.stringify(debouncedTrainingState) !==
      JSON.stringify(prevDebouncedStateRef.current);

    // Only proceed if the debounced state changed AND the user has modified
    if (hasDebouncedStateChanged && state.userModified) {
      console.log(
        "Debounced state changed and user modified, triggering auto-save check."
      );
      performSave();
    } else if (hasDebouncedStateChanged) {
      console.log(
        "Debounced state changed, but userModified is false. Skipping save trigger."
      );
    }
    // Update the ref to the current debounced state *after* the check
    prevDebouncedStateRef.current = debouncedTrainingState;

    // Keep dependencies stable, check condition inside
  }, [debouncedTrainingState, state.userModified, performSave]); // Add performSave, userModified back

  // --- Helper Functions ---
  const getModuleById = useCallback(
    (moduleId: number | undefined): Module | undefined => {
      if (!moduleId) return undefined;
      return state.training.modules.find((m) => m.id === moduleId);
    },
    [state.training.modules]
  );

  const saveNow = useCallback(async (): Promise<boolean> => {
    if (savePromiseRef.current) {
      try {
        await savePromiseRef.current;
      } catch {
        // Ignore error from ongoing save; let the new attempt handle it
      }
    }
    if (!state.userModified && !state.isSaving) {
      console.log("SaveNow: No modifications or ongoing save.");
      return true;
    }

    console.log("SaveNow: Performing save...");
    await performSave();

    return savePromiseRef.current === null && state.saveStatus !== "error";
  }, [performSave, state.userModified, state.isSaving, state.saveStatus]);

  // --- Status Reset Effect ---
  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    if (state.saveStatus === "saved" || state.saveStatus === "error") {
      timerId = setTimeout(() => {
        if (state.saveStatus === "saved" || state.saveStatus === "error") {
          dispatch({ type: "RESET_MODIFIED_FLAG" });
        }
      }, 2000);
    }
    return () => clearTimeout(timerId);
  }, [state.saveStatus]);

  return (
    <TrainingEditContext.Provider
      value={{ state, dispatch, saveNow, getModuleById }}
    >
      {children}
    </TrainingEditContext.Provider>
  );
}

// --- Hook ---

export function useTrainingEdit() {
  const context = useContext(TrainingEditContext);
  if (!context) {
    throw new Error(
      "useTrainingEdit must be used within a TrainingEditProvider"
    );
  }
  return context;
}
