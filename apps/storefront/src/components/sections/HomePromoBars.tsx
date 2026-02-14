interface HomePromoBarsProps {
  bar1: { text: string; subtext: string };
  bar2: { text: string; subtext: string };
}

export function HomePromoBars({ bar1, bar2 }: HomePromoBarsProps) {
  return (
    <>
      <div className="bg-[#3D5A80] text-white py-3 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="font-medium">{bar1.text}</span>
            <span className="opacity-90">{bar1.subtext}</span>
          </div>
        </div>
      </div>
      <div className="bg-[#EFF4F9] text-[#051537] py-3 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="font-medium">{bar2.text}</span>
            <span className="opacity-90">{bar2.subtext}</span>
          </div>
        </div>
      </div>
    </>
  );
}
