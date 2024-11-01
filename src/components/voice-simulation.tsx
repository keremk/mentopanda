'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Pause, Play, PhoneOff } from 'lucide-react'

const participants = [
  { id: 1, name: 'Alice', color: 'bg-blue-500' },
  { id: 2, name: 'Bob', color: 'bg-green-500' },
  { id: 3, name: 'Charlie', color: 'bg-yellow-500' },
]

type VoiceSimulationProps = {
  onEndCall: () => void;
  prompt: string;
}

export function VoiceSimulationComponent({ onEndCall, prompt }: VoiceSimulationProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [speakingParticipant, setSpeakingParticipant] = useState<number | null>(null)

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setSpeakingParticipant(Math.floor(Math.random() * participants.length))
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isPaused])

  const togglePause = () => {
    setIsPaused(!isPaused)
    if (isPaused) {
      setSpeakingParticipant(Math.floor(Math.random() * participants.length))
    } else {
      setSpeakingParticipant(null)
    }
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Voice Call in Progress</h3>
      <div className="bg-muted p-4 rounded-md min-h-[300px]">
        <div className="flex flex-wrap justify-center gap-8">
          {participants.map((participant, index) => (
            <div key={participant.id} className="flex flex-col items-center">
              <div className={`w-24 h-24 rounded-full ${participant.color} text-white flex items-center justify-center text-3xl font-semibold`}>
                {participant.name[0]}
              </div>
              <span className="mt-2 text-lg font-medium">{participant.name}</span>
              <div className="mt-2 w-24 h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${speakingParticipant === index ? 'bg-green-500' : 'bg-gray-400'} transition-all duration-300 ease-in-out`}
                  style={{
                    clipPath: speakingParticipant === index 
                      ? 'polygon(0 50%, 5% 45%, 10% 55%, 15% 50%, 20% 45%, 25% 55%, 30% 60%, 35% 45%, 40% 50%, 45% 55%, 50% 45%, 55% 50%, 60% 55%, 65% 50%, 70% 45%, 75% 55%, 80% 50%, 85% 45%, 90% 55%, 95% 50%, 100% 45%, 100% 100%, 0 100%)'
                      : 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center mt-4 space-x-2">
        <Button onClick={togglePause} variant="outline">
          {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
          {isPaused ? 'Resume' : 'Pause'}
        </Button>
        <Button onClick={onEndCall} variant="destructive">
          <PhoneOff className="mr-2 h-4 w-4" /> End Call
        </Button>
      </div>
    </div>
  )
}