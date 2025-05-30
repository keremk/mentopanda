import { Ban, Zap, Shield } from "lucide-react";

export function ProblemSection() {
  return (
    <section id="problem" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <div className="text-brand font-medium mb-4">PROBLEM</div>
          <h2 className="text-4xl font-bold mb-4">
            Learning to communicate well requires a lot of practice.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-xl hover:bg-muted/50 transition-colors">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500/20 to-blue-500/20 dark:from-teal-500/10 dark:to-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Ban className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Not Enough Practice</h3>
            <p className="text-muted-foreground">
              Traditional trainings provided by People departments last only a
              few days and there is never enough time to practice. Your new
              managers, leaders get trained but can only practice on the job and
              that takes time and creates unhappy employees.
            </p>
          </div>
          <div className="text-center p-6 rounded-xl hover:bg-muted/50 transition-colors">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500/20 to-blue-500/20 dark:from-teal-500/10 dark:to-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Zap className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Low Quality Feedback</h3>
            <p className="text-muted-foreground">
              Your managers are not always in the right place at the right time
              to provide relevant feedback. So communication skill feedback is
              not accurate and many times based on hearsay.
            </p>
          </div>
          <div className="text-center p-6 rounded-xl hover:bg-muted/50 transition-colors">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500/20 to-blue-500/20 dark:from-teal-500/10 dark:to-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Shield className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">
              Every Company is Different
            </h3>
            <p className="text-muted-foreground">
              Companies have different cultures, different communication styles,
              different communication channels, different communication goals.
              Off-the-shelf training programs are not tailored to your company.
              Your managers are not empowered to create training materials.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
