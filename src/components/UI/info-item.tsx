interface InfoItemProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function InfoItem({ label, value, icon, className }: InfoItemProps) {
  return (
    <div className={className}>
      <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>

      <div className="flex items-center gap-2">
        {icon}
        <p className="text-base">{value || "—"}</p>
      </div>
    </div>
  );
}
