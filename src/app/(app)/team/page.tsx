export default function TeamPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <h1 className="text-2xl font-semibold mb-4">Team Management</h1>
      <p className="text-muted-foreground max-w-md">
        Select a team member from the list to view their details or use the
        buttons below to manage team members if you have the required
        permissions.
      </p>
    </div>
  );
}
