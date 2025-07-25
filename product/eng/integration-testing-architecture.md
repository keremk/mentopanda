# Integration Testing Architecture

This document provides a comprehensive guide to the integration testing architecture in Tinker-Box, focusing on database testing with real RLS validation and proper authentication methodologies.

## Overview

Our integration testing approach emphasizes **real database testing** without mocking, ensuring high confidence in database operations, security policies, and user authentication flows. Tests run against actual Supabase instances with real RLS (Row Level Security) validation.

## Core Testing Philosophy

- ✅ **No Mocking**: Tests use real Supabase database instances
- ✅ **Real RLS Validation**: Security policies tested with authenticated users
- ✅ **True Integration**: End-to-end database operations with proper authentication
- ✅ **Clean Isolation**: Each test runs in a clean environment with unique data

## Authentication Architecture

### User Roles and Permissions

Tests support multiple user roles with specific permission sets:

```typescript
export type TestUserRole = "admin" | "manager" | "member" | "super_admin";

const ROLE_PERMISSIONS: Record<TestUserRole, string[]> = {
  admin: ["training.manage", "enrollment.manage", "project.manage"],
  manager: ["training.manage", "basic.access"], 
  member: ["basic.access"],
  super_admin: ["trials.manage", /* all permissions */]
};
```

### Supabase Client Types

The architecture uses three types of Supabase clients:

1. **Admin Client** - Uses service role key for administrative operations
   ```typescript
   const adminSupabase = createClient(url, serviceRoleKey);
   ```

2. **User Clients** - Individual authenticated clients per test user
   ```typescript
   const userSupabase = createClient(url, anonKey, {
     auth: { persistSession: false }
   });
   ```

3. **Anonymous Client** - For testing public/unauthenticated operations

### Authentication Flow

```typescript
// 1. Create auth user
const { data: authUser } = await adminSupabase.auth.admin.createUser({
  email: `test-${role}-${Date.now()}@example.com`,
  password: "test-password-123",
  app_metadata: {
    permissions: ROLE_PERMISSIONS[role],
    current_project_id: projectId
  }
});

// 2. Create authenticated client
const { error } = await userSupabase.auth.signInWithPassword({
  email: authUser.user.email,
  password: "test-password-123"
});
```

## Test Data Generation

### Environment Setup

Use the `setupTestEnvironment()` utility for consistent test data creation:

```typescript
const { createdUsers, createdProjectIds } = await setupTestEnvironment(
  adminSupabase,
  [
    { role: "admin", projectName: "Test-Project-Admin" },
    { role: "member", projectName: "Test-Project-Member" }
  ]
);
```

### Data Generation Patterns

**Unique Identifiers:**
- Email: `test-${role}-${counter}-${randomString}@example.com` 
- Project: `Test-Project-${role}-${timestamp}`
- IDs: Combine counters, timestamps, and random strings

**Relationship Hierarchy:**
```
Projects → Users → Profiles → Permissions → Feature Data
```

**Authentication Context:**
```typescript
app_metadata: {
  permissions: ["training.manage", "basic.access"],
  current_project_id: projectId,
  role: "admin"
}
```

## RLS Testing Patterns

### Cross-User Access Restrictions

```typescript
describe("RLS Policy Tests", () => {
  it("should prevent users from accessing other users' data", async () => {
    const member1 = createdUsers.find(u => u.role === "member")!;
    const member2 = createdUsers.find(u => u.role === "member")!;
    
    // Member1 creates data
    const { data: historyEntry } = await member1.supabase
      .from("history")
      .insert({ module_id: moduleId, /* ... */ })
      .select()
      .single();
    
    // Member2 cannot access Member1's data
    const { data } = await member2.supabase
      .from("history")
      .select("*")
      .eq("id", historyEntry.id);
      
    expect(data).toHaveLength(0); // RLS blocks access
  });
});
```

### Permission-Based Access Testing

```typescript
it("should require specific permissions for operations", async () => {
  const member = createdUsers.find(u => u.role === "member")!;
  
  // Members cannot manage invite codes (requires trials.manage)
  const { error } = await member.supabase
    .from("invite_codes")
    .insert({ code: "TEST-CODE", project_id: projectId });
    
  expect(error).toBeTruthy(); // Permission denied
});
```

### Administrative Override Testing

```typescript
it("should allow admins to access member data within project", async () => {
  const admin = createdUsers.find(u => u.role === "admin")!;
  const member = createdUsers.find(u => u.role === "member")!;
  
  // Member creates data
  await member.supabase.from("training_notes").insert({/* ... */});
  
  // Admin can read member's data in same project
  const { data } = await admin.supabase
    .from("training_notes")
    .select("*")
    .eq("project_id", projectId);
    
  expect(data).toHaveLength(1); // Admin sees member's data
});
```

## Database Testing Patterns

### CRUD Operations Testing

```typescript
describe("CRUD Operations", () => {
  it("should handle complete lifecycle", async () => {
    const user = createdUsers[0];
    
    // Create
    const { data: created } = await user.supabase
      .from("modules")
      .insert({ name: "Test Module", project_id: projectId })
      .select()
      .single();
    
    // Read
    const { data: retrieved } = await user.supabase
      .from("modules")
      .select("*")
      .eq("id", created.id)
      .single();
    
    // Update
    const { data: updated } = await user.supabase
      .from("modules")
      .update({ name: "Updated Module" })
      .eq("id", created.id)
      .select()
      .single();
    
    // Delete
    const { error } = await user.supabase
      .from("modules")
      .delete()
      .eq("id", created.id);
    
    expect(error).toBeNull();
  });
});
```

### Database Function Testing

```typescript
it("should test database functions with real parameters", async () => {
  const user = createdUsers[0];
  
  const { data, error } = await user.supabase.rpc(
    "get_current_period_start",
    { target_user_id: user.id }
  );
  
  expect(error).toBeNull();
  expect(data).toBeInstanceOf(Date);
});
```

### Constraint and Cascade Testing

```typescript
it("should properly handle foreign key cascades", async () => {
  // Create parent record
  const { data: module } = await adminSupabase
    .from("modules")
    .insert({ name: "Test Module", project_id: projectId })
    .select()
    .single();
  
  // Create child records
  await adminSupabase.from("history").insert([
    { module_id: module.id, user_id: userId1 },
    { module_id: module.id, user_id: userId2 }
  ]);
  
  // Delete parent - should cascade to children
  await adminSupabase.from("modules").delete().eq("id", module.id);
  
  // Verify cascade worked
  const { data: orphanedHistory } = await adminSupabase
    .from("history")
    .select("*")
    .eq("module_id", module.id);
    
  expect(orphanedHistory).toHaveLength(0);
});
```

## Test Utilities and Helpers

### Core Setup Function

```typescript
/**
 * Sets up test environment with projects and authenticated users
 * @param adminSupabase - Admin Supabase client
 * @param userConfigs - Array of user configurations to create
 * @returns Created users with individual Supabase clients
 */
async function setupTestEnvironment(
  adminSupabase: SupabaseClient,
  userConfigs: Array<{ role: TestUserRole; projectName: string }>
) {
  const createdUsers: TestUser[] = [];
  const createdProjectIds: number[] = [];
  const createdUserIds: string[] = [];
  
  // Implementation details...
  
  return { createdUsers, createdProjectIds, createdUserIds };
}
```

### Cleanup Utilities

```typescript
/**
 * Comprehensive cleanup of test data and auth users
 */
async function cleanupTestEnvironment(
  adminSupabase: SupabaseClient,
  projectIds: number[],
  userIds: string[]
) {
  // Delete projects (cascades to related data)
  if (projectIds.length > 0) {
    await adminSupabase.from("projects").delete().in("id", projectIds);
  }
  
  // Delete auth users
  for (const userId of userIds) {
    await adminSupabase.auth.admin.deleteUser(userId);
  }
}
```

### Test Structure Pattern

```typescript
describe("Feature Database Tests", () => {
  let adminSupabase: SupabaseClient;
  let createdUsers: TestUser[] = [];
  let projectIds: number[] = [];
  let userIds: string[] = [];
  
  beforeAll(async () => {
    adminSupabase = createClient(/* admin config */);
  });
  
  afterEach(async () => {
    await cleanupTestEnvironment(adminSupabase, projectIds, userIds);
    projectIds = [];
    userIds = [];
    createdUsers = [];
  });
  
  // Tests...
});
```

## Best Practices

### Environment Configuration

Ensure required environment variables are set:

```typescript
beforeAll(() => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing required Supabase environment variables");
  }
});
```

### Data Isolation

- Create unique identifiers for each test run
- Use project-based isolation for multi-tenant testing
- Clean up thoroughly after each test to prevent interference

### Error Handling

```typescript
// Test both success and failure scenarios
it("should handle constraint violations gracefully", async () => {
  const { error } = await userSupabase
    .from("modules")
    .insert({ name: null }); // Violates NOT NULL constraint
    
  expect(error).toBeTruthy();
  expect(error?.code).toBe("23502"); // PostgreSQL NOT NULL violation
});
```

### Performance Considerations

- Use `beforeAll` for expensive setup operations
- Clean up only what you create to minimize database operations
- Use transactions for complex multi-table operations
- Consider using database functions for complex queries

## Running Integration Tests

```bash
# Run all integration tests
pnpm test:integration

# Run specific integration test file
pnpm test src/tests/integration/training-notes-database.test.ts

# Run with verbose output
pnpm test:integration --reporter=verbose
```

## Troubleshooting

### Common Issues

1. **RLS Policy Failures**: Ensure users have proper permissions in app_metadata
2. **Authentication Errors**: Verify environment variables and user creation
3. **Data Leakage**: Check cleanup functions are running properly
4. **Cascade Failures**: Verify foreign key relationships are correctly defined

### Debug Tips

```typescript
// Log user context for debugging
console.log("User auth:", await userSupabase.auth.getUser());
console.log("User metadata:", user.app_metadata);

// Check RLS policies
const { data: policies } = await adminSupabase
  .from("pg_policies")
  .select("*")
  .eq("tablename", "your_table");
```

This architecture ensures comprehensive testing of database operations, security policies, and authentication flows while maintaining test isolation and providing confidence in production behavior.