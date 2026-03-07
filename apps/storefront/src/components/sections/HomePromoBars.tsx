interface HomePromoBarsProps {
  bar1: { text: string; subtext: string };
  bar2: { text: string; subtext: string };
}

export function HomePromoBars({ bar1, bar2 }: HomePromoBarsProps) {
  return (
    <>
      <div className="bg-primary text-primary-foreground py-3">
        <div className="section-container">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="font-medium">{bar1.text}</span>
            <span className="opacity-90">{bar1.subtext}</span>
          </div>
        </div>
      </div>
      <div className="bg-secondary text-secondary-foreground py-3">
        <div className="section-container">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="font-medium">{bar2.text}</span>
            <span className="opacity-90">{bar2.subtext}</span>
          </div>
        </div>
      </div>
    </>
  );
}
