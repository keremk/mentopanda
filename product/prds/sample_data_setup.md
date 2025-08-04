I want to change how the test data is structured. We have changed some things since the beginning of this codebase but did not really update the test data. Currently it is really convoluted an hard to configure. Of course these changes will also mean that we will need to change @src/scripts/import-data.ts script. Here are the changes I want to make following changes:

- Even though our characters to modules relationship is many to many, we actually use a one-to-many setup (in fact current UI only allows one-to-one). I.e. a module can contain multiple characters but a character cannot be in multiple modules. And currently UI only allows one character per module. (which may change in the future, but we don't yet need to add sample data for this)
- We got rid of the character ai_description and description (still in the database but always null). These are not used in the app. So no sample data for that is needed.
- The sample data should be under the scripts/test-data folder. And we should create new folders as instructed below to start text heavy content like descriptions, prompts in their own .md files for ease of editing.
- The sample data should have the following structure for ease of editing:

```json
{
  projects: [
    {
      // Project info
      trainings: [
        {
          /// Training Info
          /// Descriptions should be in a separate file in a folder under the projects folder named trainings
          modules: [
            {
              /// Module Info
              /// Descriptions and prompts should be in separate files in a folder under the projects/trainings folder named modules
              characters: [
                /// Only one character is fine for now
                {
                  /// Character info
                  /// Note that the content of this is a mix of content to be written to 2 tables characters and modules_characters. 
                }
              ]
            }
          ]
        }
    }
  ]
}

```
