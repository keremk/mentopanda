import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export default async function Home() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to Your Training Dashboard</h1>
      <p>Here you can view your training progress, history of sessions, ratings, and more.</p>
      {/* Add more dashboard content here */}
    </div>
  )
}
