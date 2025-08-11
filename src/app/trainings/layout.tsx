import { Header } from "@/app/header";

export default function TrainingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="pt-16">
        {children}
      </main>
    </>
  );
}