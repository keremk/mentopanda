import Link from "next/link";
import {
  SiGithub,
  SiDiscord,
  SiX,
  SiLinkedin,
} from "@icons-pack/react-simple-icons";

export function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              © 2024 MentoPanda. All rights reserved.
            </p>
            <div className="mt-2 space-x-4">
              <Link
                href="/privacy"
                className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Contact Us
              </Link>
            </div>
          </div>
          <div className="flex space-x-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <SiGithub size={24} />
            </a>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <SiDiscord size={24} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <SiX size={24} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <SiLinkedin size={24} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
