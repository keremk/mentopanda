import { CharacterCard } from "@/components/character-card"
import { ReactNode } from "react"
import { RolePlayer } from "@/types/chat-types";

type ParticipantContainerProps = {
  rolePlayers: RolePlayer[]
  activeRolePlayer: string
  isInConversation: boolean
  children: ReactNode
}

export function RolePlayersContainer({ 
  rolePlayers, 
  activeRolePlayer, 
  isInConversation, 
  children 
}: ParticipantContainerProps) {
  const getGridClass = () => {
    switch (rolePlayers.length) {
      case 1:
        return 'grid-cols-1'
      case 2:
        return 'grid-cols-2 gap-8'
      case 3:
      case 4:
        return 'grid-cols-2 md:grid-cols-4 gap-6'
      default:
        return 'grid-cols-1'
    }
  }

  return (
    <div className={`flex justify-center ${rolePlayers.length > 2 ? 'items-start' : 'items-center'} min-h-[300px]`}>
      <div className={`grid ${getGridClass()} auto-rows-max content-start`}>
        {rolePlayers.map((rolePlayer) => (
          <CharacterCard
            key={rolePlayer.name}
            name={rolePlayer.name}
            avatarUrl={rolePlayer.avatarUrl}
            isActive={rolePlayer.name === activeRolePlayer}
            isInConversation={isInConversation}
          >
            {children}
          </CharacterCard>
        ))}
      </div>
    </div>
  )
}

