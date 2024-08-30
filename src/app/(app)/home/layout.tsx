import { ReactNode } from "react";
import LogoutButton from "@/components/logout-button";
import { Sidebar } from "@/components/sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  console.log("AppLayout");
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-green-500">
          <h1 className="text-2xl font-bold">App</h1>
          <LogoutButton />
        </header>
        <main className="flex-1 p-4">{children}</main>
        <footer className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-green-500">
          <p>Footer</p>
        </footer>
      </div>
    </div>
  );
}
