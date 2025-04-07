import { notFound } from "next/navigation";
import { getCharacterDetailsAction } from "@/app/actions/character-actions";
import { EditCharacterForm } from "./edit-character";
import { Metadata } from "next";
import { CharacterDetailsProvider } from "@/contexts/character-details-context";
import { getCurrentUserAction } from "@/app/actions/user-actions";

export const metadata: Metadata = {
  title: "Characters Catalog",
};

export default async function EditCharacterPage(props: {
  params: Promise<{ charId: string }>;
}) {
  const params = await props.params;
  const [character, user] = await Promise.all([
    getCharacterDetailsAction(params.charId),
    getCurrentUserAction(),
  ]);

  if (!character) {
    notFound();
  }

  return (
    <CharacterDetailsProvider initialCharacter={character}>
      <EditCharacterForm user={user} />
    </CharacterDetailsProvider>
  );
}
