import { CharacterCard } from "@/components/character-card"
import { ReactNode } from "react"
import { Participant } from "@/types/chat-types";

type ParticipantContainerProps = {
  participants: Participant[]
  activeParticipant: string
  isInConversation: boolean
  children: ReactNode
}

export function ParticipantContainer({ 
  participants, 
  activeParticipant, 
  isInConversation, 
  children 
}: ParticipantContainerProps) {
  const getGridClass = () => {
    switch (participants.length) {
      case 1:
        return 'grid-cols-1'
      case 2:
        return 'grid-cols-2'
      case 3:
      case 4:
        return 'grid-cols-2 md:grid-cols-4'
      default:
        return 'grid-cols-1'
    }
  }

  return (
    <div className={`flex justify-center ${participants.length > 2 ? 'items-start' : 'items-center'} min-h-[280px]`}>
      <div className={`grid ${getGridClass()} gap-4 auto-rows-max content-start`}>
        {participants.map((participant) => (
          <CharacterCard
            key={participant.name}
            name={participant.name}
            avatarUrl={participant.avatarUrl}
            isActive={participant.name === activeParticipant}
            isInConversation={isInConversation}
          >
            {children}
          </CharacterCard>
        ))}
      </div>
    </div>
  )
}

