import { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <div className="flex items-center gap-2">
        <Image
          src="/panda-light.svg"
          alt="MentoPanda Logo"
          width={32}
          height={32}
          className="w-8 h-8"
          priority
        />
        <span className="font-semibold">MentoPanda</span>
      </div>
    ),
    url: '/',
  },
  links: [
    {
      text: 'Docs',
      url: '/docs',
      active: 'nested-url',
    },
    {
      text: 'Blog',
      url: '/blog', 
      active: 'nested-url',
    },
  ],
};