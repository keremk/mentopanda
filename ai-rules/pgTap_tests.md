Follow the below instructions for creating pgTap tests

# Preparation
- Use the helpers defined in this file: supabase/tests/database/00-create-helpers.sql 
- Always consult the current database schema: supabase/schema.sql
- First read the provided RLS policy and create description of it in a human readable, well articulated form. Use that as part of your reasoning as well when you design your tests. 
- Create test users using the helper function: tests.create_supabase_user using the convention 'test.role.project_id'. 
E.g.
```
SELECT tests.create_supabase_user ('test.member.2');
```
  - Since the only project available initially is the seeded project id 1, you cannot create a user whose default project id is something else, so keep the default as 1. 
- Based on the test scenario, you may need to create a test project
  - For tests that are testing the behaviour for the default Public Project (already seeded during migration), the project id is always 1 and you don't need to create it.
    - For newly created projects assume the project number incremental like 2, 3, etc. and use that instead of creating elaborate temporary tables. But for that you need to rest the projects_id_seq like below
```
-- Reset the projects sequence
SELECT setval('projects_id_seq', 1, false);
```
  - For tests that are testing a private project, you need to create a new test project. 
    - Before creating the new project, always call tests.authenticate_as with one of the users you created. That user will be assigned to the created_by of that project and that is important.
    - Always call the create_project function defined and do not create the project manually. This function ensures that we create the corresponding role for the user who created the project which is always admin. Also add the diagnostics so we can see the currently created projects. See below for example:
```
-- For testing non-shared project access
-- Create a private project for testing shared project access
SELECT tests.authenticate_as('test.member.1');

-- Create project with known ID 2
SELECT public.create_project('Private Project 1');

-- Switch to service role to view all projects
SELECT tests.authenticate_as_service_role();

SELECT diag('Projects after creation:');

SELECT diag(format('Project ID: %s, Name: %s', id, name))
FROM projects
ORDER BY id;

-- Switch back to test user
SELECT tests.authenticate_as('test.member.1');
```

- Think about an appropriate role based on the test for the project and create an entry in the profiles_projects table for that user in that role if that user is not the same as the one who created the project in the test scenario.
- Now you can switch to that user using the helper functions tests.switch_to_project E.g.

```
SELECT tests.switch_to_project('test.member', 2);
```
- Now at this point you are ready to execute tests for that tests user within the context of the user identifier test.member
- Create other test data as necessary for the context of those tests.
- Always ensure that you are using the correct authentication context
  - When needed to be in service_role, use tests.authenticate_as_service_role () helper function.
  - When needed to be in anonymous (non-authenticated) user, use tests.clear_authentication () helper function.
  - When needed to be in a specific user's context as described above, ensure that the project setup is correct, and either use tests.switch_to_project or tests.authenticate_as depending on the situation.

# Test Structure
- Always start each test with:
```
-- Test 1: Admin users can update other profiles in their organization - e.g. make member a manager 
SELECT diag (
    'Test 1: Admin users can update other profiles in their organization'
  );

```
  - The comment is important for the readability of the file.
  - Diag output is important for the readability of the test results.
- Do not rely on "counts" for test verification. Those kind of tests are fragile in case there is some leftover data from other tests or seeds.
- Keep in mind that RLS does not always raise an exception. If you are selecting things, it merely filters out the stuff that the RLS restricts. E.g. if you don't have access to some data, simply that data is filtered out and not returned instead of an exception and error.
  - In PostgreSQL, when an RLS policy's USING clause evaluates to false, the row is silently filtered out rather than throwing an error. Only the WITH CHECK clause throws errors.
- Sometimes in order to verify something, you may need to temporarily switch to a Service Role to have full visibility (and avoid the RLS policy kicking in), so use tests.authenticate_as_service_role() helper function to do the verification. Of course some other times, the verification needs you to be in the test user's role. So be careful with those. 
- Keep each test as isolated as possible from the others. If necessary create setup before each test and cleanup after.


