-- Clear existing data from the role_permissions table
truncate table role_permissions;

-- Seed permissions for Admin role
insert into
  role_permissions (role, permission)
values
  ('admin', 'training.manage'),
  ('admin', 'training.make.public'),
  ('admin', 'enrollment.manage'),
  ('admin', 'user.admin');

-- Seed permissions for Manager role
insert into
  role_permissions (role, permission)
values
  ('manager', 'training.manage'),
  ('manager', 'enrollment.manage');

-- Seed permissions for Member role
insert into
  role_permissions (role, permission)
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
    preview_url
  )
values
  (
    'Mastering Constructive Feedback',
    'Learn how to give and receive feedback effectively',
    'This an interactive training course designed to help engineering managers effectively deliver constructive feedback to their teams. Through a series of immersive role-playing scenarios powered by AI-created personas, participants will engage with engineers of varying skill levels, backgrounds, and attitudes. Managers will face real-world situations, such as handling defensiveness during feedback, addressing recurring performance issues, and navigating difficult conversations in 1:1 meetings. For instance, participants might be asked to give feedback to an engineer who consistently receives improvement comments in pull request reviews but becomes defensive when approached. The AI persona will simulate common responses—ranging from excuses to pushback—allowing managers to practice giving clear, actionable feedback and ensuring it is understood and accepted.',
    '/course-images/feedback.jpeg',
    true,
    'https://www.youtube.com/watch?v=gEB3ckYeZF4"'
  ),
  (
    'Effective Team Meetings',
    'Optimize your team meetings for productivity and engagement',
    'This course teaches engineering managers how to run efficient, productive, and engaging team meetings. Participants will learn strategies for setting clear agendas, facilitating discussions, managing time effectively, and ensuring all team members have a voice. The training covers various meeting types, from daily stand-ups to sprint planning sessions, and provides practical tips for remote and hybrid team scenarios.',
    null,
    true,
    null
  ),
  (
    'Effective Performance Reviews',
    'Master the art of conducting meaningful performance evaluations',
    'This comprehensive course guides engineering managers through the process of conducting effective performance reviews. Participants will learn how to prepare for reviews, set appropriate goals, provide constructive feedback, and create actionable development plans. The training emphasizes the importance of ongoing feedback and how to align individual performance with organizational objectives.',
    null,
    true,
    null
  ),
  (
    'Hard Conversations',
    'Navigate challenging discussions with confidence and empathy',
    'This course equips engineering managers with the skills to handle difficult conversations professionally and empathetically. Participants will learn techniques for addressing underperformance, resolving conflicts, and delivering unwelcome news. The training focuses on maintaining a positive team dynamic while tackling tough issues, and provides strategies for turning challenging situations into opportunities for growth and improvement.',
    null,
    true,
    null
  ),  
  (
    'Career Conversations',
    'Guide your team members towards their professional goals',
    'This training course teaches engineering managers how to conduct meaningful career conversations with their team members. Participants will learn how to help employees identify their career aspirations, assess their current skills, and create development plans. The course covers topics such as mentoring, identifying growth opportunities within the organization, and aligning individual career goals with company objectives.',
    null,
    true,
    null
  );
