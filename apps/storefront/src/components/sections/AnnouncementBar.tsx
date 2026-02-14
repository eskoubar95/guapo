interface AnnouncementBarProps {
  text: string;
  subtext?: string;
  className?: string;
}

export function AnnouncementBar({
  text,
  subtext,
  className = "bg-secondary text-primary",
}: AnnouncementBarProps) {
  return (
    <div className={`py-3 px-4 ${className}`}>
      <div className="container mx-auto">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="font-medium">{text}</span>
          {subtext && <span className="opacity-90">{subtext}</span>}
        </div>
      </div>
    </div>
  );
}
