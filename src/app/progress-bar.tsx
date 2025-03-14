interface ProgressBarProps {
  progress: number;
  isActive: boolean;
}

export function ProgressBar({ progress, isActive }: ProgressBarProps) {
  return (
    <div className="h-[2px] w-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
      <div
        className="h-full bg-brand transition-all duration-300 ease-linear"
        style={{
          width: `${progress}%`,
          opacity: isActive ? 1 : 0.3,
        }}
      />
    </div>
  );
}
