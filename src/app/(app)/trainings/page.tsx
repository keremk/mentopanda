"use client"

import { useEffect } from "react"
import { TrainingDetailsCard } from "@/components/training-details-card"
import { useSearch } from "@/components/providers/search-provider"

export default function TrainingPage() {
  const { filteredTrainings, setFilteredTrainings, initialTrainings } = useSearch()

  useEffect(() => {
    function handleTrainingsFiltered(event: CustomEvent<any>) {
      setFilteredTrainings(event.detail)
    }

    window.addEventListener(
      "trainingsFiltered", 
      handleTrainingsFiltered as EventListener
    )

    return () => {
      window.removeEventListener(
        "trainingsFiltered", 
        handleTrainingsFiltered as EventListener
      )
    }
  }, [setFilteredTrainings])

  return (
    <div className="container mx-auto px-4 sm:px-8 md:px-16 lg:px-24 xl:px-36">
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold">My Trainings</h1>
      </div>
      <div className="space-y-6">
        {filteredTrainings.map((training) => (
          <TrainingDetailsCard key={training.id} training={training} />
        ))}
      </div>
    </div>
  )
}
