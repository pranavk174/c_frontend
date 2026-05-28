"use client";

import Image from "next/image";

interface RingProps {
  segments: number;
  url: string;

  // true = seen
  // false = unseen
  seenStories: boolean[];
}

const StoryRing = ({ segments = 1, url, seenStories = [] }: RingProps) => {
  const radius = 42;
  const stroke = 4;

  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  // Single Story => Full Ring
  if (segments === 1) {
    const isSeen = seenStories[0];

    return (
      <div className="relative w-[84px] h-[84px]">
        <svg height={radius * 2} width={radius * 2} className="-rotate-90">
          <circle
            stroke={isSeen ? "#667781" : "#00a884"}
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        <Image priority
          alt="image"
          height={200}
          width={200}
          src={url}
          className="absolute left-[10px] top-[10px] w-16 h-16 rounded-full object-cover"
        />
      </div>
    );
  }

  // Multiple Stories
  const gap = 6;
  const segmentLength = circumference / segments;
  const dashLength = segmentLength - gap;

  return (
    <div className="relative w-[84px] h-[84px]">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        {Array.from({ length: segments }).map((_, index) => {
          const offset = index * segmentLength;

          const isSeen = seenStories[index];

          return (
            <circle
              key={index}
              stroke={isSeen ? "#667781" : "#00a884"}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={`${dashLength} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          );
        })}
      </svg>

      <Image
        priority
        alt="image"
        height={200}
        width={200}
        src={url}

        className="absolute left-[10px] top-[10px] w-16 h-16 rounded-full object-cover"
      />
    </div>
  );
};

export default StoryRing;
