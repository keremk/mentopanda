Follow these instruction when creating pages or components for the UI

* Always prefer server components, only create client components when there is a real need (such as user interactions etc.) If there is a data access needed in the initial state, prefer loading it on the server side and then if necessary pass it as a parameter to the client component.
* Use server actions to fetch the data, never access the data layer directly. The actions are located in the /src/app/actions folder.