"use client"

import { useState, useEffect, cloneElement, ReactElement, ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

interface CharacterCardProps {
  name: string
  avatarUrl: string
  children: ReactNode
  isActive?: boolean
  isInConversation: boolean
}

export function CharacterCard({ 
  name, 
  avatarUrl, 
  children, 
  isActive = false, 
  isInConversation,
}: CharacterCardProps) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isInConversation) {
      setShowContent(true)
    } else {
      const timer = setTimeout(() => setShowContent(false), 500) // Delay to allow animation to complete
      return () => clearTimeout(timer)
    }
  }, [isInConversation])

  return (
    <Card className={`w-[200px] h-[280px] transition-all ${isActive ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="h-full pt-6 px-4 pb-4 flex flex-col items-center justify-between">
        <div className="w-full flex-1 flex flex-col items-center justify-center">
          <div className="w-20 h-20 mb-3">
            <AnimatePresence>
              {showContent && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={avatarUrl} alt={name} />
                    <AvatarFallback>{name[0]}</AvatarFallback>
                  </Avatar>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {showContent && (
              <motion.h3
                className="font-semibold text-lg text-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              >
                {name}
              </motion.h3>
            )}
          </AnimatePresence>
        </div>
        <div className="w-full mt-4">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}

