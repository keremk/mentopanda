export function SolutionSection() {
  return (
    <section id="solutions" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <div className="text-brand font-medium mb-4">SOLUTIONS</div>
          <h2 className="text-4xl font-bold mb-4">
            Empower Your Employees with Continuous Training
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            One-time training is not enough. Our platform is designed to provide
            your employees with continous opportunities to practice and improve
            their communication skills.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="p-6 rounded-xl hover:bg-muted/50 transition-colors">
            <h3 className="text-teal-600 dark:text-teal-400 font-semibold mb-3">
              Engineering Managers
            </h3>
            <p className="text-muted-foreground mb-6">
              Create lessons for your team and yourself to practice how to: 
              <ul className="list-disc list-inside">
                <li>Interview candidates effectively</li>
                <li>Communicate design decisions</li>
                <li>Communicate with stakeholders</li>
                <li>Say no when necessary</li>
                <li>Motivate your team</li>
                <li>Give constructive feedback</li>
                <li>And more...</li>
              </ul>
            </p>
          </div>
          <div className="p-6 rounded-xl hover:bg-muted/50 transition-colors">
            <h3 className="text-teal-600 dark:text-teal-400 font-semibold mb-3">
              Product Managers, Designers
            </h3>
            <p className="text-muted-foreground mb-6">
              Create lessons for your team and yourself to practice how to: 
              <ul className="list-disc list-inside">
                <li>Practice stakeholder communications</li>
                <li>Learn to pitch ideas effectively</li>
                <li>Learn to give and receive feedback</li>
                <li>Get better at gathering user feedback</li>
                <li>And more...</li>
              </ul>
            </p>
          </div>
          <div className="p-6 rounded-xl hover:bg-muted/50 transition-colors">
            <h3 className="text-teal-600 dark:text-teal-400 font-semibold mb-3">
              People Teams
            </h3>
            <p className="text-muted-foreground mb-6">
              Reach out to us to discuss your specific needs and we will build a
              custom set of lessons for your employees.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
