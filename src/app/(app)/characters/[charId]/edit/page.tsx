import { notFound } from "next/navigation";
import { getCharacterDetailsAction } from "@/app/actions/character-actions";
import { EditCharacterForm } from "./edit-character";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Character",
};

export default async function EditCharacterPage(
  props: {
    params: Promise<{ charId: string }>;
  }
) {
  const params = await props.params;
  const character = await getCharacterDetailsAction(params.charId);

  if (!character) {
    notFound();
  }

  return <EditCharacterForm character={character} />;
}
