type HeroMediaProps = {
  videoSrc?: string;
};

export function HeroMedia({ videoSrc }: HeroMediaProps) {
  if (videoSrc) {
    return (
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src={videoSrc} />
      </video>
    );
  }

  return (
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(32,25,21,0.16)),linear-gradient(140deg,#e8e0d7_0%,#d8c8bc_42%,#b7a295_100%)]" />
  );
}
