export default function ErrorPage({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  return <p>{searchParams.message}</p>;
}
