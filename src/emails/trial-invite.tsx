import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
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
};

export default function TrialInviteEmail({
  inviterName = "Sarah Chen",
  inviterEmail = "sarah@example.com",
  inviteLink = "https://mentopanda.com/invite/abc123",
}: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Sign up for a free trial of MentoPanda</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto py-8 px-4">
            <Section className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
              <Heading className="text-2xl font-bold text-[#3A3B7B] mb-4 text-center">
                You&apos;re invited to try MentoPanda for 2 weeks
              </Heading>

              <Text className="text-gray-700 mb-6 text-center">
                {inviterName} ({inviterEmail}) has invited you to try MentoPanda and see if it helps you and your team to improve communication skills in challenging situations in the workplace.
              </Text>

              <Section className="bg-gray-50 rounded-lg p-6 mb-6">
                <Text className="text-l font-semibold text-[#3A3B7B] text-center mb-2">
                  MentoPanda is a platform where you can practice with AI
                  characters.
                </Text>
              </Section>

              <Section className="text-center mb-8">
                <Button
                  className="bg-[#F45B69] text-white font-bold py-3 px-12 rounded-full"
                  href={inviteLink}
                >
                  Sign up for free
                </Button>
              </Section>

              <Hr className="border-gray-200 my-6" />

              <Text className="text-sm text-gray-500 text-center">
                For security: Please verify that you know {inviterName} before
                accepting this invitation.
              </Text>
            </Section>

            <Section className="mt-8 text-center">
              <Text className="text-xs text-gray-400">
                MentoPanda - Your AI mentor for communication skills
              </Text>
              <Link
                href="https://mentopanda.com"
                className="text-xs text-[#F45B69]"
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
