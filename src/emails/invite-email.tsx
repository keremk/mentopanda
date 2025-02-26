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
};

export default function InviteEmail({
  inviterName = "Sarah Chen",
  inviterEmail = "sarah@example.com",
  inviteLink = "https://mentopanda.com/invite/abc123",
}: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Join {inviterName}'s project on MentoPanda</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto py-8 px-4">
            <Section className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
              {/* <Section className="text-center mb-6">
                <Img
                  src="https://mentopanda.com/panda-light.svg"
                  width="120"
                  height="120"
                  alt="MentoPanda Logo"
                  className="mx-auto"
                />
              </Section> */}

              <Heading className="text-2xl font-bold text-[#3A3B7B] mb-4 text-center">
                You're invited to join a project on MentoPanda
              </Heading>

              <Text className="text-gray-700 mb-6 text-center">
                {inviterName} ({inviterEmail}) has invited you to collaborate on
                their training project
              </Text>

              <Section className="bg-gray-50 rounded-lg p-6 mb-6">
                <Text className="text-l font-semibold text-[#3A3B7B] text-center mb-2">
                  MentoPanda is a platform where you can practice with AI
                  characters to improve your communication skills.
                </Text>
              </Section>

              <Section className="text-center mb-8">
                <Button
                  className="bg-[#F45B69] text-white font-bold py-3 px-12 rounded-full"
                  href={inviteLink}
                >
                  Join Project
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
