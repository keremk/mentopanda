"use client";

import {
  useState,
  useEffect,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

interface CharacterCardProps {
  name: string;
  avatarUrl: string;
  children: ReactNode;
  isActive?: boolean;
  isInConversation: boolean;
}

export function CharacterCard({
  name,
  avatarUrl,
  children,
  isActive = false,
  isInConversation,
}: CharacterCardProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isInConversation) {
      setShowContent(true);
    } else {
      const timer = setTimeout(() => setShowContent(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isInConversation]);

  return (
    <Card
      className={`w-[220px] h-[300px] transition-all duration-200 
        hover:shadow-md ${
          isActive
            ? "ring-2 ring-primary shadow-lg"
            : "hover:ring-1 hover:ring-primary/50"
        }`}
    >
      <CardContent className="h-full pt-8 px-6 pb-6 flex flex-col items-center">
        <div className="w-full flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="w-32 h-32 relative">
            <AnimatePresence>
              {showContent && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <Avatar className="w-32 h-32 border-2 border-background shadow-md">
                    <AvatarImage src={avatarUrl} alt={name} />
                    <AvatarFallback className="text-2xl">
                      {name[0]}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {showContent && (
              <motion.h3
                className="font-semibold text-lg text-center text-foreground/80"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.1,
                }}
              >
                {name}
              </motion.h3>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {showContent && (
            <motion.div
              className="w-full px-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.2 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
