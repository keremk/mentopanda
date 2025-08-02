# Public Trainings

## Why?
We want to enable the training creators to make their trainings available publicly. Currently that can only be done if you are the super admin in the Special Project 1, called Public Trainings. This is intended for the creator of this application to create trainings that can be used as starting points in other people's projects. They can only be copied during onboarding to the project of the user. This has a lot of drawbacks:

- Once a project is copied to a user's project, if the creator of the app updates the training, there is no way to redisribute that to the users. The users are left with the old copy.
- Only the creator of this app can create shareable trainings publicly. 
- The user cannot discover newly created trainings. 

## How?
### Explore (for consuming public trainings)
We will add a new tab in the Explore sidebar section, where the user can see all publicly available trainings. For logged-in users, we will have 2 tabs: "My Trainings", "Public Trainings". My trainings tab will be the same as it is today, and the public trainings will show the publicly available trainings. The default tab is "My Trainings"

Initially this list is going to be small, but later with more contributors, it can grow. The list should have a load more button at the bottom after a set number of initial # of items (a constant that is configurable) and when load more is pressed, it loads the next page of that number of items and shows. 

For now, we won't have a way to filter or search this list, the users can discover by scrolling. Authenticted users will be able to see the description of each training. But they won't be able to add this directly to their enrollments. To do that, they need to first add it to their project. (same as deep copying when onboarding, which copies every asset and nested table rows for that training)

- In the public training list page, the user will see "Add to Project" button instead of the "join" button. Adding to project will do the deep-copy to the user's current project.
  - Add to Project button will pop up a dialog to tell the user that they are adding this. They will be presented with Cancel or Continue. If continued the copy operation will proceed.
  - Copying a public training to a user's project will remove the isPublic flag from the copied version of the training since we don't want to show those in the public trainings. (Unless the user modifies and decides to publish it later)
    - Concern: At some it may become a concern for users to copy someone else's training and republish it. But for now we will ignore that.
    - Copying the training also sets the created_at and created_by columns of the training and all the nested other rows in other tables to the user and the date-time of the copy.
  - If a user navigates into the details of the training after it is added to the project, they will see the same "Join" button in the details page. (As this is just like another training now that is created in that project)
  - Also each training card in the public trainings list will have the small icon of the owner of the user who published it.
    - Hovering on that will show the owner's display name. 
      - FUTURE: In the future we will add a public profiles page as well where they can navigate to the public profile of the owner, but for now no such thing.
      - Mobile - we will only show the icon of the user for the time being.
    - We will keep a count of the number of times the training is copied (forked). 
      - FUTURE: We can display this in the future, but because we don't have many users now, displaying is not good. But we should keep the count in the database.
      - FUTURE: This count can be used as a way to sort the public training by popularity
- In the details page of public trainings, not yet added to a project, there will be the same "Add To Project" button instead of the "Join" button. Once added to the project, than the "Join" button will appear.
  - To make this work, after hitting the "Add To Project" button, the same dialog pops up. Once it finishes its work, the page navigates to the new copied training. So since the training is already in the project, the Join button will appear anyways.

The same public training list will be available also to the unauthenticated users just for users browsing the App's landing homepage. There will be a new "Trainings" section next to the Solutions in the header of the home page and clicking to that will take the user to the same list view of public trainings. In this setup, there will be no "Add To Project" button as the user is not logged in. So instead the users will be able to click and see the general information of the training. In the details page for unauthenticated users, under the training picture, there will be a button to invite users to join MentoPanda which takes them to signup page.

### Make public and unpublish - Publishing trainings
We will add a new feature to publish (make public) a training. We will add a new button next to "Save & Exit" in the edit view of a training. Clicking on this button will launch a dialog to publish the training. Once a training is published it will be available the public training Explore tab. All subsequent changes to the training will immediately be available as well. Users can unpublish a training (For example they are working on a revision and don't want the updates to be live immediately) This will make the training not visible in the Explore tab. (Of course users who copied the earlier version will still have access to their copy). Once a training is published the button shows "Unpublish" (or a better word) and clicking that button will launch a dialog to unpublish it. 

The "made public" trainings will have an indicator (a badge) in the My Trainings button showing that they are public now. But the trainings that are copied from the "Public Trainings" (i.e. other user's public trainings) do not show that badge, as any changes to those are not visible (since it is a copy) to the other users. 

## Current Architectural Considerations
- Currently all training permissions are scoped to the project. In fact the isPublic flag is on the projects. And there is only a single Public Project which is Project 1, owned by the superadmin role and created in the beginning. 
  - We will keep this for backwards compatibility. 
- Trainings have dependencies to other tables and also have assets in the storage. When deep copying these also needs to be copied.
- We have set up extensive RLS policies. Having trainings (and their dependent information in different tables and assets) that are marked public, viewable by non-authenticated users and users who are not members of the project that the trainings are in, will currently be blocked by RLS policies.

## Proposed Technical Solution
### Data Layer

Based on the current architecture analysis, here's a minimal effort approach to implement public trainings while maintaining security and compatibility:

#### Current State Analysis
- **Training Dependencies**: Each training involves multiple tables: `trainings` → `modules` → `modules_characters` ← `characters`, plus storage assets (images/avatars)
- **Permission Model**: Currently all permissions are project-scoped via RLS policies using `authorize()` function
- **Public Project**: Project ID 1 exists as "Public Trainings" with `is_public=true`
- **Storage**: Both `trainings` and `avatars` buckets are already public

#### Proposed Minimal Changes

**1. Add `is_public` Flag to Trainings Table**
```sql
ALTER TABLE trainings ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trainings ADD COLUMN fork_count INTEGER NOT NULL DEFAULT 0;
```

This approach provides:
- **Granular Control**: Individual trainings can be made public regardless of project
- **Backward Compatibility**: Maintains existing project-based public mechanism
- **Fork Tracking**: Built-in counter for popularity metrics

**2. Modify RLS Policies for Public Training Access**

Update existing policies to allow public access to trainings marked as `is_public=true`. To avoid expensive joins in RLS evaluation, we'll use a denormalization strategy with trigger maintenance.

**Add Denormalization Column:**
```sql
-- Add flag to characters table to avoid expensive RLS joins
ALTER TABLE characters ADD COLUMN is_used_in_public_training BOOLEAN NOT NULL DEFAULT false;
```

**Updated RLS Policies:**

**Trainings Policy:**
```sql
-- Replace existing policy
DROP POLICY "Trainings are viewable by project members or if project is publ" ON trainings;

CREATE POLICY "Trainings are viewable by project members or if public" ON trainings
FOR SELECT TO authenticated, anon
USING (
  is_public = true OR 
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = trainings.project_id 
    AND (
      p.is_public = true OR 
      p.id = ((auth.jwt() ->> 'current_project_id'::text))::bigint
    )
  )
);
```

**Modules Policy:** 
```sql
-- Replace existing policy (minimal performance impact - just adds boolean check)
DROP POLICY "Modules are viewable by project members or if project is public" ON modules;

CREATE POLICY "Modules are viewable by project members or if training is public" ON modules
FOR SELECT TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM (trainings t JOIN projects p ON p.id = t.project_id)
    WHERE t.id = modules.training_id 
    AND (
      t.is_public = true OR
      p.is_public = true OR 
      p.id = ((auth.jwt() ->> 'current_project_id'::text))::bigint
    )
  )
);
```

**Characters Policy:**
```sql
-- Replace existing policy (uses denormalized flag for performance)
DROP POLICY "Characters are viewable by project members or if project is pub" ON characters;

CREATE POLICY "Characters are viewable by project members or if used in public training" ON characters
FOR SELECT TO authenticated, anon
USING (
  -- Existing project-based access (fast)
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = characters.project_id 
    AND (
      p.is_public = true OR 
      p.id = ((auth.jwt() ->> 'current_project_id'::text))::bigint
    )
  )
  OR
  -- New public training access (fast - just boolean check)
  is_used_in_public_training = true
);
```

**Modules-Characters Policy:**
```sql
-- Replace existing policy
DROP POLICY "Modules-characters associations are viewable by project members" ON modules_characters;

CREATE POLICY "Modules-characters associations are viewable by project members or if training is public" ON modules_characters
FOR SELECT TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM ((modules m JOIN trainings t ON t.id = m.training_id) JOIN projects p ON p.id = t.project_id)
    WHERE m.id = modules_characters.module_id 
    AND (
      t.is_public = true OR
      p.is_public = true OR 
      p.id = ((auth.jwt() ->> 'current_project_id'::text))::bigint
    )
  )
);
```

**Trigger for Flag Maintenance:**
```sql
-- Trigger function to maintain is_used_in_public_training flag
CREATE OR REPLACE FUNCTION update_character_public_flags()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.is_public != NEW.is_public THEN
    IF NEW.is_public = true THEN
      -- Training became public - mark all its characters as public
      UPDATE characters SET is_used_in_public_training = true
      WHERE id IN (
        SELECT DISTINCT c.id FROM characters c
        JOIN modules_characters mc ON c.id = mc.character_id  
        JOIN modules m ON mc.module_id = m.id
        WHERE m.training_id = NEW.id
      );
    ELSE
      -- Training became private - check if characters are still used in other public trainings
      UPDATE characters SET is_used_in_public_training = CASE
        WHEN EXISTS (
          SELECT 1 FROM modules m2
          JOIN trainings t2 ON m2.training_id = t2.id
          JOIN modules_characters mc2 ON m2.id = mc2.module_id
          WHERE mc2.character_id = characters.id 
          AND t2.is_public = true 
          AND t2.id != NEW.id
        ) THEN true
        ELSE false
      END
      WHERE id IN (
        SELECT DISTINCT c.id FROM characters c
        JOIN modules_characters mc ON c.id = mc.character_id
        JOIN modules m ON mc.module_id = m.id  
        WHERE m.training_id = NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER training_public_flag_trigger
  AFTER UPDATE ON trainings
  FOR EACH ROW
  EXECUTE FUNCTION update_character_public_flags();
```

**3. Deep Copy Implementation**

Create a comprehensive deep copy function that handles all training dependencies and returns ID mappings for storage operations:

```sql
CREATE OR REPLACE FUNCTION deep_copy_training(
  source_training_id BIGINT,
  target_project_id BIGINT,
  target_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  new_training_id BIGINT;
  source_module RECORD;
  new_module_id BIGINT;
  source_character RECORD;
  new_character_id BIGINT;
  character_mapping JSONB := '{}';
  module_mapping JSONB := '{}';
  result JSONB;
BEGIN
  -- 1. Copy training (with is_public=false)
  INSERT INTO trainings (title, tagline, description, image_url, preview_url, project_id, created_by, is_public, fork_count)
  SELECT title, tagline, description, image_url, preview_url, target_project_id, target_user_id, false, 0
  FROM trainings WHERE id = source_training_id
  RETURNING id INTO new_training_id;

  -- 2. Copy characters first (to build mapping)
  FOR source_character IN 
    SELECT DISTINCT c.* FROM characters c
    JOIN modules_characters mc ON c.id = mc.character_id
    JOIN modules m ON mc.module_id = m.id
    WHERE m.training_id = source_training_id
  LOOP
    INSERT INTO characters (name, voice, ai_description, ai_model, description, avatar_url, project_id, created_by)
    VALUES (source_character.name, source_character.voice, source_character.ai_description, 
            source_character.ai_model, source_character.description, source_character.avatar_url, 
            target_project_id, target_user_id)
    RETURNING id INTO new_character_id;
    
    character_mapping := character_mapping || jsonb_build_object(source_character.id::text, new_character_id);
  END LOOP;

  -- 3. Copy modules and link to new characters
  FOR source_module IN SELECT * FROM modules WHERE training_id = source_training_id ORDER BY ordinal LOOP
    INSERT INTO modules (training_id, title, instructions, ordinal, ai_model, scenario_prompt, 
                        assessment_prompt, moderator_prompt, prep_coach_prompt, video_url, audio_url)
    VALUES (new_training_id, source_module.title, source_module.instructions, source_module.ordinal,
            source_module.ai_model, source_module.scenario_prompt, source_module.assessment_prompt,
            source_module.moderator_prompt, source_module.prep_coach_prompt, 
            source_module.video_url, source_module.audio_url)
    RETURNING id INTO new_module_id;

    module_mapping := module_mapping || jsonb_build_object(source_module.id::text, new_module_id);

    -- Copy module-character associations
    INSERT INTO modules_characters (module_id, character_id, ordinal, prompt, skills, traits)
    SELECT new_module_id, 
           (character_mapping->>mc.character_id::text)::BIGINT,
           mc.ordinal, mc.prompt, mc.skills, mc.traits
    FROM modules_characters mc 
    WHERE mc.module_id = source_module.id;
  END LOOP;

  -- 4. Increment fork count
  UPDATE trainings SET fork_count = fork_count + 1 WHERE id = source_training_id;

  -- 5. Return mapping for storage operations
  result := jsonb_build_object(
    'training_id', new_training_id,
    'character_mapping', character_mapping,
    'module_mapping', module_mapping
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**4. Storage Asset Handling**

**CRITICAL**: Storage assets must be copied to prevent issues when original trainings are modified or deleted. The existing `copyPublicTrainings` implementation provides the pattern:

**Current Implementation Analysis:**
- Uses `copyStorageFile` helper function that downloads and re-uploads assets
- Handles both `trainings` bucket (training images) and `avatars` bucket (character avatars) 
- Updates database URLs after successful copy operations
- Uses parallel Promise handling for performance
- Graceful error handling (returns original URL on failure)
- Uses structured naming: `trainings/{trainingId}/cover.jpg`, `character-avatars/{characterId}/avatar.jpg`

**Storage Copy Strategy for Public Trainings:**
```typescript
// Pattern from existing implementation:
// 1. Download original asset from source path
// 2. Upload to new structured path
// 3. Update database with new URL
// 4. Handle errors gracefully

// For training assets:
`trainings/${newTrainingId}/cover.jpg`
`trainings/${newTrainingId}/preview.jpg` 

// For character avatars:
`character-avatars/${newCharacterId}/avatar.jpg`
```

**Integration with Deep Copy Function:**
The PostgreSQL `deep_copy_training` function should be split into two phases:
1. **Database Copy Phase**: Copy all records and return mapping of old→new IDs
2. **Storage Copy Phase**: Use TypeScript/JavaScript to copy assets and update URLs

This hybrid approach leverages:
- PostgreSQL's transactional integrity for complex relational copying
- TypeScript's robust storage API handling and error management
- Existing proven storage copying patterns

#### Security Considerations

1. **Anonymous Access**: Policies allow `anon` role for public trainings (unauthenticated users)
2. **RLS Enforcement**: All dependent tables maintain RLS with public training awareness
3. **Asset Access**: Storage bucket policies already handle public access appropriately
4. **Fork Tracking**: Built-in counter prevents need for complex analytics queries

#### Migration Strategy

1. **Phase 1**: Add columns and policies (backward compatible)
2. **Phase 2**: Update existing public project trainings to use new `is_public` flag
3. **Phase 3**: Implement frontend publishing/unpublishing controls
4. **Phase 4**: Implement deep copy functionality

This approach minimizes database changes while providing the required functionality for public trainings with proper security controls.

