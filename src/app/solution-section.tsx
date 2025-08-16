import { LayoutDashboard, Users, UserCheck } from "lucide-react";

export const solutions = [
  {
    id: 1,
    title: "Engineering Managers",
    description:
      "Practice how to: interview candidates, communicate design decisions, communicate with stakeholders, say no when necessary, motivate your team, give constructive feedback, and more...",
    icon: (
      <LayoutDashboard className="w-5 h-5 text-teal-600 dark:text-teal-400" />
    ),
  },
  {
    id: 2,
    title: "Product Managers, Designers",
    description:
      "Practice how to: practice stakeholder communications, learn to pitch ideas effectively, learn to give and receive feedback, get better at gathering user feedback, and more...",
    icon: <UserCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
  },
  {
    id: 3,
    title: "People Teams",
    description:
      "Reach out to us to discuss your specific needs and we will build a custom set of lessons for your employees.",
    icon: <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
  },
];

export function SolutionSection() {
  return (
    <section id="solutions" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <div className="text-brand font-medium mb-4">SOLUTIONS</div>
          <h2 className="text-4xl font-bold mb-4">
            Empower Your Teams with Ongoing, Adaptive Training
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          {/* Engineering Managers */}
          <div className="text-center p-6 rounded-xl hover:bg-muted/50 transition-colors">
            <div className="w-16 h-16 bg-linear-to-br from-teal-500/20 to-blue-500/20 dark:from-teal-500/10 dark:to-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xs">
              <LayoutDashboard className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Engineering Managers</h3>
            <div className="mx-auto max-w-sm">
              <ul className="text-left text-muted-foreground space-y-2">
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Interview and evaluate candidates effectively
                </li>
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Explain technical decisions with clarity
                </li>
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Communicate with cross-functional stakeholders
                </li>
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Say no with confidence and empathy
                </li>
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Motivate and support your team
                </li>
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Deliver constructive feedback
                </li>
              </ul>
            </div>
          </div>

          {/* Product Managers & Designers */}
          <div className="text-center p-6 rounded-xl hover:bg-muted/50 transition-colors">
            <div className="w-16 h-16 bg-linear-to-br from-teal-500/20 to-blue-500/20 dark:from-teal-500/10 dark:to-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xs">
              <UserCheck className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-semibold mb-4">
              Product Managers & Designers
            </h3>
            <div className="mx-auto max-w-sm">
              <ul className="text-left text-muted-foreground space-y-2">
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Communicate product decisions clearly
                </li>
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Pitch new ideas to stakeholders and leadership
                </li>
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Give and receive actionable feedback
                </li>
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Gather and respond to user insights effectively
                </li>
              </ul>
            </div>
          </div>

          {/* People Teams */}
          <div className="text-center p-6 rounded-xl hover:bg-muted/50 transition-colors">
            <div className="w-16 h-16 bg-linear-to-br from-teal-500/20 to-blue-500/20 dark:from-teal-500/10 dark:to-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xs">
              <Users className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-semibold mb-4">People Teams</h3>
            <div className="mx-auto max-w-sm">
              <ul className="text-left text-muted-foreground space-y-2 mb-4">
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Build a scalable, company-wide communication training program
                </li>
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Tailor lessons to your culture and values
                </li>
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Involve managers in creating relevant, contextual scenarios
                </li>
                <li className="before:content-['–'] before:mr-2 before:text-teal-500">
                  Replace costly one-time events with continuous, trackable
                  training
                </li>
              </ul>
              <p className="text-muted-foreground">
                Reach out to design a custom program that fits your team&apos;s
                goals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
