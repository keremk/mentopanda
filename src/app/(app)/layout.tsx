"use client"

import { SidebarProvider } from "@/contexts/SidebarContext"
import { Sidebar } from "@/components/sidebar"
import { Footer } from "@/components/footer"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  )
}

