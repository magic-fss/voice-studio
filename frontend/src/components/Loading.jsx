import { useEffect, useState } from 'react';

function SkeletonCard() {
  return (
    <div className="rounded-md bg-bg-secondary border border-border-subtle p-6 animate-pulse">
      <div className="h-3 bg-bg-tertiary rounded w-1/4 mb-4" />
      <div className="space-y-3">
        <div className="h-10 bg-bg-tertiary rounded-md" />
        <div className="h-10 bg-bg-tertiary rounded-md" />
      </div>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-md bg-bg-secondary border border-border-subtle p-6 animate-pulse">
        <div className="h-3 bg-bg-tertiary rounded w-1/3 mb-4" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-24 bg-bg-tertiary rounded-md" />
          <div className="h-24 bg-bg-tertiary rounded-md" />
          <div className="h-24 bg-bg-tertiary rounded-md" />
        </div>
      </div>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

export function AudioPlayer({ src }) {
  return (
    <audio
      controls
      className="w-full h-10 rounded-md"
    >
      <source src={src} type="audio/wav" />
      您的浏览器不支持音频播放
    </audio>
  );
}
