import { getCharacterDetailsAction } from "@/app/actions/character-actions";
import { getCurrentUserAction } from "@/app/actions/user-actions";
import { CharacterDetailsView } from "@/components/character-details";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CharacterPage(props: {
  params: Promise<{ charId: string }>;
}) {
  const params = await props.params;
  const [character, user] = await Promise.all([
    getCharacterDetailsAction(params.charId),
    getCurrentUserAction(),
  ]);

  if (!character) notFound();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="absolute top-0 right-0 p-4 z-10">
        {user.permissions.includes("training.manage") &&
          user.id === character.createdBy && (
            <Button asChild variant="outline">
              <Link
                href={`/characters/${character.id}/edit`}
                replace
                className="flex items-center"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
      </div>
      <CharacterDetailsView character={character} />
    </div>
  );
}
