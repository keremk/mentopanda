import { getCharacterDetailsAction } from "@/app/actions/character-actions";
import { CharacterDetailsView } from "@/app/components/characters/character-details";
import { notFound } from "next/navigation";

export default async function CharacterPage({
  params,
}: {
  params: { charId: string };
}) {
  const character = await getCharacterDetailsAction(params.charId);

  if (!character) notFound();

  return <CharacterDetailsView character={character} />;
}
