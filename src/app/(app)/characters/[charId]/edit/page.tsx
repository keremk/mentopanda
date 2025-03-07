import { notFound, redirect } from "next/navigation";
import { getCharacterDetailsAction } from "@/app/actions/character-actions";
import { EditCharacterForm } from "./edit-character";
import { Metadata } from "next";
import { CharacterDetailsProvider } from "@/contexts/character-details-context";

export const metadata: Metadata = {
  title: "Characters Catalog",
};

export default async function EditCharacterPage(props: {
  params: Promise<{ charId: string }>;
}) {
  const params = await props.params;
  const character = await getCharacterDetailsAction(params.charId);

  if (!character) {
    notFound();
  }

  return (
    <CharacterDetailsProvider initialCharacter={character}>
      <EditCharacterForm />
    </CharacterDetailsProvider>
  );
}
