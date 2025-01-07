"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Training, UpdateTrainingInput } from "@/data/trainings";
import { updateTrainingAction } from "@/app/(app)/trainingActions";
import {
  createModuleAction,
  deleteModuleAction,
} from "@/app/(app)/moduleActions";
import { PlusIcon, TrashIcon, PencilIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MarkdownEditor } from "@/components/markdown-editor";
import { deleteTrainingAction } from "@/app/(app)/trainingActions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { ImageUploadButton } from "@/components/image-upload-button";
import { AI_MODELS } from "@/types/models";

type Props = {
  training: Training;
};

export function EditTrainingForm({ training }: Props) {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [formData, setFormData] = useState<UpdateTrainingInput>({
    id: training.id,
    title: training.title,
    tagline: training.tagline,
    description: training.description,
    imageUrl: training.imageUrl,
    previewUrl: training.previewUrl,
    isPublic: training.isPublic,
  });

  const debouncedFormData = useDebounce(formData, 1000);

  useEffect(() => {
    const updateData = async () => {
      if (JSON.stringify(debouncedFormData) !== JSON.stringify(training)) {
        await updateTrainingAction(debouncedFormData);
      }
    };
    updateData();
  }, [debouncedFormData, training]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isPublic: checked }));
  };

  const handleAddModule = async () => {
    const newModule = await createModuleAction(training.id, {
      title: "New Module",
      instructions: null,
      modulePrompt: {
        aiModel: AI_MODELS.OPENAI_REALTIME,
        scenario: "",
        assessment: "",
        moderator: null,
        characters: [],
      },
      ordinal: training.modules.length,
    });
    router.refresh();
  };

  const handleDeleteModule = async (moduleId: number) => {
    await deleteModuleAction(moduleId, training.id);
    router.refresh();
  };

  const handleDeleteTraining = async () => {
    await deleteTrainingAction(training.id);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 absolute top-0 right-0 p-4 z-10 flex gap-2">
        {!isLoading && user?.id === training.createdBy && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Training</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  training and all its modules.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteTraining}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button
          variant="outline"
          onClick={() => router.push(`/explore/${training.id}`)}
        >
          Save & Exit
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <div className="aspect-video w-full relative bg-muted rounded-lg overflow-hidden">
                {formData.imageUrl ? (
                  <img
                    src={formData.imageUrl}
                    alt={formData.title}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-muted-foreground">
                      No image uploaded
                    </span>
                  </div>
                )}
              </div>
              <ImageUploadButton
                onUploadComplete={async (url) => {
                  setFormData((prev) => ({ ...prev, imageUrl: url }));
                }}
                bucket="trainings"
                folder="covers"
                buttonText="Upload Cover Image"
                buttonVariant="secondary"
                buttonSize="default"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tagline</label>
                <Input
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Preview Video URL</label>
                <Input
                  name="previewUrl"
                  value={formData.previewUrl || ""}
                  onChange={handleInputChange}
                  placeholder="Enter video URL"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isPublic}
                  onCheckedChange={handleSwitchChange}
                />
                <label className="text-sm font-medium">Public</label>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <label className="text-sm font-medium">Description</label>
            <MarkdownEditor
              content={formData.description}
              onChange={(markdown) =>
                setFormData((prev) => ({ ...prev, description: markdown }))
              }
              className="min-h-[300px]"
            />
          </div>
        </TabsContent>

        <TabsContent value="modules">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Modules</h2>
              {!isLoading && user?.id === training.createdBy && (
                <Button onClick={handleAddModule}>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Module
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {training.modules.map((module) => (
                <Card
                  key={module.id}
                  className="flex items-center justify-between p-4"
                >
                  <span className="text-foreground">{module.title}</span>
                  {!isLoading && user?.id === training.createdBy && (
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          router.push(
                            `/explore/${training.id}/edit/${module.id}`
                          )
                        }
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteModule(module.id)}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EditTrainingForm;
