import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import type * as React from "react";

type InviteEmailProps = {
  inviterName: string;
  inviterEmail: string;
  inviteLink: string;
  isTrial: boolean;
};

export default function InviteEmail({
  inviterName = "Sarah Chen",
  inviterEmail = "sarah@example.com",
  inviteLink = "https://mentopanda.com/invite/abc123",
  isTrial = true,
}: InviteEmailProps) {
  // HSL values extracted from globals.css for better email client compatibility
  const primaryColor = "hsl(222.2, 47.4%, 11.2%)";
  const brandColor = "hsl(175, 70%, 41%)";
  const brandForegroundColor = "hsl(0, 0%, 100%)";
  const borderColor = "hsl(214.3, 31.8%, 91.4%)";
  const mutedForegroundColor = "hsl(215.4, 16.3%, 46.9%)";
  const foregroundColor = "hsl(222.2, 84%, 4.9%)"; // Default text color

  // Conditional text
  const previewText = isTrial
    ? "You're invited! Try MentoPanda Free"
    : `${inviterName} invited you to MentoPanda!`;
  const introText = isTrial ? (
    <>
      {inviterName} ({inviterEmail}) invited you to a free 2-week trial of
      MentoPanda. Practice and improve your communication skills for challenging
      workplace scenarios.
    </>
  ) : (
    <>
      {inviterName} ({inviterEmail}) invited you to join MentoPanda. Practice
      and improve your communication skills for challenging workplace scenarios.
    </>
  );
  const buttonText = isTrial ? "Start 2-Week Free Trial" : "Join MentoPanda";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: brandColor,
                "brand-foreground": brandForegroundColor,
                primary: primaryColor,
                border: borderColor,
                foreground: foregroundColor,
                "muted-foreground": mutedForegroundColor,
              },
            },
          },
        }}
      >
        <Body className="bg-white font-sans">
          <Container className="mx-auto py-8 px-4 max-w-lg">
            <Section className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm text-center">
              <Img
                src="https://www.mentopanda.com/panda-light.png"
                width="80"
                height="80"
                alt="MentoPanda Logo"
                className="mx-auto mb-6"
              />
              <Heading className="text-2xl font-bold text-primary mb-4 text-center">
                {inviterName} invited you to MentoPanda!
              </Heading>

              <Text className="text-gray-700 mb-6 text-center">
                {introText}
              </Text>

              <Section className="bg-gray-50 rounded-lg p-6 mb-6">
                <Text className="text-l font-semibold text-primary text-center mb-2">
                  Master difficult conversations by practicing with AI
                  characters.
                </Text>
              </Section>

              <Section className="text-center mb-8">
                <Button
                  style={{
                    backgroundColor: brandColor,
                    color: brandForegroundColor,
                    fontWeight: "bold",
                    padding: "12px 48px", // Equivalent to py-3 px-12
                    borderRadius: "9999px", // Equivalent to rounded-full
                    textDecoration: "none", // Ensure no underline on the button itself
                  }}
                  href={inviteLink}
                >
                  {buttonText}
                </Button>
              </Section>

              <Section className="text-center mt-4">
                <Text className="text-xs text-muted-foreground">
                  Or type this link into your browser:
                  <br />
                  <Link href={inviteLink} className="text-brand underline">
                    {inviteLink}
                  </Link>
                </Text>
              </Section>

              <Hr className="border-border my-6" />

              <Text className="text-sm text-gray-500 text-center">
                For your security: Please ensure you know {inviterName} before
                accepting.
              </Text>
            </Section>

            <Section className="mt-8 text-center">
              <Text className="text-xs text-muted-foreground">
                MentoPanda - Your AI mentor for communication skills
              </Text>
              <Link
                href="https://mentopanda.com"
                className="text-xs text-brand"
              >
                mentopanda.com
              </Link>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
