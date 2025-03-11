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
import { TrainingEdit, UpdateTrainingInput } from "@/data/trainings";
import { updateTrainingAction } from "@/app/actions/trainingActions";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type TrainingDetailsContextType = {
  training: TrainingEdit;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  updateTrainingField: <K extends keyof UpdateTrainingInput>(
    field: K,
    value: UpdateTrainingInput[K]
  ) => void;
  saveTraining: () => Promise<boolean>;
};

const TrainingDetailsContext = createContext<
  TrainingDetailsContextType | undefined
>(undefined);

interface TrainingDetailsProviderProps {
  children: ReactNode;
  initialTraining: TrainingEdit;
}

export function TrainingDetailsProvider({
  children,
  initialTraining,
}: TrainingDetailsProviderProps) {
  const [training, setTraining] = useState<TrainingEdit>(initialTraining);
  const [lastSavedTraining, setLastSavedTraining] = useState<TrainingEdit>(
    structuredClone(initialTraining)
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [userModified, setUserModified] = useState(false);

  const debouncedTraining = useDebounce(training, 1000);

  // Extracted common save logic
  const performSave = useCallback(async (trainingData: TrainingEdit) => {
    try {
      setSaveStatus("saving");
      await updateTrainingAction({
        id: trainingData.id,
        title: trainingData.title,
        tagline: trainingData.tagline,
        description: trainingData.description,
        imageUrl: trainingData.imageUrl,
        previewUrl: trainingData.previewUrl,
      });

      // Update the last saved version with current values using deep clone
      setLastSavedTraining(structuredClone(trainingData));

      setLastSavedAt(new Date());
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      return true;
    } catch (error) {
      console.error("Error saving training:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return false;
    }
  }, []);

  // Auto-save when training changes
  useEffect(() => {
    // Skip if already saving or not user modified
    if (saveStatus !== "idle" || !userModified) return;

    // Only save if something changed compared to last saved version
    if (
      JSON.stringify({
        title: lastSavedTraining.title,
        tagline: lastSavedTraining.tagline,
        description: lastSavedTraining.description,
        imageUrl: lastSavedTraining.imageUrl,
        previewUrl: lastSavedTraining.previewUrl,
      }) ===
      JSON.stringify({
        title: debouncedTraining.title,
        tagline: debouncedTraining.tagline,
        description: debouncedTraining.description,
        imageUrl: debouncedTraining.imageUrl,
        previewUrl: debouncedTraining.previewUrl,
      })
    ) {
      return;
    }

    // Add additional delay after debounce before saving
    const timeoutId = setTimeout(() => {
      performSave(debouncedTraining);
    }, 500); // Additional 500ms delay after debounce

    return () => clearTimeout(timeoutId);
  }, [
    debouncedTraining,
    lastSavedTraining,
    saveStatus,
    performSave,
    userModified,
  ]);

  const updateTrainingField = useCallback(
    <K extends keyof UpdateTrainingInput>(
      field: K,
      value: UpdateTrainingInput[K]
    ) => {
      setTraining((prev) => ({ ...prev, [field]: value }));
      setUserModified(true);
      setSaveStatus("idle");
    },
    []
  );

  const saveTraining = useCallback(async () => {
    return performSave(training);
  }, [training, performSave]);

  return (
    <TrainingDetailsContext.Provider
      value={{
        training,
        saveStatus,
        lastSavedAt,
        updateTrainingField,
        saveTraining,
      }}
    >
      {children}
    </TrainingDetailsContext.Provider>
  );
}

export function useTrainingDetails() {
  const context = useContext(TrainingDetailsContext);
  if (!context) {
    throw new Error(
      "useTrainingDetails must be used within a TrainingDetailsProvider"
    );
  }
  return context;
}
