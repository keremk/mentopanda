export function SolutionSection() {
  return (
    <section id="solutions" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <div className="text-red-500 font-medium mb-4">SOLUTIONS</div>
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
          <div>
            <h3 className="text-red-500 font-semibold mb-3">
              Advanced Multi-Modal AI Models
            </h3>
            <p className="text-muted-foreground mb-6">
              Our platform utilizes SOTA AI models to provide
              realistic simulations of conversations for different scenarios.
            </p>
          </div>
          <div>
            <h3 className="text-red-500 font-semibold mb-3">
              Secure Data Handling
            </h3>
            <p className="text-muted-foreground mb-6">
              We prioritize your data security with state-of-the-art encryption
              and strict privacy protocols, ensuring your training progress is securely stored.
            </p>
          </div>
          <div>
            <h3 className="text-red-500 font-semibold mb-3">
              Custom Solutions
            </h3>
            <p className="text-muted-foreground mb-6">
              Reach out to us to discuss your specific needs and we will build a custom set of 
              lessons for your employees.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
