'use client'

import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp, Mic, MicOff, Send, X } from 'lucide-react'
import { ChatBox, ChatMessageProps } from '@/components/chat-box'

export default function ChatSimulation() {
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isAutoMode, setIsAutoMode] = useState(true)
  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessageProps[]>([
    {
      message: "Hello! How are you doing today?",
      sender: {
        name: "Manager",
        avatar: "/placeholder.svg?height=32&width=32"
      },
      isCurrentUser: false
    },
    {
      message: "Hi there! I'm doing well, thanks for asking. How about you?",
      sender: {
        name: "Employee",
        avatar: "/placeholder.svg?height=32&width=32"
      },
      isCurrentUser: true
    }
  ])

  const handleSendMessage = () => {
    if (inputMessage.trim() !== '') {
      const newMessage: ChatMessageProps = {
        message: inputMessage,
        sender: {
          name: "Employee",
          avatar: "/placeholder.svg?height=32&width=32"
        },
        isCurrentUser: true
      }
      setMessages((prevMessages) => [...prevMessages, newMessage])
      setInputMessage('')
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Collapsible
        open={isInstructionsOpen}
        onOpenChange={setIsInstructionsOpen}
        className="mb-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Instructions</h2>
          <CollapsibleTrigger asChild>
            <Button variant="ghost">
              {isInstructionsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="mt-2">
          <p>Here are the instructions for the 1:1 chat simulation between a manager and an employee.</p>
          {/* Add more detailed instructions here */}
        </CollapsibleContent>
      </Collapsible>

      <div className="flex justify-center space-x-4 mb-4">
        {[1, 2, 3, 4].map((id) => (
          <div key={id} className="flex flex-col items-center">
            <Avatar className="h-16 w-16">
              <AvatarImage src={`/placeholder.svg?height=64&width=64`} alt={`User ${id}`} />
              <AvatarFallback>U{id}</AvatarFallback>
            </Avatar>
            <div className="mt-2 h-2 w-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>

      <Card className="mb-4">
        <ChatBox messages={messages} />
      </Card>

      <div className="flex items-center space-x-2">
        <Button
          variant={isMuted ? "destructive" : "outline"}
          size="icon"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Button variant="destructive" size="icon">
          <X className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAutoMode(!isAutoMode)}
        >
          {isAutoMode ? "Manual" : "Auto"}
        </Button>
        <div className="flex-grow relative">
          <Input
            placeholder="Type your message..."
            disabled={isAutoMode}
            className={`pr-10 ${isAutoMode ? 'opacity-50' : ''}`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isAutoMode) {
                handleSendMessage()
              }
            }}
          />
          {!isAutoMode && (
            <Button
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
              onClick={handleSendMessage}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

