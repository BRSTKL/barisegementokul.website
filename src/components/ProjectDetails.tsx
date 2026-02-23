'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Lenis from 'lenis'
import { ZoomParallax } from "@/components/ui/zoom-parallax";
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ProjectDetailsProps {
    projectTitle: string;
    onBack: () => void;
}

export function ProjectDetails({ projectTitle, onBack }: ProjectDetailsProps) {
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

    const images = [
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

    return (
        <main className="dark min-h-screen w-full bg-background text-foreground relative">
            <div className="fixed top-6 left-6 z-50">
                <Button variant="outline" size="sm" onClick={onBack} className="bg-background/80 backdrop-blur-md">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Portfolio
                </Button>
            </div>

            <div className="relative flex h-[45vh] items-center justify-end flex-col gap-6 pb-12 z-10">
                {/* Radial spotlight */}
                <div
                    aria-hidden="true"
                    className={cn(
                        'pointer-events-none absolute -top-1/2 left-1/2 h-[120vmin] w-[120vmin] -translate-x-1/2 rounded-full',
                        'bg-[radial-gradient(ellipse_at_center,theme(colors.primary.DEFAULT/0.2),transparent_50%)]',
                        'blur-[30px]',
                    )}
                />
                <h2 className="text-xl md:text-2xl font-medium text-muted-foreground uppercase tracking-widest">
                    Project Study
                </h2>
                <h1 className="text-center text-5xl md:text-7xl font-bold max-w-4xl px-4 z-10 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                    {projectTitle}
                </h1>
                <p className="text-muted-foreground animate-pulse mt-8">
                    Scroll Down for Details
                </p>
            </div>
            <div className="-mt-48 relative z-0">
                <ZoomParallax images={images} />
            </div>
            <div className="h-[50vh] flex items-center justify-center">
                <Button size="lg" onClick={onBack}>
                    Finish Review
                </Button>
            </div>
        </main>
    );
}
