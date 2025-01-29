"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "What is MentoPanda?",
    answer:
      "acme.ai is a platform that helps you build and manage your AI-powered applications. It provides tools and services to streamline the development and deployment of AI solutions.",
  },
  {
    question: "How can I get started with acme.ai?",
    answer:
      "Getting started is easy! Sign up for a free account, explore our documentation, and begin with our quickstart guide. Our platform provides comprehensive tutorials and examples to help you get up and running quickly.",
  },
  {
    question: "What types of AI models does acme.ai support?",
    answer:
      "We support a wide range of AI models including but not limited to natural language processing, computer vision, predictive analytics, and custom machine learning models. Our platform is designed to be flexible and accommodate various AI frameworks and architectures.",
  },
  {
    question: "Is acme.ai suitable for beginners in AI development?",
    answer:
      "Yes! acme.ai is designed to be accessible for developers of all skill levels. We provide extensive documentation, tutorials, and support resources to help beginners get started with AI development while also offering advanced features for experienced developers.",
  },
  {
    question: "What kind of support does acme.ai provide?",
    answer:
      "We offer comprehensive support including technical documentation, community forums, email support, and dedicated customer success teams for enterprise customers. Our support team is available to help you with any questions or issues you may encounter.",
  },
]

export function FaqSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <div className="text-red-500 font-medium mb-4">FAQ</div>
          <h2 className="text-4xl font-bold mb-16">Frequently asked questions</h2>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-12 text-muted-foreground">
            Still have questions? Email us at{" "}
            <a href="mailto:support@acme.ai" className="text-primary hover:underline">
              support@acme.ai
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

