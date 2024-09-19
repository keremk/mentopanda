import {
  subMonths,
  eachDayOfInterval,
  format,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isMonday,
} from "date-fns";

export const mockCourses = [
  {
    id: "1",
    title: "Mastering Constructive Feedback",
    tagline: "Learn how to give and receive feedback effectively",
    description:
      "This an interactive training course designed to help engineering managers effectively deliver constructive feedback to their teams. Through a series of immersive role-playing scenarios powered by AI-created personas, participants will engage with engineers of varying skill levels, backgrounds, and attitudes. Managers will face real-world situations, such as handling defensiveness during feedback, addressing recurring performance issues, and navigating difficult conversations in 1:1 meetings. For instance, participants might be asked to give feedback to an engineer who consistently receives improvement comments in pull request reviews but becomes defensive when approached. The AI persona will simulate common responses—ranging from excuses to pushback—allowing managers to practice giving clear, actionable feedback and ensuring it's understood and accepted.",
    imageUrl: "/course-images/feedback.jpeg",
    previewURL: "https://www.youtube.com/watch?v=gEB3ckYeZF4",
  },
  {
    id: "2",
    title: "Effective Team Meetings",
    imageUrl: "/course-images/typescript-course.jpg",
  },
  {
    id: "3",
    title: "Effective Performance Reviews",
    imageUrl: "/course-images/nodejs-course.jpg",
  },
  {
    id: "4",
    title: "Hard Conversations",
    imageUrl: "/course-images/graphql-course.jpg",
  },
  {
    id: "5",
    title: "Career Conversations",
    imageUrl: "/course-images/nextjs-course.jpg",
  },
];

export const generateMockHeatmapData = () => {
  const today = new Date();
  const sixMonthsAgo = subMonths(today, 6);
  const dateRange = eachDayOfInterval({ start: sixMonthsAgo, end: today });

  return dateRange.reduce<Record<string, number>>((acc, date) => {
    acc[format(date, "yyyy-MM-dd")] = Math.floor(Math.random() * 5);
    return acc;
  }, {});
};

export const generateMockTrainingSessions = () => [
  {
    id: 1,
    sessionTitle: "Pull request review",
    trainingTitle: "Mastering Constructive Feedback",
    dateTaken: "2023-06-15T10:00:00",
  },
  {
    id: 2,
    sessionTitle: "Denying promotion with a reason",
    trainingTitle: "Hard Conversations",
    dateTaken: "2023-06-14T14:30:00",
  },
  {
    id: 3,
    sessionTitle: "Starting a PIP with goals",
    trainingTitle: "Effective Performance Reviews",
    dateTaken: "2023-06-16T09:00:00",
  },
  {
    id: 4,
    sessionTitle: "Feedback on troubled communication",
    trainingTitle: "Mastering Constructive Feedback",
    dateTaken: "2023-06-13T11:00:00",
  },
];