# Concepts

- A project is the container for trainings, characters and people. So they have the right to create and manage those within that project.
- When a user creates a project, they are the admin of the project.
- A user can only see the projects they created or they are a member of.
- A user who creates a project (or is given admin rights) can invite other users to the project. They can also select their role in that project (admin, manager or member)
  - A manager in a project is allowed to create new trainings, characters etc. But they can not invite or remove people.
  - A member in a project, is only allowed to view trainings and characters. They cannot edit or create new ones.
- The user's role is scoped to the project. So the same user can have different roles in different projects.
- There is only 1 project that is active at a given time. All create & edit actions will happen in that project.
- There is a special project called as the Public project created by the owner of the app. This project can be visible by all users. 
  - When the user first signs up, that is the currently active project. The users have only member role in that project by default.
  - In order to create new trainings, characters, the users need to create a new project. When creating a new project, the user is given the option to clone the public trainings and characters as a starting point. This will create a copy of those, and then users can edit them within their project as they wish.
  - Just like any other project owner, the owner of this special Public project can invite other users as a manager role to help create more trainings. 
- The admin of a project should be able to invite new or existing profiles (users) to a project and assign them roles. 
  - The UI will allow admin to add a user email. The system should be able to search if the user is already registered and if so add them directly to that project.
  - If the user is not registered, the system will send an invite email. The invites will be in a separate table called invites and if a user accepts and registers using that invite email, then they will be added into the project. 

  