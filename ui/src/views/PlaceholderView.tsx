interface PlaceholderViewProps {
  title: string
}

export function PlaceholderView({ title }: PlaceholderViewProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-arm-text mb-2">{title}</h1>
        <p className="text-arm-textMuted">Coming in Phase 1.2+</p>
      </div>
    </div>
  );
}
