Here is the conventions I use for data access in this app:

* Always prefer data access from the server side. (i.e. server components accesing data)

Actions:
* The actions folder is located in /src/app/actions. If it does not exist create a file in that folder with the convention like: data-type-actions.ts
* Inside the action function, do minimal work and delegate to the data layer. Here is an example for trainings:

```
import { createClient } from "@/utils/supabase/server";
import {
  getTrainingById,
} from "@/data/trainings";

export async function getTrainingByIdAction(trainingId: number) {
  const supabase = createClient();
  return await getTrainingById(supabase, trainingId);
}
```

* Do not declare the data types in the actions but import them from the ```/data``` layer.
* Name the function as ```getXXXAction``` if it is a get, or correspondingly like update etc. for others.

Data:
* Refer to the schemas file in ```/supabase/migrations/20241012171545_init_schema.sql``` to find the database types defined.
* The data layer folder is located in /src/data. If it does not exist create a file in that folder with the convention like: data-type.ts
* Declare the necessary data types here in the same file.
* When you create a function name the function as ```getXXX``` (which mirrors the action but without the Action suffix).
* The function should always has a supabase input parameter. (We use this injection to accomodate testing based on client or server side). Here is an example:

```
import { SupabaseClient } from "@supabase/supabase-js";
import { getUserId, handleError } from "./utils";

export async function enrollInTraining(
  supabase: SupabaseClient,
  trainingId: number
): Promise<void> {
  const userId = await getUserId(supabase);

  const { error } = await supabase
    .from("enrollments")
    .insert({ training_id: trainingId, user_id: userId });

  if (error) handleError(error);
}
```

* Make sure to use the error handling and getUser utility functions defined in ```/src/data/utils.ts``` as in the above example.
* Map the results returned from the supabase client to a the data type defined here. See example below:

```
export type TrainingSummary = {
  id: number;
  title: string;
  tagline: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function getEnrolledTrainings(
  supabase: SupabaseClient
): Promise<TrainingSummary[]> {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `
      id,
      trainings (id, title, tagline, image_url),
      created_at
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) handleError(error);

  if (!data) return [];

  /* 
    Why am I using "any" type?
    It's clear now that there's a mismatch between what TypeScript infers from the Supabase client and what's actually returned at runtime. 
Given that trainings is indeed an object and not an array at runtime, we'll need to update our type definitions and the way we handle the data.
  */

  return data.map((enrollment: any) => ({
    id: enrollment.trainings?.id,
    title: enrollment.trainings?.title ?? "",
    tagline: enrollment.trainings?.tagline ?? "",
    imageUrl: enrollment.trainings?.image_url ?? "",
    createdAt: new Date(enrollment.trainings?.created_at),
    updatedAt: new Date(enrollment.trainings?.updated_at),
  }));
}
```
* And make sure to the mappings in type safe way, such as using Date types etc. See example above.