import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ImageIcon, PlayCircle, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StoryViewer, type Story } from '@/components/ui/story-viewer';
import { type Project } from '@/data/projects';

interface ProjectStoryPageProps {
  project: Project;
  onBack: () => void;
}

interface StoryCollection {
  id: string;
  label: string;
  subtitle: string;
  stories: Story[];
  avatar: string;
  timestamp: string;
}

const PROJECT_CHAPTERS: Record<
  string,
  { label: string; subtitle: string; indices: number[] }[]
> = {
  '1': [
    { label: 'Baseline', subtitle: 'site scan', indices: [0, 1] },
    { label: 'Retrofit', subtitle: 'system scope', indices: [2, 3] },
    { label: 'Outcome', subtitle: 'efficiency gain', indices: [4] },
  ],
  '2': [
    { label: 'Shopfloor', subtitle: 'workflow map', indices: [0, 1, 2] },
    { label: 'Lean Run', subtitle: 'bottleneck fix', indices: [3, 4] },
    { label: 'Control', subtitle: 'quality follow-up', indices: [5, 6] },
  ],
  '3': [
    { label: 'Field Plan', subtitle: 'site coordination', indices: [0, 1] },
    { label: 'KPI Loop', subtitle: 'tracking cadence', indices: [2, 3] },
    { label: 'Output', subtitle: 'execution review', indices: [4, 5] },
  ],
  '4': [
    { label: 'Audit', subtitle: 'evidence trail', indices: [0, 1] },
    { label: 'Standards', subtitle: 'process setup', indices: [2] },
    { label: 'Result', subtitle: 'control clarity', indices: [3] },
  ],
};

const CATEGORY_ACCENTS: Record<
  string,
  { hero: string; chip: string; avatarPrimary: string; avatarSecondary: string }
> = {
  Sustainability: {
    hero: 'from-yellow-500/18 via-orange-500/10 to-background',
    chip: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200',
    avatarPrimary: '#f59e0b',
    avatarSecondary: '#fb7185',
  },
  Production: {
    hero: 'from-sky-500/18 via-cyan-500/10 to-background',
    chip: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
    avatarPrimary: '#0ea5e9',
    avatarSecondary: '#22d3ee',
  },
  Operations: {
    hero: 'from-emerald-500/18 via-teal-500/10 to-background',
    chip: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    avatarPrimary: '#10b981',
    avatarSecondary: '#14b8a6',
  },
  Standardization: {
    hero: 'from-fuchsia-500/18 via-violet-500/10 to-background',
    chip: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200',
    avatarPrimary: '#d946ef',
    avatarSecondary: '#8b5cf6',
  },
};

function buildAvatarDataUri(label: string, primary: string, secondary: string) {
  const initials = label
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="100%" stop-color="${secondary}" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="48" fill="url(#g)" />
      <text x="50%" y="56%" text-anchor="middle" font-size="32" font-family="Arial, sans-serif" font-weight="700" fill="white">
        ${initials}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildStoryCollections(project: Project): StoryCollection[] {
  const gallery = project.gallery ?? [];
  const accent = CATEGORY_ACCENTS[project.category] ?? CATEGORY_ACCENTS.Sustainability;
  const chapters =
    PROJECT_CHAPTERS[project.id] ??
    [
      {
        label: 'Highlights',
        subtitle: 'project story',
        indices: gallery.map((_, index) => index),
      },
    ];

  const collections: StoryCollection[] = [];

  chapters.forEach((chapter, chapterIndex) => {
    const stories: Story[] = chapter.indices
      .map((imageIndex) => gallery[imageIndex])
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item, itemIndex) => ({
        id: `${project.id}-${chapter.label.toLowerCase()}-${itemIndex}`,
        type: 'image',
        src: item.src,
        label: item.label,
        caption: item.caption,
        duration: 4800,
      }));

    if (!stories.length) {
      return;
    }

    collections.push({
      id: `${project.id}-${chapter.label.toLowerCase().replace(/\s+/g, '-')}`,
      label: chapter.label,
      subtitle: chapter.subtitle,
      stories,
      avatar: buildAvatarDataUri(
        chapter.label,
        accent.avatarPrimary,
        accent.avatarSecondary,
      ),
      timestamp: new Date(Date.now() - (chapterIndex + 1) * 1000 * 60 * 90).toISOString(),
    });
  });

  return collections;
}

function buildProjectNarrative(project: Project) {
  const tags = project.tags ?? [];
  const metrics = project.metrics ?? [];
  const detailedMetrics = project.detailedMetrics ?? [];

  return [
    {
      title: 'Project focus',
      body:
        project.longDescription ??
        project.description,
    },
    {
      title: 'What was optimized',
      body:
        tags.length > 0
          ? `${tags.slice(0, 4).join(', ')} were the core workstreams across this case study.`
          : 'Operational clarity, documentation discipline, and measurable engineering improvements shaped the delivery plan.',
    },
    {
      title: 'Measured outcome',
      body:
        metrics.length > 0
          ? metrics.map((metric) => `${metric.label}: ${metric.value}`).join(' • ')
          : detailedMetrics.map((metric) => `${metric.label}: ${metric.value}`).join(' • '),
    },
  ];
}

export function ProjectStoryPage({ project, onBack }: ProjectStoryPageProps) {
  const accent = CATEGORY_ACCENTS[project.category] ?? CATEGORY_ACCENTS.Sustainability;
  const storyCollections = React.useMemo(() => buildStoryCollections(project), [project]);
  const narrative = React.useMemo(() => buildProjectNarrative(project), [project]);
  const projectTags = project.tags ?? [];
  const projectMetrics = project.metrics ?? [];
  const gallery = project.gallery ?? [];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_42%)]" />
        <div className="container relative mx-auto px-4 pb-16 pt-6">
          <div className="sticky top-6 z-30 w-fit">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="border-border/70 bg-background/80 backdrop-blur-md"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Portfolio
            </Button>
          </div>

          <section className="mt-6 overflow-hidden rounded-[32px] border border-border/70 bg-card/70 shadow-2xl shadow-black/15 backdrop-blur-xl">
            <div className={`absolute inset-0 bg-gradient-to-br ${accent.hero}`} />
            <div className="relative grid gap-10 p-6 sm:p-8 xl:grid-cols-[1.05fr_0.95fr] xl:p-10">
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline" className="border-white/15 bg-background/60">
                    Story Case Study
                  </Badge>
                  <Badge className={accent.chip}>{project.category}</Badge>
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-4xl text-4xl font-bold leading-tight sm:text-5xl xl:text-6xl">
                    {project.title}
                  </h1>
                  <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
                    {project.longDescription ?? project.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {projectTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-background/75">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {projectMetrics.map((metric) => (
                    <Card
                      key={metric.label}
                      className="border-border/60 bg-background/70 shadow-lg shadow-black/5"
                    >
                      <CardContent className="p-5">
                        <div className="text-2xl font-bold text-foreground">{metric.value}</div>
                        <p className="mt-2 text-sm text-muted-foreground">{metric.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Card className="border-white/10 bg-slate-950/75 text-white shadow-2xl shadow-black/20">
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-3">
                    <Badge className="border-white/10 bg-white/10 text-white hover:bg-white/10">
                      <PlayCircle className="mr-2 h-3.5 w-3.5" />
                      Story Highlights
                    </Badge>
                    <h2 className="text-2xl font-semibold leading-tight">
                      Browse the project like an Instagram-style case study.
                    </h2>
                    <p className="text-sm leading-7 text-slate-300">
                      Tap any highlight below to open the full-screen story flow. Every frame includes a short field note so the project can be scanned quickly.
                    </p>
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {storyCollections.map((collection) => (
                      <div
                        key={collection.id}
                        className="flex min-w-[104px] flex-col items-center gap-2 text-center"
                      >
                        <StoryViewer
                          stories={collection.stories}
                          username={collection.label}
                          avatar={collection.avatar}
                          timestamp={collection.timestamp}
                        />
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                          {collection.subtitle}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
                      <Sparkles className="h-4 w-4 text-sky-300" />
                      Story mode guidance
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      Hold to pause, tap left or right to navigate, and swipe to move between frames. The visual notes mirror how these projects would be presented in a fast executive walkthrough.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="border-border/70 bg-card/80 shadow-xl shadow-black/5">
              <CardContent className="p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">Project narrative</h2>
                    <p className="text-sm text-muted-foreground">
                      A compact summary before opening the full story sequence.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {narrative.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="rounded-3xl border border-border/60 bg-background/70 p-5"
                    >
                      <div className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">
                        {item.title}
                      </div>
                      <p className="mt-3 text-sm leading-7 text-foreground/85">
                        {item.body}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/80 shadow-xl shadow-black/5">
              <CardContent className="p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">Annotated frames</h2>
                    <p className="text-sm text-muted-foreground">
                      Quick visual scan of the same images with short overlay notes.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {gallery.map((item, index) => (
                    <motion.article
                      key={`${item.src}-${index}`}
                      initial={{ opacity: 0, y: 22 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="group relative overflow-hidden rounded-[28px] border border-border/60 bg-background/60"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden">
                        <img
                          src={item.src}
                          alt={item.alt}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                        <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-white shadow-xl backdrop-blur-md">
                          {item.label ? (
                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">
                              {item.label}
                            </p>
                          ) : null}
                          {item.caption ? (
                            <p className="mt-1 text-sm leading-6 text-white/90">
                              {item.caption}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}
