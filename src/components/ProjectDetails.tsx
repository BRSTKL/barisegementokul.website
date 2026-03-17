'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Lenis from 'lenis'
import { ZoomParallax } from "@/components/ui/zoom-parallax";
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ProjectDetailsProps {
    projectTitle: string;
    images?: { src: string; alt: string }[];
    onBack: () => void;
}

const defaultImages = [
    {
        src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
        alt: 'Modern architecture building',
    },
    {
        src: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
        alt: 'Urban cityscape at sunset',
    },
    {
        src: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=800&fit=crop&crop=entropy&auto=format&q=80',
        alt: 'Abstract geometric pattern',
    },
    {
        src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
        alt: 'Mountain landscape',
    },
    {
        src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=800&fit=crop&crop=entropy&auto=format&q=80',
        alt: 'Minimalist design elements',
    },
    {
        src: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
        alt: 'Ocean waves and beach',
    },
    {
        src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
        alt: 'Forest trees and sunlight',
    },
];

export function ProjectDetails({ projectTitle, images = defaultImages, onBack }: ProjectDetailsProps) {
    React.useEffect(() => {
        const lenis = new Lenis()

        // Sayfa açıldığında her zaman en üstte başlatır
        lenis.scrollTo(0, { immediate: true })

        function raf(time: number) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }

        requestAnimationFrame(raf)

        return () => {
            lenis.destroy();
        }
    }, [])

    return (
        <main className="dark relative min-h-screen w-full overflow-x-clip bg-background text-foreground">
            <div className="fixed left-4 right-4 top-4 z-50 sm:left-6 sm:right-auto sm:top-6">
                <Button variant="outline" size="sm" onClick={onBack} className="w-full justify-center bg-background/80 backdrop-blur-md sm:w-auto">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Portfolio
                </Button>
            </div>

            <div className="relative z-50 mt-16 flex h-[38vh] flex-col items-center justify-end gap-4 px-4 pb-10 sm:mt-10 sm:h-[45vh] sm:gap-6 sm:pb-12">
                {/* Radial spotlight */}
                <div
                    aria-hidden="true"
                    className={cn(
                        'pointer-events-none absolute -top-1/2 left-1/2 h-[120vmin] w-[120vmin] -translate-x-1/2 rounded-full',
                        'bg-[radial-gradient(ellipse_at_center,theme(colors.primary.DEFAULT/0.2),transparent_50%)]',
                        'blur-[30px]',
                    )}
                />
                <h2 className="text-center text-sm font-medium uppercase tracking-[0.4em] text-muted-foreground sm:text-xl md:text-2xl">
                    Project Study
                </h2>
                <h1 className="z-10 max-w-4xl bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text px-4 text-center text-3xl font-bold text-transparent sm:text-5xl md:text-7xl">
                    {projectTitle}
                </h1>
                <p className="mt-4 animate-pulse text-center text-sm text-muted-foreground sm:mt-8">
                    Scroll Down for Details
                </p>
            </div>
            <div className="mt-8 relative z-0">
                <ZoomParallax images={images} />
            </div>
            <div className="flex h-[32vh] items-center justify-center px-4 sm:h-[50vh]">
                <Button size="lg" className="w-full sm:w-auto" onClick={onBack}>
                    Finish Review
                </Button>
            </div>
        </main>
    );
}
