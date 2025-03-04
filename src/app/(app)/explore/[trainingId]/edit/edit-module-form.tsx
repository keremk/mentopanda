"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Module } from "@/data/modules";
import { MarkdownEditor } from "@/components/markdown-editor";
import { CharacterSelect } from "@/components/character-select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useModuleEdit } from "@/contexts/module-edit-context";
import { useCharacterPrompt } from "@/contexts/character-prompt-context";

type Props = {
  module: Module;
};

export function EditModuleForm({ module }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("scenario");
  const [isCharacterDialogOpen, setIsCharacterDialogOpen] = useState(false);

  // Use the contexts
  const { updateModuleField, selectModule } = useModuleEdit();
  const {
    selectedCharacterId,
    selectCharacter,
    characterPrompts,
    updateCharacterPrompt,
    initializeCharacters,
  } = useCharacterPrompt();

  // Initialize the module in context
  useEffect(() => {
    selectModule(module.id);
  }, [module.id, selectModule]);

  // Initialize character prompts
  useEffect(() => {
    initializeCharacters(module.modulePrompt.characters);
  }, [module.modulePrompt.characters, initializeCharacters]);

  // Initialize selected character if not set
  useEffect(() => {
    if (!selectedCharacterId && module.modulePrompt.characters.length > 0) {
      selectCharacter(module.modulePrompt.characters[0]?.id);
    }
  }, [module.modulePrompt.characters, selectedCharacterId, selectCharacter]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    updateModuleField(name as keyof Module, value);
  };

  const handlePromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    field: string
  ) => {
    const { value } = e.target;
    updateModuleField("modulePrompt", {
      ...module.modulePrompt,
      [field]: value,
    });
  };

  const handleCharacterPromptChange = (value: string) => {
    if (!selectedCharacterId) return;
    updateCharacterPrompt(selectedCharacterId, value);
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const selectedCharacter = module.modulePrompt.characters.find(
    (c) => c.id === selectedCharacterId
  );

  const handleCharacterSelect = (characterId: number) => {
    selectCharacter(characterId);
    setIsCharacterDialogOpen(false);
    router.refresh();
  };

  const handleUpdateCharacters = () => {
    router.refresh();
    setIsCharacterDialogOpen(false);
  };

  return (
    <div className="h-full overflow-auto space-y-6">
      <div>
        <label className="text-sm font-medium">Title</label>
        <Input name="title" value={module.title} onChange={handleInputChange} />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Instructions</label>
        <div className="border rounded-md">
          <MarkdownEditor
            content={module.instructions || ""}
            onChange={(value) => updateModuleField("instructions", value)}
            className="min-h-[200px]"
          />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">AI Instructions</h3>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scenario">Scenario</TabsTrigger>
            <TabsTrigger value="moderator">Moderator</TabsTrigger>
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
            <TabsTrigger value="character">Character</TabsTrigger>
          </TabsList>

          <TabsContent value="scenario" className="mt-4">
            <Textarea
              value={module.modulePrompt.scenario}
              onChange={(e) => handlePromptChange(e, "scenario")}
              rows={12}
              placeholder="Enter the scenario instructions..."
            />
          </TabsContent>

          <TabsContent value="moderator" className="mt-4">
            <Textarea
              value={module.modulePrompt.moderator || ""}
              onChange={(e) => handlePromptChange(e, "moderator")}
              rows={12}
              placeholder="Enter the moderator instructions..."
            />
          </TabsContent>

          <TabsContent value="assessment" className="mt-4">
            <Textarea
              value={module.modulePrompt.assessment}
              onChange={(e) => handlePromptChange(e, "assessment")}
              rows={12}
              placeholder="Enter the assessment instructions..."
            />
          </TabsContent>

          <TabsContent value="character" className="mt-4">
            <div className="space-y-6">
              <div className="flex items-center justify-between border rounded-md p-4">
                {selectedCharacterId ? (
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage
                        src={selectedCharacter?.avatarUrl || undefined}
                      />
                      <AvatarFallback>
                        {getInitials(selectedCharacter?.name || "")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {selectedCharacter?.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No character selected
                  </span>
                )}

                <Dialog
                  open={isCharacterDialogOpen}
                  onOpenChange={setIsCharacterDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-32">
                      {selectedCharacterId ? (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Change
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <CharacterSelect
                      moduleId={module.id}
                      aiModel={module.modulePrompt.aiModel}
                      characters={module.modulePrompt.characters}
                      selectedCharacterId={selectedCharacterId}
                      onSelectCharacter={handleCharacterSelect}
                      onUpdate={handleUpdateCharacters}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {selectedCharacterId && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Character Prompt
                  </label>
                  <Textarea
                    value={characterPrompts[selectedCharacterId] ?? ""}
                    onChange={(e) =>
                      handleCharacterPromptChange(e.target.value)
                    }
                    placeholder="Enter the character's prompt..."
                    rows={10}
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default EditModuleForm;
