export default async function ErrorPage(
  props: {
    searchParams: Promise<{ message: string }>;
  }
) {
  const searchParams = await props.searchParams;
  return <p>{searchParams.message}</p>;
}
