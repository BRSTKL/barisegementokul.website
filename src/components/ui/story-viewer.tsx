"use client";

import * as React from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pause,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

export interface Story {
  id: string;
  type: "image" | "video";
  src: string;
  duration?: number;
  label?: string;
  caption?: string;
}

export interface StoryViewerProps {
  stories: Story[];
  username: string;
  avatar: string;
  timestamp?: string;
  onStoryView?: (storyId: string) => void;
  onAllStoriesViewed?: () => void;
  className?: string;
}

const DEFAULT_IMAGE_DURATION = 5000;

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes <= 1 ? "Just now" : `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return `${Math.floor(diffHours / 24)}d ago`;
}

interface StoryThumbnailProps {
  stories: Story[];
  username: string;
  viewedIndices: Set<number>;
  onClick: () => void;
  className?: string;
}

function StoryThumbnail({
  stories,
  username,
  viewedIndices,
  onClick,
  className,
}: StoryThumbnailProps) {
  const segmentCount = stories.length;
  const gapDegrees = segmentCount > 1 ? 12 : 0;
  const segmentDegrees = (360 - gapDegrees * segmentCount) / segmentCount;
  const allViewed = viewedIndices.size === stories.length;
  const lastStory = stories[stories.length - 1];

  const thumbnailImage = React.useMemo(() => {
    for (let index = stories.length - 1; index >= 0; index -= 1) {
      if (stories[index].type === "image") {
        return stories[index].src;
      }
    }

    return null;
  }, [stories]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center gap-2 rounded-lg bg-transparent outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      aria-label={`View ${username}'s stories`}
    >
      <div className="relative h-[72px] w-[72px]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
          {stories.map((_, index) => {
            const startAngle = -90 + index * (segmentDegrees + gapDegrees);
            const endAngle = startAngle + segmentDegrees;
            const isViewed = viewedIndices.has(index);
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const radius = 46;
            const x1 = 50 + radius * Math.cos(startRad);
            const y1 = 50 + radius * Math.sin(startRad);
            const x2 = 50 + radius * Math.cos(endRad);
            const y2 = 50 + radius * Math.sin(endRad);
            const largeArc = segmentDegrees > 180 ? 1 : 0;

            return (
              <path
                key={`${username}-${index}`}
                d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                className={cn(
                  "transition-colors duration-300",
                  isViewed || allViewed
                    ? "stroke-muted-foreground/30"
                    : "stroke-primary",
                )}
              />
            );
          })}
        </svg>

        <div className="absolute inset-[5px] rounded-full bg-background p-[2px]">
          <div className="h-full w-full overflow-hidden rounded-full bg-muted">
            {lastStory.type === "video" ? (
              <video
                src={lastStory.src}
                poster={thumbnailImage ?? undefined}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={lastStory.src}
                alt={`${username}'s story`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            )}
          </div>
        </div>
      </div>

      <span className="max-w-[80px] truncate text-xs text-muted-foreground">
        {username}
      </span>
    </button>
  );
}

interface ProgressBarProps {
  count: number;
  currentIndex: number;
  progress: number;
  viewedIndices: Set<number>;
}

function ProgressBar({
  count,
  currentIndex,
  progress,
  viewedIndices,
}: ProgressBarProps) {
  return (
    <div className="flex w-full gap-1 px-2">
      {Array.from({ length: count }).map((_, index) => {
        const isActive = index === currentIndex;
        const isCompleted = viewedIndices.has(index) && index < currentIndex;
        const isPast = index < currentIndex;

        return (
          <div
            key={`progress-${index}`}
            className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30"
          >
            <motion.div
              className="h-full rounded-full bg-white"
              initial={{ width: isPast || isCompleted ? "100%" : "0%" }}
              animate={{
                width: isActive ? `${progress}%` : isPast ? "100%" : "0%",
              }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
        );
      })}
    </div>
  );
}

interface StoryContentProps {
  story: Story;
  isMuted: boolean;
  isInitialLoading: boolean;
  isBuffering: boolean;
  onVideoReady: (duration: number) => void;
  onVideoTimeUpdate: (currentTime: number, duration: number) => void;
  onVideoWaiting: () => void;
  onVideoPlaying: () => void;
  onVideoEnded: () => void;
  onImageLoad: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

function StoryContent({
  story,
  isMuted,
  isInitialLoading,
  isBuffering,
  onVideoReady,
  onVideoTimeUpdate,
  onVideoWaiting,
  onVideoPlaying,
  onVideoEnded,
  onImageLoad,
  videoRef,
}: StoryContentProps) {
  const showSpinner = isInitialLoading || isBuffering;

  return (
    <>
      {showSpinner ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      ) : null}

      {story.type === "video" ? (
        <video
          ref={videoRef}
          src={story.src}
          className={cn(
            "h-full w-full object-contain transition-opacity duration-200",
            isInitialLoading ? "opacity-0" : "opacity-100",
          )}
          autoPlay
          playsInline
          muted={isMuted}
          onCanPlay={(event) => {
            onVideoReady(event.currentTarget.duration * 1000);
          }}
          onTimeUpdate={(event) => {
            onVideoTimeUpdate(event.currentTarget.currentTime, event.currentTarget.duration);
          }}
          onWaiting={onVideoWaiting}
          onPlaying={onVideoPlaying}
          onEnded={onVideoEnded}
        />
      ) : (
        <img
          src={story.src}
          alt={story.caption ?? ""}
          className={cn(
            "h-full w-full object-contain transition-opacity duration-200",
            isInitialLoading ? "opacity-0" : "opacity-100",
          )}
          onLoad={onImageLoad}
        />
      )}
    </>
  );
}

interface StoryViewerModalProps {
  stories: Story[];
  username: string;
  avatar: string;
  timestamp?: string;
  initialIndex: number;
  viewedIndices: Set<number>;
  onClose: () => void;
  onStoryChange: (index: number) => void;
}

function StoryViewerModal({
  stories,
  username,
  avatar,
  timestamp,
  initialIndex,
  viewedIndices,
  onClose,
  onStoryChange,
}: StoryViewerModalProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [progress, setProgress] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  const [duration, setDuration] = React.useState(DEFAULT_IMAGE_DURATION);
  const [localViewedIndices, setLocalViewedIndices] = React.useState<Set<number>>(
    () => new Set(viewedIndices),
  );
  const [direction, setDirection] = React.useState(0);
  const [isVideoReady, setIsVideoReady] = React.useState(false);
  const [isVideoBuffering, setIsVideoBuffering] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const progressIntervalRef = React.useRef<number | null>(null);
  const startTimeRef = React.useRef(0);
  const elapsedRef = React.useRef(0);

  const currentStory = stories[currentIndex];

  const goToNext = React.useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      elapsedRef.current = 0;
      return;
    }

    onClose();
  }, [currentIndex, onClose, stories.length]);

  const goToPrevious = React.useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      elapsedRef.current = 0;
      return;
    }

    setProgress(0);
    elapsedRef.current = 0;
  }, [currentIndex]);

  React.useEffect(() => {
    setLocalViewedIndices((prev) => {
      const next = new Set(prev);
      next.add(currentIndex);
      return next;
    });
    onStoryChange(currentIndex);
  }, [currentIndex, onStoryChange]);

  React.useEffect(() => {
    if (currentStory.type === "image") {
      setDuration(currentStory.duration ?? DEFAULT_IMAGE_DURATION);
    }
  }, [currentStory]);

  React.useEffect(() => {
    if (currentStory.type === "video") {
      if (isPaused) {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      } else if (isVideoReady && !isVideoBuffering) {
        if (videoRef.current && videoRef.current.paused) {
          videoRef.current.play().catch(() => undefined);
        }
      }
      return undefined;
    }

    if (isPaused || !isVideoReady) {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }
      return undefined;
    }

    startTimeRef.current = Date.now() - elapsedRef.current;

    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      elapsedRef.current = elapsed;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        goToNext();
      }
    }, 50);

    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentStory.type, duration, goToNext, isPaused, isVideoBuffering, isVideoReady]);

  React.useEffect(() => {
    setProgress(0);
    elapsedRef.current = 0;
    startTimeRef.current = Date.now();
    setIsVideoReady(false);
    setIsVideoBuffering(false);
  }, [currentIndex]);

  const handleVideoReady = React.useCallback((videoDuration: number) => {
    setDuration(videoDuration);
    setIsVideoReady(true);
    setIsVideoBuffering(false);
  }, []);

  const handleVideoTimeUpdate = React.useCallback((currentTime: number, videoDuration: number) => {
    if (videoDuration > 0) {
      setProgress((currentTime / videoDuration) * 100);
    }
  }, []);

  const handleVideoWaiting = React.useCallback(() => {
    setIsVideoBuffering(true);
  }, []);

  const handleVideoPlaying = React.useCallback(() => {
    setIsVideoBuffering(false);
  }, []);

  const handleVideoEnded = React.useCallback(() => {
    goToNext();
  }, [goToNext]);

  const handleImageLoad = React.useCallback(() => {
    setIsVideoReady(true);
  }, []);

  const handlePointerDown = React.useCallback(() => {
    setIsPaused(true);
  }, []);

  const handlePointerUp = React.useCallback(() => {
    setIsPaused(false);
  }, []);

  const handleTap = React.useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (!containerRef.current) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const clientX = "touches" in event ? event.changedTouches[0].clientX : event.clientX;
      const x = clientX - rect.left;

      if (x < rect.width / 2) {
        goToPrevious();
      } else {
        goToNext();
      }
    },
    [goToNext, goToPrevious],
  );

  const handleDragEnd = React.useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipeThreshold = 50;
      const velocityThreshold = 500;

      if (Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > velocityThreshold) {
        if (info.offset.x > 0) {
          goToPrevious();
        } else {
          goToNext();
        }
      }

      if (info.offset.y > 100 || info.velocity.y > 500) {
        onClose();
      }
    },
    [goToNext, goToPrevious, onClose],
  );

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case "Escape":
          onClose();
          break;
        case " ":
          event.preventDefault();
          setIsPaused((prev) => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrevious, onClose]);

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        ref={containerRef}
        className="relative mx-auto flex h-full w-full max-w-lg flex-col overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="absolute left-0 right-0 top-0 z-20 bg-gradient-to-b from-black/70 to-transparent pb-4 pt-2">
          <ProgressBar
            count={stories.length}
            currentIndex={currentIndex}
            progress={progress}
            viewedIndices={localViewedIndices}
          />

          <div className="mt-3 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 overflow-hidden rounded-full">
                <img src={avatar} alt={username} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">{username}</span>
                {timestamp ? (
                  <span className="text-xs text-white/60">{formatTimestamp(timestamp)}</span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isPaused ? (
                <div className="flex items-center gap-1 text-white/80">
                  <Pause className="h-4 w-4" />
                  <span className="text-xs">Paused</span>
                </div>
              ) : null}

              {currentStory.type === "video" ? (
                <button
                  type="button"
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-md text-white transition-colors hover:bg-white/20",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                  )}
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsMuted((prev) => !prev);
                  }}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              ) : null}

              <button
                type="button"
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-md text-white transition-colors hover:bg-white/20",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                )}
                onClick={(event) => {
                  event.stopPropagation();
                  onClose();
                }}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div
          className="relative flex flex-1 select-none items-center justify-center overflow-hidden"
          onClick={handleTap}
        >
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentStory.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <StoryContent
                story={currentStory}
                isMuted={isMuted}
                isInitialLoading={!isVideoReady}
                isBuffering={isVideoBuffering}
                onVideoReady={handleVideoReady}
                onVideoTimeUpdate={handleVideoTimeUpdate}
                onVideoWaiting={handleVideoWaiting}
                onVideoPlaying={handleVideoPlaying}
                onVideoEnded={handleVideoEnded}
                onImageLoad={handleImageLoad}
                videoRef={videoRef}
              />
            </motion.div>
          </AnimatePresence>

          {currentStory.label || currentStory.caption ? (
            <div className="pointer-events-none absolute bottom-8 left-4 right-4 z-20 flex">
              <div className="max-w-sm rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-white shadow-2xl backdrop-blur-md">
                {currentStory.label ? (
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">
                    {currentStory.label}
                  </div>
                ) : null}
                {currentStory.caption ? (
                  <p className="text-sm leading-relaxed text-white/90">{currentStory.caption}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between px-4 md:flex">
          <button
            type="button"
            className={cn(
              "pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            )}
            onClick={(event) => {
              event.stopPropagation();
              goToPrevious();
            }}
            disabled={currentIndex === 0}
            aria-label="Previous story"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            type="button"
            className={cn(
              "pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
            )}
            onClick={(event) => {
              event.stopPropagation();
              goToNext();
            }}
            aria-label={currentIndex === stories.length - 1 ? "Close" : "Next story"}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const StoryViewer = React.forwardRef<HTMLDivElement, StoryViewerProps>(
  (
    {
      stories,
      username,
      avatar,
      timestamp,
      onStoryView,
      onAllStoriesViewed,
      className,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [viewedIndices, setViewedIndices] = React.useState<Set<number>>(() => new Set());

    const firstUnviewedIndex = React.useMemo(() => {
      for (let index = 0; index < stories.length; index += 1) {
        if (!viewedIndices.has(index)) {
          return index;
        }
      }

      return 0;
    }, [stories.length, viewedIndices]);

    const handleStoryChange = React.useCallback(
      (index: number) => {
        setViewedIndices((prev) => {
          const next = new Set(prev);
          next.add(index);

          if (next.size === stories.length && onAllStoriesViewed) {
            onAllStoriesViewed();
          }

          return next;
        });

        if (onStoryView) {
          onStoryView(stories[index].id);
        }
      },
      [onAllStoriesViewed, onStoryView, stories],
    );

    return (
      <>
        <div ref={ref} className={className}>
          <StoryThumbnail
            stories={stories}
            username={username}
            viewedIndices={viewedIndices}
            onClick={() => setIsOpen(true)}
          />
        </div>

        <AnimatePresence>
          {isOpen ? (
            <StoryViewerModal
              stories={stories}
              username={username}
              avatar={avatar}
              timestamp={timestamp}
              initialIndex={firstUnviewedIndex}
              viewedIndices={viewedIndices}
              onClose={() => setIsOpen(false)}
              onStoryChange={handleStoryChange}
            />
          ) : null}
        </AnimatePresence>
      </>
    );
  },
);

StoryViewer.displayName = "StoryViewer";

export { StoryViewer };
