-- Clear existing data
truncate table role_permissions cascade;

-- Create the special "no organization" record first
insert into organizations (id, name, domain)
values (1, 'NoOrganizationSpecified', 'no-organization-specified.local')
on conflict (id) do nothing;

insert into organizations (id, name, domain)
values (2, 'Coding Ventures', 'codingventures.com')
on conflict (id) do nothing;

-- Set the sequence to start after 2 to preserve id=1 and id=2
alter sequence organizations_id_seq restart with 3;

-- Seed permissions for Admin role
insert into role_permissions (role, permission)
values
  ('admin', 'training.manage'),
  ('admin', 'training.make.public'),
  ('admin', 'enrollment.manage'),
  ('admin', 'user.select'),
  ('admin', 'user.admin'),
  ('admin', 'organization.admin');

-- Seed permissions for Manager role
insert into role_permissions (role, permission)
values
  ('manager', 'training.manage'),
  ('manager', 'enrollment.manage'),
  ('manager', 'user.select');

-- Seed permissions for Member role
insert into role_permissions (role, permission)
values
  ('member', 'enrollment.manage');

-- Seed trainings
insert into
  trainings (
    title,
    tagline,
    description,
    image_url,
    is_public,
    organization_id,
    preview_url
  )
values
  (
    'Mastering Constructive Feedback',
    'Learn how to give and receive feedback effectively',
    'This an interactive training course designed to help engineering managers effectively deliver constructive feedback to their teams. Through a series of immersive role-playing scenarios powered by AI-created personas, participants will engage with engineers of varying skill levels, backgrounds, and attitudes. Managers will face real-world situations, such as handling defensiveness during feedback, addressing recurring performance issues, and navigating difficult conversations in 1:1 meetings. For instance, participants might be asked to give feedback to an engineer who consistently receives improvement comments in pull request reviews but becomes defensive when approached. The AI persona will simulate common responses—ranging from excuses to pushback—allowing managers to practice giving clear, actionable feedback and ensuring it is understood and accepted.',
    '/course-images/feedback.jpg',
    true,
    2,
    'https://www.youtube.com/watch?v=gEB3ckYeZF4"'
  ),
  (
    'Effective Team Meetings',
    'Optimize your team meetings for productivity and engagement',
    'This course teaches engineering managers how to run efficient, productive, and engaging team meetings. Participants will learn strategies for setting clear agendas, facilitating discussions, managing time effectively, and ensuring all team members have a voice. The training covers various meeting types, from daily stand-ups to sprint planning sessions, and provides practical tips for remote and hybrid team scenarios.',
    '/course-images/meetings.jpg',
    true,
    2,
    null
  ),
  (
    'Effective Performance Reviews',
    'Master the art of conducting meaningful performance evaluations',
    'This comprehensive course guides engineering managers through the process of conducting effective performance reviews. Participants will learn how to prepare for reviews, set appropriate goals, provide constructive feedback, and create actionable development plans. The training emphasizes the importance of ongoing feedback and how to align individual performance with organizational objectives.',
    '/course-images/perf-review.jpg',
    true,
    2,
    null
  ),
  (
    'Hard Conversations',
    'Navigate challenging discussions with confidence and empathy',
    'This course equips engineering managers with the skills to handle difficult conversations professionally and empathetically. Participants will learn techniques for addressing underperformance, resolving conflicts, and delivering unwelcome news. The training focuses on maintaining a positive team dynamic while tackling tough issues, and provides strategies for turning challenging situations into opportunities for growth and improvement.',
    '/course-images/hard-conversations.jpg',
    true,
    2,
    null
  ),
  (
    'Career Conversations',
    'Guide your team members towards their professional goals',
    'This training course teaches engineering managers how to conduct meaningful career conversations with their team members. Participants will learn how to help employees identify their career aspirations, assess their current skills, and create development plans. The course covers topics such as mentoring, identifying growth opportunities within the organization, and aligning individual career goals with company objectives.',
    '/course-images/careers.jpg',
    true,
    2,
    null
  );

-- After the existing training inserts, add:

-- Modules for "Mastering Constructive Feedback" (id: 1)
insert into
  modules (training_id, title, instructions, prompt)
values
  (
    1,
    'Understanding Feedback Fundamentals',
    'Learn the core principles of effective feedback and how to structure feedback conversations.',
    'You are meeting with a junior engineer who has been consistently submitting code without proper test coverage. How do you provide constructive feedback about this issue?'
  ),
  (
    1,
    'Handling Defensive Responses',
    'Practice techniques for managing defensive reactions and maintaining productive dialogue.',
    'An engineer responds defensively to your feedback about their communication style in team meetings. Role-play how you would handle their reaction: "I don''t agree at all. Others interrupt way more than I do!"'
  ),
  (
    1,
    'Positive Reinforcement',
    'Master the art of recognizing and reinforcing positive behaviors effectively.',
    'Your team member has shown significant improvement in their code quality. Practice delivering specific, meaningful praise that reinforces this positive change.'
  );

-- Modules for "Effective Team Meetings" (id: 2)
insert into
  modules (training_id, title, instructions, prompt)
values
  (
    2,
    'Meeting Structure and Agenda Setting',
    'Learn how to create effective agendas and establish meeting rhythms.',
    'Design an agenda for a 30-minute sprint planning meeting that needs to cover sprint goals, task assignment, and risk assessment.'
  ),
  (
    2,
    'Remote Meeting Facilitation',
    'Master techniques for keeping remote participants engaged and included.',
    'Your remote team members seem disengaged during virtual meetings. How would you redesign the meeting format to improve participation?'
  );

-- Modules for "Effective Performance Reviews" (id: 3)
insert into
  modules (training_id, title, instructions, prompt)
values
  (
    3,
    'Preparing for Reviews',
    'Learn how to gather and organize feedback from multiple sources.',
    'You need to prepare for a performance review with a senior engineer who has technical excellence but struggles with mentoring juniors. How do you structure your feedback?'
  ),
  (
    3,
    'Setting SMART Goals',
    'Practice creating specific, measurable, achievable, relevant, and time-bound goals.',
    'Work with your team member to set appropriate goals for improving their system design skills over the next six months.'
  );

-- Modules for "Hard Conversations" (id: 4)
insert into
  modules (training_id, title, instructions, prompt)
values
  (
    4,
    'Addressing Underperformance',
    'Learn how to have difficult conversations about performance issues.',
    'A team member has missed several deadlines and their code quality has been declining. Practice initiating this difficult conversation.'
  ),
  (
    4,
    'Managing Conflicts',
    'Develop skills for mediating conflicts between team members.',
    'Two senior engineers on your team disagree strongly about the technical direction of a project. How do you facilitate a resolution?'
  );

-- Modules for "Career Conversations" (id: 5)
insert into
  modules (training_id, title, instructions, prompt)
values
  (
    5,
    'Career Path Exploration',
    'Learn how to help team members identify their career aspirations and potential paths.',
    'Guide a conversation with a mid-level engineer who is unsure whether to pursue a technical or management track.'
  ),
  (
    5,
    'Skill Gap Analysis',
    'Practice identifying skill gaps and creating development plans.',
    'Work with your team member to assess their current skills against their goal of becoming a technical lead, and create a development plan.'
  ),
  (
    5,
    'Growth Opportunities',
    'Learn to identify and create growth opportunities within current roles.',
    'Help a team member who feels stagnant in their current role discover new challenges and learning opportunities.'
  );
