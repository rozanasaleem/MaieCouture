"use client";

import { useEffect, useRef } from "react";

export function FounderVideoCard({
  src,
  poster,
  startAt = 1.2,
}: {
  src: string;
  poster?: string;
  startAt?: number;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    function seekToStartFrame() {
      try {
        if (ref.current) {
          ref.current.currentTime = startAt;
        }
      } catch {
        // ignore seek failures and keep default
      }
    }

    video.addEventListener("loadedmetadata", seekToStartFrame);
    return () => {
      video.removeEventListener("loadedmetadata", seekToStartFrame);
    };
  }, [startAt]);

  return (
    <video
      ref={ref}
      className="h-full w-full object-cover object-center"
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      poster={poster}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
