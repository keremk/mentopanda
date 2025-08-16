  import { Puzzle, MessageSquareWarning, AlarmClock } from "lucide-react";

export function ProblemSection() {
  return (
    <section id="problem" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <div className="text-brand font-medium mb-4">PROBLEM</div>
          <h2 className="text-4xl font-bold mb-4">
            Mastering communication takes more than a one-time workshop.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Problem 1 */}
          <div className="text-center p-6 rounded-xl hover:bg-muted/50 transition-colors">
            <div className="w-16 h-16 bg-linear-to-br from-teal-500/20 to-blue-500/20 dark:from-teal-500/10 dark:to-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xs">
              <AlarmClock className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Not Enough Practice</h3>
            <div className="mx-auto max-w-sm">
              <ul className="text-left text-muted-foreground space-y-2">
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Workshops are short and infrequent, offering limited hands-on
                  practice.
                </li>
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  New managers often learn through trial and error on the job.
                </li>
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Slow skill development leads to miscommunication and
                  frustration.
                </li>
              </ul>
            </div>
          </div>

          {/* Problem 2 */}
          <div className="text-center p-6 rounded-xl hover:bg-muted/50 transition-colors">
            <div className="w-16 h-16 bg-linear-to-br from-teal-500/20 to-blue-500/20 dark:from-teal-500/10 dark:to-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xs">
              <MessageSquareWarning className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-semibold mb-4">
              Inconsistent Feedback
            </h3>
            <div className="mx-auto max-w-sm">
              <ul className="text-left text-muted-foreground space-y-2">
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Feedback is often vague, delayed, or based on secondhand
                  reports.
                </li>
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Managers lack time or structure to give regular coaching.
                </li>
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Without clear input, it’s hard to improve or know what’s
                  expected.
                </li>
              </ul>
            </div>
          </div>

          {/* Problem 3 */}
          <div className="text-center p-6 rounded-xl hover:bg-muted/50 transition-colors">
            <div className="w-16 h-16 bg-linear-to-br from-teal-500/20 to-blue-500/20 dark:from-teal-500/10 dark:to-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xs">
              <Puzzle className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-semibold mb-4">
              One-Size Training Doesn’t Fit All
            </h3>
            <div className="mx-auto max-w-sm">
              <ul className="text-left text-muted-foreground space-y-2">
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Every company has its own culture, tools, and communication
                  norms.
                </li>
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Generic training doesn’t reflect the real situations your
                  teams face.
                </li>
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Managers lack tools to create tailored, relevant learning
                  experiences.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
