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
import { CharacterSummary, CharacterDetails } from "@/data/characters";
import { useDebounce } from "@/hooks/use-debounce";
import { updateTrainingAction } from "@/app/actions/trainingActions";
import {
  updateModuleAction,
  createModuleAction,
  deleteModuleAction,
} from "@/app/actions/moduleActions";
import {
  updateModuleCharacterPromptAction,
  insertModuleCharacterAction,
} from "@/app/actions/modules-characters-actions";
import {
  createCharacterAction,
  updateCharacterAction,
} from "@/app/actions/character-actions";
import { AI_MODELS } from "@/types/models";
import { logger } from "@/lib/logger";
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
  | { type: "ADD_MODULE_SUCCESS"; payload: { module: Module } }
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
  // New Action: For setting character after creation and insertion
  | {
      type: "SET_MODULE_CHARACTER_AFTER_CREATION";
      payload: { moduleId: number; character: CharacterDetails };
    }
  // New Action: For updating specific character fields (name, avatar, voice, AI model)
  | {
      type: "UPDATE_MODULE_CHARACTER_FIELD";
      payload: {
        moduleId: number;
        characterId: number;
        field: keyof Pick<
          ModuleCharacter,
          "name" | "avatarUrl" | "voice" | "aiModel"
        >;
        value: ModuleCharacter[keyof Pick<
          ModuleCharacter,
          "name" | "avatarUrl" | "voice" | "aiModel"
        >];
      };
    }
  // Internal Actions (for saving status)
  | { type: "SAVE_STARTED" }
  | { type: "SAVE_SUCCESS" }
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
    case "ADD_MODULE_SUCCESS": {
      const { module: newModule } = action.payload;
      const newModules = [...state.training.modules, newModule];
      const newTrainingState = { ...state.training, modules: newModules };
      return {
        ...state,
        training: newTrainingState,
        lastSavedState: newTrainingState,
        selectedModuleId: newModule.id,
        userModified: false,
        saveStatus: "saved",
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
        userModified: true,
        saveStatus: "idle",
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
        userModified: false,
        saveStatus: "idle",
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
        ...baseStateUpdate,
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

    // New Reducer Case: SET_MODULE_CHARACTER_AFTER_CREATION
    case "SET_MODULE_CHARACTER_AFTER_CREATION": {
      const { moduleId, character } = action.payload;
      const moduleIndex = state.training.modules.findIndex(
        (m) => m.id === moduleId
      );
      if (moduleIndex === -1) {
        logger.error(
          `[Reducer SET_MODULE_CHARACTER_AFTER_CREATION] Module ${moduleId} not found.`
        );
        return state;
      }

      const newModuleCharacter: ModuleCharacter = {
        ...character, // Spread full CharacterDetails
        prompt: "", // Initialize with an empty prompt
        ordinal: 0, // Only one character per module now
      };

      const updatedModules = [...state.training.modules];
      updatedModules[moduleIndex] = {
        ...updatedModules[moduleIndex],
        modulePrompt: {
          ...updatedModules[moduleIndex].modulePrompt,
          characters: [newModuleCharacter],
        },
      };

      return {
        ...state,
        training: {
          ...state.training,
          modules: updatedModules,
        },
        ...baseStateUpdate,
      };
    }

    // New Reducer Case: UPDATE_MODULE_CHARACTER_FIELD
    case "UPDATE_MODULE_CHARACTER_FIELD": {
      const { moduleId, characterId, field, value } = action.payload;
      const updatedModules = state.training.modules.map((m: Module) => {
        if (m.id === moduleId) {
          const updatedCharacters = m.modulePrompt.characters.map(
            (c: ModuleCharacter) => {
              if (c.id === characterId) {
                // Ensure we're creating a new object for the character
                return { ...c, [field]: value };
              }
              return c;
            }
          );
          // Ensure we're creating a new object for the modulePrompt and module
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
        lastSavedState: structuredClone(state.training),
        userModified: false,
      };
    case "SAVE_ERROR":
      return { ...state, isSaving: false, saveStatus: "error" };
    case "RESET_MODIFIED_FLAG":
      if (state.isSaving || state.saveStatus === "error") return state;
      return { ...state, userModified: false, saveStatus: "idle" };

    default:
      return state;
  }
}

// --- Context Definition ---

type TrainingEditContextType = {
  state: TrainingEditState;
  dispatch: React.Dispatch<TrainingEditAction>;
  saveNow: () => Promise<boolean>;
  getModuleById: (moduleId: number | undefined) => Module | undefined;
  addModule: (title: string) => Promise<void>;
  deleteModule: (moduleId: number) => Promise<void>;
  createAndAssignCharacterToModule: (
    moduleId: number,
    initialName: string
  ) => Promise<CharacterDetails>;
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
  const prevDebouncedStateRef = useRef<TrainingEdit | undefined>(undefined);

  // --- Add Module Logic ---
  const addModule = useCallback(
    async (title: string): Promise<void> => {
      const currentTraining = state.training;
      if (!currentTraining) {
        logger.error("Cannot add module: training data not loaded.");
        throw new Error("Training data not available.");
      }
      try {
        const newModule = await createModuleAction(currentTraining.id, {
          title: title,
          instructions: "",
          ordinal: currentTraining.modules.length,
          modulePrompt: {
            aiModel: AI_MODELS.OPENAI,
            scenario: "",
            assessment: "",
            moderator: "",
            prepCoach: "",
            characters: [],
          },
        });
        dispatch({
          type: "ADD_MODULE_SUCCESS",
          payload: { module: newModule },
        });
      } catch (error) {
        logger.error(`Failed to add module: ${error}`);
        throw error;
      }
    },
    [state.training, dispatch]
  );

  // --- Delete Module Logic ---
  const deleteModule = useCallback(
    async (moduleId: number): Promise<void> => {
      const currentTraining = state.training;
      if (!currentTraining) {
        logger.error("Cannot delete module: training data not loaded.");
        throw new Error("Training data not available.");
      }

      try {
        // Delete the module from the database (this now handles character and storage cleanup)
        await deleteModuleAction(moduleId, currentTraining.id);

        // Update local state by dispatching the action
        dispatch({ type: "DELETE_MODULE", payload: { moduleId } });
      } catch (error) {
        logger.error(`Failed to delete module ${moduleId}: ${error}`);
        throw error; // Re-throw the error to be caught by the caller in EditModules.tsx
      }
    },
    [state.training, dispatch]
  );

  // --- New: Create and Assign Character to Module ---
  const createAndAssignCharacterToModule = useCallback(
    async (
      moduleId: number,
      initialName: string
    ): Promise<CharacterDetails> => {
      if (!state.training) {
        logger.error(
          "Cannot create character: training data not loaded in context."
        );
        throw new Error("Training data not available.");
      }
      try {
        // 1. Create the character
        const creationResult = await createCharacterAction({
          name: initialName,
        });

        if (!creationResult.success || !creationResult.data) {
          const errorMessage =
            creationResult.error || "Failed to create character";
          logger.error(errorMessage);
          throw new Error(errorMessage);
        }
        const newCharacter = creationResult.data;

        // 2. Insert the character into the module (link them)
        const insertionResult = await insertModuleCharacterAction({
          moduleId: moduleId,
          characterId: newCharacter.id,
        });

        if (!insertionResult.success) {
          const errorMessage =
            insertionResult.error ||
            `Failed to link character ${newCharacter.id} to module ${moduleId}`;
          logger.error(errorMessage);
          throw new Error(errorMessage);
        }

        // 3. Update local state
        dispatch({
          type: "SET_MODULE_CHARACTER_AFTER_CREATION",
          payload: { moduleId, character: newCharacter },
        });

        logger.debug(
          `Character ${newCharacter.id} created and assigned to module ${moduleId}`
        );
        return newCharacter;
      } catch (error) {
        if (
          !(
            error instanceof Error &&
            (error.message.includes("Failed to create character") ||
              error.message.includes("Failed to link character"))
          )
        ) {
          logger.error(
            `Unexpected error in createAndAssignCharacterToModule for module ${moduleId}: ${error}`
          );
        }
        throw error;
      }
    },
    [state.training, dispatch]
  );

  // --- Auto-Save Logic ---
  const performSave = useCallback(async () => {
    if (state.isSaving || savePromiseRef.current) {
      logger.debug("Auto-save skipped: Already saving.");
      return;
    }
    if (!state.userModified || !state.lastSavedState) {
      logger.debug(
        "Auto-save skipped: No modifications detected since last save."
      );
      if (state.saveStatus !== "saved") {
        dispatch({ type: "RESET_MODIFIED_FLAG" });
      }
      return;
    }

    dispatch({ type: "SAVE_STARTED" });

    const currentState = state.training;
    const lastSaved = state.lastSavedState
      ? structuredClone(state.lastSavedState)
      : null;

    if (!lastSaved) {
      logger.error("Auto-save error: Last saved state is missing.");
      dispatch({ type: "SAVE_ERROR" });
      return;
    }

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
    const lastSavedModuleIds = new Set(lastSaved.modules.map((m) => m.id));

    currentState.modules.forEach((currentModule) => {
      const lastSavedModule = lastSaved.modules.find(
        (m) => m.id === currentModule.id
      );

      if (!lastSavedModuleIds.has(currentModule.id)) {
        logger.debug(
          `Module ${currentModule.id} identified as potentially new or modified shortly after add.`
        );
      }

      if (lastSavedModule) {
        const moduleFields: (keyof Module)[] = [
          "title",
          "instructions",
          "ordinal",
        ];
        const modulePropsChanged = moduleFields.some(
          (field) => currentModule[field] !== lastSavedModule[field]
        );

        const promptFields: (keyof ModulePrompt)[] = [
          "aiModel",
          "scenario",
          "assessment",
          "moderator",
          "prepCoach",
        ];
        const modulePromptBaseChanged = promptFields.some(
          (field) =>
            currentModule.modulePrompt[field] !==
            lastSavedModule.modulePrompt[field]
        );

        const currentCharacter = currentModule.modulePrompt.characters[0];
        const lastSavedCharacter = lastSavedModule.modulePrompt.characters[0];

        // Check for character detail changes (name, avatar, voice, aiModel)
        let characterDetailsChanged = false;
        if (currentCharacter && lastSavedCharacter) {
          const detailsFields: (keyof Pick<
            ModuleCharacter,
            "name" | "avatarUrl" | "voice" | "aiModel"
          >)[] = ["name", "avatarUrl", "voice", "aiModel"];
          characterDetailsChanged = detailsFields.some(
            (field) => currentCharacter[field] !== lastSavedCharacter[field]
          );
        } else if (currentCharacter && !lastSavedCharacter) {
          // Character was added
          characterDetailsChanged = true;
        }

        // Check for character prompt change
        let characterPromptChanged = false;
        if (
          currentCharacter &&
          lastSavedCharacter &&
          currentCharacter.prompt !== lastSavedCharacter.prompt
        ) {
          characterPromptChanged = true;
        } else if (
          currentCharacter &&
          !lastSavedCharacter &&
          currentCharacter.prompt // New character with a prompt
        ) {
          characterPromptChanged = true;
        }

        // If any part of the module or its prompt/character changed, determine the correct action
        if (
          modulePropsChanged ||
          modulePromptBaseChanged ||
          characterDetailsChanged ||
          characterPromptChanged
        ) {
          // If module properties or base prompt properties changed, use the main update action
          if (modulePropsChanged || modulePromptBaseChanged) {
            logger.debug(
              `Auto-saving Module ${currentModule.id} Details (Props or Base Prompt change detected)...`
            );
            saveOperations.push(
              updateModuleAction({
                id: currentModule.id,
                trainingId: currentState.id,
                title: currentModule.title,
                instructions: currentModule.instructions,
                ordinal: currentModule.ordinal,
                modulePrompt: {
                  aiModel: currentModule.modulePrompt.aiModel,
                  scenario: currentModule.modulePrompt.scenario,
                  assessment: currentModule.modulePrompt.assessment,
                  moderator: currentModule.modulePrompt.moderator,
                  prepCoach: currentModule.modulePrompt.prepCoach,
                  // Send the current character array - updateModuleAction MUST handle this
                  characters: currentModule.modulePrompt.characters,
                },
              })
            );
          }
          // If ONLY the character details (name, avatar, voice, aiModel) changed
          if (characterDetailsChanged && currentCharacter) {
            logger.debug(
              `Auto-saving Character Details for Module ${currentModule.id}, Character ${currentCharacter.id}...`
            );
            saveOperations.push(
              updateCharacterAction(currentCharacter.id, {
                name: currentCharacter.name,
                avatarUrl: currentCharacter.avatarUrl,
                voice: currentCharacter.voice,
                aiModel: currentCharacter.aiModel,
                // aiDescription and description are not managed here directly
                // Pass them as undefined if not changing, or ensure action handles partial updates.
                // Assuming updateCharacterAction can handle partial updates if some fields are undefined.
              })
            );
          }

          // If ONLY the character prompt changed
          if (
            characterPromptChanged &&
            !characterDetailsChanged &&
            currentCharacter
          ) {
            logger.debug(
              `Auto-saving Character Prompt for Module ${currentModule.id}, Character ${currentCharacter.id}...`
            );
            saveOperations.push(
              updateModuleCharacterPromptAction({
                moduleId: currentModule.id,
                characterId: currentCharacter.id,
                prompt: currentCharacter.prompt || null,
              })
            );
          }
        }
      } else if (lastSavedModuleIds.has(currentModule.id)) {
        logger.warn(
          `Module ${currentModule.id} found in current state but not in lastSavedState array. Attempting save.`
        );
        saveOperations.push(
          updateModuleAction({
            id: currentModule.id,
            trainingId: currentState.id,
            title: currentModule.title,
            instructions: currentModule.instructions,
            ordinal: currentModule.ordinal,
            modulePrompt: currentModule.modulePrompt,
          })
        );
      }
    });

    if (saveOperations.length === 0 && state.userModified) {
      logger.debug(
        "Auto-save: No specific property changes detected, but userModified was true (likely due to add/delete/reorder). Finalizing save state."
      );
      dispatch({
        type: "SAVE_SUCCESS",
      });
      return;
    } else if (saveOperations.length === 0 && !state.userModified) {
      logger.debug(
        "Auto-save: No specific changes detected and userModified is false."
      );
      dispatch({ type: "RESET_MODIFIED_FLAG" });
      return;
    }

    try {
      savePromiseRef.current = Promise.all(saveOperations);
      await savePromiseRef.current;
      logger.debug("Auto-save successful for detected changes.");
      dispatch({
        type: "SAVE_SUCCESS",
      });
    } catch (error) {
      logger.error(`Auto-save failed: ${error}`);
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
    const hasDebouncedStateChanged =
      JSON.stringify(debouncedTrainingState) !==
      JSON.stringify(prevDebouncedStateRef.current);

    if (hasDebouncedStateChanged && state.userModified) {
      logger.debug(
        "Debounced state changed and user modified, triggering auto-save check."
      );
      performSave();
    } else if (hasDebouncedStateChanged) {
      logger.debug(
        "Debounced state changed, but userModified is false. Skipping save trigger."
      );
    }
    prevDebouncedStateRef.current = debouncedTrainingState;
  }, [debouncedTrainingState, state.userModified, performSave]);

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
        logger.debug("SaveNow: Waiting for ongoing auto-save...");
        await savePromiseRef.current;
        logger.debug("SaveNow: Ongoing auto-save finished.");
      } catch (e) {
        logger.error(`SaveNow: Ongoing auto-save finished with error. ${e}`);
      }
    }
    if (
      !state.userModified &&
      !state.isSaving &&
      state.saveStatus !== "error"
    ) {
      logger.debug(
        "SaveNow: No modifications or ongoing save, and no error state."
      );
      return true;
    }

    logger.debug("SaveNow: Performing explicit save...");
    await performSave();

    const success = !savePromiseRef.current && state.saveStatus !== "error";
    logger.debug(
      `SaveNow finished. Success: ${success}, Status: ${state.saveStatus}`
    );
    return success;
  }, [performSave, state.userModified, state.isSaving, state.saveStatus]);

  // --- Status Reset Effect ---
  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    if (state.saveStatus === "saved" || state.saveStatus === "error") {
      timerId = setTimeout(() => {
        if (state.saveStatus === "saved" || state.saveStatus === "error") {
          dispatch({ type: "RESET_MODIFIED_FLAG" });
        }
      }, 3000);
    }
    return () => clearTimeout(timerId);
  }, [state.saveStatus]);

  return (
    <TrainingEditContext.Provider
      value={{
        state,
        dispatch,
        saveNow,
        getModuleById,
        addModule,
        deleteModule,
        createAndAssignCharacterToModule,
      }}
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
