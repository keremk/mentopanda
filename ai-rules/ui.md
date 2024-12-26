Follow these instruction when creating pages or components for the UI

* Always prefer server components, only create client components when there is a real need (such as user interactions etc.)
* Use server actions to fetch the data, never access the data layer directly. The actions are located in the /src/app/actions folder.
