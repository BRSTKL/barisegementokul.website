import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
    Zap,
    Wind,
    Sun,
    TrendingUp,
    Award,
    BookOpen,
    Mail,
    Linkedin,
    Github,
    ChevronDown,
    Menu,
    X,
    ExternalLink,
    Download,
    FileText,
    Leaf,
    Package,
    Factory,
    Activity,
    ClipboardCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedNavigationTabs } from '@/components/ui/animated-navigation-tabs';
import { DownloadButton } from '@/components/ui/download-animation';
import { SkyToggle } from '@/components/ui/sky-toggle';
import { PROJECTS, type Project } from '@/data/projects';
import { ProjectDetails } from './ProjectDetails';
import { ProjectStoryPage } from './ProjectStoryPage';
import { OrderTrackerDashboard } from './order-tracker/OrderTrackerDashboard';
import { StoryViewer, type Story } from '@/components/ui/story-viewer';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const ProjectPortfolioDataDemo = React.lazy(() =>
    import('./ProjectPortfolioDataDemo').then((module) => ({ default: module.ProjectPortfolioDataDemo }))
);

const TurbineDataManagementDemo = React.lazy(() =>
    import('./TurbineDataManagementDemo').then((module) => ({ default: module.TurbineDataManagementDemo }))
);

const SolarEstimator = React.lazy(() =>
    import('./SolarEstimatorModern').then((module) => ({ default: module.SolarEstimator }))
);

interface Skill {
    name: string;
    level: number;
    icon: React.ReactNode;
}

interface Experience {
    title: string;
    company: string;
    period: string;
    description: string;
    achievements: string[];
    year: string;
    storySources?: ExperienceStorySource[];
}

interface ExperienceStorySource {
    projectId: string;
    indices?: number[];
    title?: string;
}

interface Education {
    degree: string;
    institution: string;
    location: string;
    period: string;
}

interface Publication {
    title: string;
    journal: string;
    year: string;
    authors: string;
    link: string;
}

const NAV_ITEMS = [
    { id: 'home', tile: 'Home' },
    { id: 'about', tile: 'About' },
    { id: 'projects', tile: 'Projects' },
    { id: 'publications', tile: 'Publications' },
    { id: 'experience', tile: 'Experience' },
    { id: 'education', tile: 'Education' },
    { id: 'contact', tile: 'Contact' }
];

const SECTION_IDS = NAV_ITEMS.map((item) => item.id);

const STORY_CATEGORY_AVATARS: Record<string, { primary: string; secondary: string }> = {
    Sustainability: { primary: '#f59e0b', secondary: '#fb7185' },
    Production: { primary: '#0ea5e9', secondary: '#22d3ee' },
    Operations: { primary: '#10b981', secondary: '#14b8a6' },
    Standardization: { primary: '#d946ef', secondary: '#8b5cf6' }
};

const buildStoryAvatar = (label: string, category: string) => {
    const palette = STORY_CATEGORY_AVATARS[category] ?? STORY_CATEGORY_AVATARS.Sustainability;
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
            <stop offset="0%" stop-color="${palette.primary}" />
            <stop offset="100%" stop-color="${palette.secondary}" />
          </linearGradient>
        </defs>
        <rect width="96" height="96" rx="48" fill="url(#g)" />
        <text x="50%" y="56%" text-anchor="middle" font-size="32" font-family="Arial, sans-serif" font-weight="700" fill="white">
          ${initials}
        </text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const EnergySystemsPortfolio: React.FC = () => {
    const [activeSection, setActiveSection] = useState('home');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [hoveredProject, setHoveredProject] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [activeDemoId, setActiveDemoId] = useState<string | null>(null);
    const liveDemoRef = useRef<HTMLDivElement | null>(null);
    const { scrollYProgress } = useScroll();
    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

    /* const projects: Project[] = [
        {
            id: 'data-lab',
            title: 'Construction Portfolio Data Lab',
            description: 'Interactive construction portfolio intelligence demo that consolidates Excel and PDF trackers, runs QA checks, exports reports, and produces secure Gemini-backed management summaries.',
            category: 'Data Intelligence',
            projectType: 'interactive-demo',
            tags: ['Excel Ingestion', 'PDF Parsing', 'QA Checks', 'CSV Export', 'Secure Gemini Proxy', 'Management Reporting'],
            image: 'data-lab',
            metrics: [
                { label: 'Inputs', value: 'Excel + PDF' },
                { label: 'Outputs', value: 'CSV + Report' },
                { label: 'LLM Mode', value: 'Server-secure' }
            ],
            detailedMetrics: [
                { label: 'Audit', value: 'Column Mapping' },
                { label: 'Checks', value: 'QA + Staleness' },
                { label: 'Summary', value: 'Gemini Proxy' }
            ]
        },
        {
            id: '1',
            title: 'Energy Efficiency & Compliance Optimization',
            description: 'Improved energy performance and safety compliance across HVAC, heat pump, and manufacturing systems by integrating ISO standards and performance monitoring tools.',
            category: 'Sustainability',
            tags: ['Energy Efficiency', 'ISO Standards', 'Heat Pumps', 'Building Systems', 'Performance Monitoring'],
            image: 'solar',
            metrics: [
                { label: 'Energy Efficiency Impr.', value: '+12%' },
                { label: 'Compliance Impl.', value: 'ISO Stds.' },
                { label: 'Defect Reduction', value: '8%' }
            ],
            detailedMetrics: [
                { label: 'Standard', value: '9001/14001/45001' },
                { label: 'Focus', value: 'HVAC & Heat Pumps' },
                { label: 'Tooling', value: 'Perf. Monitoring' }
            ],
            gallery: [
                { src: '/Futured Projects/Sustainability/IMG_4636.jpg', alt: 'Sustainability image 1' },
                { src: '/Futured Projects/Sustainability/IMG_4638.jpg', alt: 'Sustainability image 2' },
                { src: '/Futured Projects/Sustainability/IMG_4642.jpg', alt: 'Sustainability image 3' },
                { src: '/Futured Projects/Sustainability/IMG_4644.jpg', alt: 'Sustainability image 4' },
                { src: '/Futured Projects/Sustainability/IMG_4657.jpg', alt: 'Sustainability image 5' }
            ]
        },
        {
            id: '2',
            title: 'Manufacturing Process Optimization',
            description: 'Enhanced manufacturing workflows through systematic process analysis, quality assurance protocols, and lean methods across steel and machinery production facilities.',
            category: 'Production',
            tags: ['Lean Manufacturing', 'Workflow Optimization', 'Industrial Engineering', 'QA Systems', 'Documentation'],
            image: 'wind',
            metrics: [
                { label: 'Process Eff. Increase', value: '+12%' },
                { label: 'Delivery Acceleration', value: '+10%' },
                { label: 'Defect Reduction', value: '-8%' }
            ],
            detailedMetrics: [
                { label: 'Methodology', value: 'Lean Methods' },
                { label: 'Focus', value: 'Process Analysis' },
                { label: 'Industry', value: 'Steel & Machinery' }
            ],
            gallery: [
                { src: '/Futured Projects/Production/18.jpg', alt: 'Production image 1' },
                { src: '/Futured Projects/Production/20160114_110252.jpg', alt: 'Production image 2' },
                { src: '/Futured Projects/Production/20160323_132655.jpg', alt: 'Production image 3' },
                { src: '/Futured Projects/Production/9F1B5C80-E8AA-4B35-96BC-0106C16FCCA5.JPG', alt: 'Production image 4' },
                { src: '/Futured Projects/Production/IMG_3133.JPG', alt: 'Production image 5' },
                { src: '/Futured Projects/Production/IMG_3642.JPG', alt: 'Production image 6' },
                { src: '/Futured Projects/Production/IMG_6261.JPG', alt: 'Production image 7' }
            ]
        },
        {
            id: '3',
            title: 'Renewable Energy Operations & Planning',
            description: 'Supported renewable energy production planning and on-site operational optimization using lean methods and KPI-based performance tracking systems.',
            category: 'Operations',
            tags: ['Energy Operations', 'Production Planning', 'SAP', 'Performance Analytics', 'Process Coordination'],
            image: 'battery',
            metrics: [
                { label: 'KPI Tracking', value: 'Power BI & Excel' },
                { label: 'Coordination', value: '3 Departments' },
                { label: 'Workflow Opt.', value: 'Install Efficiency' }
            ],
            detailedMetrics: [
                { label: 'Planning', value: 'Renewable Energy' },
                { label: 'Methodology', value: 'Lean Methods' },
                { label: 'Tracking', value: 'Performance KPIs' }
            ],
            gallery: [
                { src: '/Futured Projects/Operations/IMG_4637.jpg', alt: 'Operations image 1' },
                { src: '/Futured Projects/Operations/IMG_4640.jpg', alt: 'Operations image 2' },
                { src: '/Futured Projects/Operations/IMG_4851.jpg', alt: 'Operations image 3' },
                { src: '/Futured Projects/Operations/IMG_4853.jpg', alt: 'Operations image 4' },
                { src: '/Futured Projects/Operations/IMG_4860.jpg', alt: 'Operations image 5' },
                { src: '/Futured Projects/Operations/IMG_4861.jpg', alt: 'Operations image 6' }
            ]
        },
        {
            id: '4',
            title: 'Quality Management & Process Standardization',
            description: 'Implemented standardized workflows and internal auditing practices aligned with ISO 9001/14001/45001, improving quality control consistency and operational transparency.',
            category: 'Standardization',
            tags: ['ISO Standards', 'Internal Audit', 'Quality Assurance', 'Process Documentation', 'Risk Management'],
            image: 'hybrid',
            metrics: [
                { label: 'Internal Auditor', value: 'ISO Certified' },
                { label: 'Structured QA', value: 'Defect Monitoring' },
                { label: 'Documentation', value: 'Tech Reporting' }
            ],
            detailedMetrics: [
                { label: 'Certifier', value: 'TÜV Austria' },
                { label: 'Standards', value: '9001/14001/45001' },
                { label: 'Focus', value: 'Transparency' }
            ],
            gallery: [
                { src: '/Futured Projects/Standardization/IMG_4641.jpg', alt: 'Standardization image 1' },
                { src: '/Futured Projects/Standardization/IMG_4859.jpg', alt: 'Standardization image 2' },
                { src: '/Futured Projects/Standardization/IMG_4860.jpg', alt: 'Standardization image 3' },
                { src: '/Futured Projects/Standardization/IMG_3497.JPG', alt: 'Standardization image 4' }
            ]
        }
    ]; */
    const projects = PROJECTS;
    const featuredProjects = projects.filter((project) => project.projectType !== 'story-gallery');
    const projectCategories = ['all', ...Array.from(new Set(featuredProjects.map((project) => project.category)))];
    const activeLiveDemoProject = projects.find((project) => project.id === activeDemoId && project.hasLiveDemo) ?? null;
    const storyProjectsById = React.useMemo(
        () => new Map(projects.filter((project) => project.projectType === 'story-gallery').map((project) => [project.id, project])),
        [projects]
    );

    const buildExperienceStoryBundle = React.useCallback((source: ExperienceStorySource, offset: number) => {
        const project = storyProjectsById.get(source.projectId);

        if (!project) {
            return null;
        }

        const galleryItems = source.indices
            ? source.indices
                .map((index) => project.gallery?.[index])
                .filter((item): item is NonNullable<typeof item> => Boolean(item))
            : (project.gallery ?? []);

        if (!galleryItems.length) {
            return null;
        }

        return {
            avatar: buildStoryAvatar(source.title ?? project.title, project.category),
            timestamp: new Date(Date.now() - (offset + 1) * 1000 * 60 * 75).toISOString(),
            stories: galleryItems.map((image, imageIndex) => ({
                id: `${project.id}-story-${offset}-${imageIndex}`,
                type: 'image' as const,
                src: image.src,
                label: image.label,
                caption: image.caption,
                duration: 4600
            })) satisfies Story[],
            title: source.title ?? project.title
        };
    }, [storyProjectsById]);

    const skills: Skill[] = [
        { name: 'Solar PV Systems', level: 95, icon: <Sun className="w-5 h-5" /> },
        { name: 'Heat Pump & HVAC Tech', level: 92, icon: <Wind className="w-5 h-5" /> },
        { name: 'Quality Management', level: 90, icon: <Award className="w-5 h-5" /> },
        { name: 'Data & Analytics', level: 88, icon: <TrendingUp className="w-5 h-5" /> },
        { name: 'System Commissioning', level: 85, icon: <Zap className="w-5 h-5" /> },
        { name: 'Project Management', level: 93, icon: <BookOpen className="w-5 h-5" /> }
    ];

    const experience: Experience[] = [
        {
            title: 'Production Engineering Trainee',
            company: 'Emas Machine Industry',
            period: 'Apr 2024 - May 2024',
            year: '2024',
            storySources: [
                { projectId: '3', title: 'Operations & Planning' },
                { projectId: '4', indices: [0, 1, 2], title: 'Quality Management' }
            ],
            description: 'Supported manufacturing process optimization through technical documentation and workflow analysis.',
            achievements: [
                'Gained hands-on experience in quality control procedures',
                'Applied industrial engineering practices'
            ]
        },
        {
            title: 'Long-Term Project Engineer Trainee',
            company: 'Propenta Steel Industry',
            period: 'May 2023 - Dec 2023',
            year: '2023',
            storySources: [
                { projectId: '2', title: 'Manufacturing Process' },
                { projectId: '4', indices: [3], title: 'Standardization Result' }
            ],
            description: 'Coordinated cross-functional teams across 3 departments, improving project delivery timelines by 10%.',
            achievements: [
                'Improved process efficiency by 12% through systematic analysis',
                'Reduced manufacturing defects by 8% with QA protocols',
                'Enhanced communication and standardized workflows'
            ]
        },
        {
            title: 'Long-Term Sales Engineer Trainee',
            company: 'Danfoss Turkey',
            period: 'Oct 2022 - Apr 2023',
            year: '2022',
            storySources: [{ projectId: '1', title: 'Energy Efficiency' }],
            description: 'Delivered 10+ technical presentations on HVAC systems, heat pump technology, and energy efficiency solutions.',
            achievements: [
                'Supported heat pump system selection and sizing calculations',
                'Provided technical support for HVAC installations',
                'Gained in-depth knowledge of building automation technologies'
            ]
        },
        {
            title: 'Production Planning Trainee',
            company: 'Dogus Energy',
            period: 'Aug 2022 - Sep 2022',
            year: '2022',
            description: 'Optimized operational workflows using lean methods and process improvement techniques.',
            achievements: [
                'Supported energy sector operations',
                'Focused on efficiency and quality management'
            ]
        }
    ];

    const education: Education[] = [
        {
            degree: 'MSc in Engineering Management',
            institution: 'Berlin School of Business and Innovation',
            location: 'Berlin, Germany',
            period: '2025 - Present'
        },
        {
            degree: 'BSc in Energy Systems Engineering',
            institution: 'Bahcesehir University',
            location: 'Istanbul, Turkey',
            period: '2018 - 2024'
        },
        {
            degree: 'English Language Program',
            institution: 'Bay Atlantic University',
            location: 'Washington D.C., USA',
            period: '2018 - 2019'
        }
    ];

    const publications: Publication[] = [
        {
            title: 'Applying Numerical Methods to Solve Management-Oriented Engineering Problems',
            journal: 'Academic Paper',
            year: '2024',
            authors: 'Barış Egemen Tokul',
            link: '/publications/Applying Numerical Methods to SolveManagement-Oriented Engineering Problems.pdf'
        },
        {
            title: 'From Strategy to Skills Building Competitive Edge through Digital Transformation',
            journal: 'Academic Paper',
            year: '2024',
            authors: 'Barış Egemen Tokul',
            link: '/publications/From Strategy to Skills Building CompetitiveEdge through Digital Transformation.pdf'
        },
        {
            title: 'Holistic Production Planning and Control',
            journal: 'Academic Paper',
            year: '2024',
            authors: 'Barış Egemen Tokul',
            link: '/publications/Holistic Production Planning andControl.pdf'
        },
        {
            title: 'Innovation as a factor stimulating economic growth',
            journal: 'Academic Paper',
            year: '2024',
            authors: 'Barış Egemen Tokul',
            link: '/publications/Innovation as a factor stimulating economicgrowth.pdf'
        },
        {
            title: 'Promoting Employee Engagement and Productivity',
            journal: 'Academic Paper',
            year: '2024',
            authors: 'Barış Egemen Tokul',
            link: '/publications/Promoting Employee Engagement and Productivity.pdf'
        },
        {
            title: 'Relationship Between Electricity Market Clearing Price (PTF) and Market',
            journal: 'Academic Paper',
            year: '2024',
            authors: 'Barış Egemen Tokul',
            link: '/publications/Relationship Between Electricity Market Clearing Price (PTF) and Market.pdf'
        },
        {
            title: 'PVsyst Project Berlinovo_60.VC0 Report',
            journal: 'Technical Report',
            year: '2024',
            authors: 'Barış Egemen Tokul',
            link: '/publications/Pvsyst_Project_Berlinovo_Report.pdf'
        }
    ];

    const certifications = [
        'SolarEdge Expert Installer Certification',
        'SolarEdge Fundamentals Certificate',
        'ISO 14001, 9001, 45001 Internal Auditor',
        'Google Data Analytics Professional Certificate'
    ];

    useEffect(() => {
        const handleScroll = () => {
            const current = SECTION_IDS.find(section => {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    return rect.top <= 100 && rect.bottom >= 100;
                }
                return false;
            });
            if (current) setActiveSection(current);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!activeDemoId) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            liveDemoRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 120);

        return () => window.clearTimeout(timeoutId);
    }, [activeDemoId]);

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setMobileMenuOpen(false);
        }
    };

    const openProjectDemo = (projectId: string) => {
        setActiveDemoId(projectId);
    };

    const closeProjectDemo = () => {
        setActiveDemoId(null);
    };

    const handleProjectCardClick = (project: Project) => {
        if (project.hasLiveDemo) {
            openProjectDemo(project.id);
            return;
        }

        setActiveDemoId(null);
        setSelectedProject(project);
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Industry Tool': return <Package className="w-4 h-4" />;
            case 'Data Intelligence': return <TrendingUp className="w-4 h-4" />;
            case 'Sustainability': return <Leaf className="w-4 h-4" />;
            case 'Production': return <Factory className="w-4 h-4" />;
            case 'Operations': return <Activity className="w-4 h-4" />;
            case 'Standardization': return <ClipboardCheck className="w-4 h-4" />;
            default: return <Zap className="w-4 h-4" />;
        }
    };

    const getCategoryGradient = (category: string) => {
        switch (category) {
            case 'Industry Tool': return 'from-sky-500/20 via-cyan-500/10 to-emerald-500/20';
            case 'Data Intelligence': return 'from-sky-500/20 to-indigo-500/20';
            case 'Sustainability': return 'from-yellow-500/20 to-orange-500/20';
            case 'Production': return 'from-blue-500/20 to-cyan-500/20';
            case 'Operations': return 'from-green-500/20 to-emerald-500/20';
            case 'Standardization': return 'from-purple-500/20 to-pink-500/20';
            default: return 'from-primary/20 to-primary/10';
        }
    };

    if (selectedProject) {
        if (selectedProject.projectType === 'story-gallery') {
            return (
                <ProjectStoryPage
                    project={selectedProject}
                    onBack={() => setSelectedProject(null)}
                />
            );
        }

        return (
            <ProjectDetails
                projectTitle={selectedProject.title}
                images={selectedProject.gallery}
                onBack={() => setSelectedProject(null)}
            />
        );
    }

    return (
        <div className="min-h-screen overflow-x-clip bg-background text-foreground">
            {/* Navigation */}
            <motion.nav
                className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="container mx-auto px-4 py-3 md:py-4">
                    <div className="flex items-center justify-between">
                        <motion.div
                            className="flex min-w-0 items-center gap-2"
                            whileHover={{ scale: 1.05 }}
                        >
                            <Zap className="h-5 w-5 flex-shrink-0 text-primary sm:h-6 sm:w-6" />
                            <span className="truncate text-sm font-bold sm:text-base md:text-xl">Energy Systems Engineer</span>
                        </motion.div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-2">
                            <AnimatedNavigationTabs
                                items={NAV_ITEMS}
                                activeItem={activeSection}
                                onTabChange={scrollToSection}
                            />

                            <DownloadButton className="ml-2" />
                            <SkyToggle />
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="rounded-xl border border-border/70 p-2 transition-colors hover:bg-accent md:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>

                    {/* Mobile Navigation */}
                    <AnimatePresence>
                        {mobileMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 rounded-2xl border border-border/70 bg-background/95 px-2 pb-2 pt-2 shadow-lg md:hidden"
                            >
                                {SECTION_IDS.map((section) => (
                                    <button
                                        key={section}
                                        onClick={() => scrollToSection(section)}
                                        className="block w-full rounded-xl px-3 py-2.5 text-left capitalize transition-colors hover:bg-accent hover:text-primary"
                                    >
                                        {section}
                                    </button>
                                ))}
                                <div className="mt-4 flex items-center justify-between border-t border-border/70 px-3 pt-4">
                                    <span className="text-sm font-medium">Theme</span>
                                    <div className="flex items-center gap-2">
                                        <DownloadButton />
                                        <SkyToggle />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.nav>

            {/* Hero Section with Energy Flow Animation */}
            <section id="home" className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pb-16 pt-24 sm:pb-20">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />

                {/* Animated Energy Flow Circuits */}
                <svg
                    className="absolute inset-0 h-full w-full opacity-20"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id="circuit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {[...Array(5)].map((_, i) => (
                        <motion.path
                            key={i}
                            d={`M ${i * 20} 0 L ${i * 20 + 10} 50 L ${i * 20} 100`}
                            stroke="url(#circuit-gradient)"
                            strokeWidth="2"
                            fill="none"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{
                                pathLength: [0, 1, 0],
                                opacity: [0, 0.5, 0]
                            }}
                            transition={{
                                duration: 3,
                                delay: i * 0.3,
                                repeat: Infinity,
                                repeatDelay: 1
                            }}
                        />
                    ))}
                </svg>

                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 bg-primary/20 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [0, -30, 0],
                                opacity: [0.2, 0.5, 0.2],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                        />
                    ))}
                </div>

                <motion.div
                    className="container relative z-10 mx-auto px-0 text-center"
                    style={{ opacity, scale }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <Badge className="mb-4" variant="outline">
                            <Zap className="w-3 h-3 mr-1" />
                            Professional Engineer
                        </Badge>
                        <h1 className="mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text pb-2 text-4xl font-bold text-transparent sm:text-5xl md:pb-6 md:text-7xl">
                            Powering the Future
                        </h1>
                        <p className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-2xl">
                            Energy Systems Engineer specializing in renewable energy integration, grid modernization, and sustainable power solutions
                        </p>
                        <div className="mx-auto flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
                            <Button size="lg" className="w-full sm:w-auto" onClick={() => scrollToSection('projects')}>
                                View Projects
                                <ChevronDown className="w-4 h-4 ml-2" />
                            </Button>
                            <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={() => scrollToSection('contact')}>
                                Get in Touch
                                <Mail className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 sm:mt-16 sm:gap-6 lg:grid-cols-4"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        {[
                            { label: 'Technical Projects', value: '15+' },
                            { label: 'Years Experience', value: '3' },
                            { label: 'Certifications', value: '4' },
                            { label: 'Languages', value: '3' }
                        ].map((stat, index) => (
                            <Card key={index} className="bg-card/50 backdrop-blur">
                                <CardContent className="pt-5 sm:pt-6">
                                    <div className="mb-2 text-2xl font-bold text-primary sm:text-3xl">{stat.value}</div>
                                    <div className="text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </motion.div>
                </motion.div>

                <motion.div
                    className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 transform sm:block"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <ChevronDown className="w-6 h-6 text-muted-foreground" />
                </motion.div>
            </section>

            {/* About Section */}
            <section id="about" className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="text-center mb-12">
                            <Badge className="mb-4" variant="outline">About Me</Badge>
                            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Expertise & Skills</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Passionate about creating sustainable energy solutions that drive the transition to a cleaner future
                            </p>
                        </div>

                        <div className="mb-12 grid gap-6 md:grid-cols-2 md:gap-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-primary" />
                                        Technical Skills
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {skills.map((skill, index) => (
                                        <motion.div
                                            key={skill.name}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {skill.icon}
                                                    <span className="font-medium">{skill.name}</span>
                                                </div>
                                                <span className="text-sm text-muted-foreground">{skill.level}%</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-primary"
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${skill.level}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 1, delay: index * 0.1 }}
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-primary" />
                                        Certifications
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-4">
                                        {certifications.map((cert, index) => (
                                            <motion.li
                                                key={cert}
                                                className="flex items-start gap-3"
                                                initial={{ opacity: 0, x: 20 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                <Award className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                                <span>{cert}</span>
                                            </motion.li>
                                        ))}
                                    </ul>
                                    <Separator className="my-6" />
                                    <div className="space-y-3">
                                        <h4 className="font-semibold">Software & Tools</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {['Power BI', 'Excel (VBA)', 'Python (Pandas)', 'SAP', 'Office 365', 'SolarEdge', 'Building Automation'].map((tool) => (
                                                <Badge key={tool} variant="secondary">{tool}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Projects Section with Hover Effects */}
            <section id="projects" className="py-20">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="text-center mb-12">
                            <Badge className="mb-4" variant="outline">Portfolio</Badge>
                            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Featured Projects</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Showcasing energy systems work alongside interactive analytics and data intelligence applications
                            </p>
                        </div>

                        <Tabs defaultValue="all" className="mb-12 flex flex-col items-center">
                            <div className="w-full overflow-x-auto pb-2">
                            <TabsList className="flex h-auto w-max min-w-full justify-start gap-2 p-1 sm:w-fit sm:min-w-0 sm:flex-wrap sm:justify-center">
                                {projectCategories.map((category) => (
                                    <TabsTrigger key={category} value={category} className="shrink-0">
                                        {category === 'all' ? 'All' : category}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            </div>

                            {projectCategories.map((category) => (
                                <TabsContent key={category} value={category} className="mt-8 w-full">
                                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                                        {featuredProjects
                                            .filter((project) => category === 'all' || project.category === category)
                                            .map((project, index) => {
                                                const projectTags = project.tech ?? project.tags ?? [];

                                                return (
                                                    <motion.div
                                                        key={project.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        whileInView={{ opacity: 1, y: 0 }}
                                                        viewport={{ once: true }}
                                                        transition={{ delay: index * 0.1 }}
                                                        onMouseEnter={() => setHoveredProject(project.id)}
                                                        onMouseLeave={() => setHoveredProject(null)}
                                                    >
                                                        <Card
                                                            className={`group h-full overflow-hidden transition-all duration-300 ${
                                                                project.featured
                                                                    ? 'border-sky-500/40 bg-gradient-to-b from-sky-500/[0.08] via-card to-card shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20'
                                                                    : 'hover:shadow-lg'
                                                            } ${project.hasLiveDemo ? 'cursor-pointer' : ''}`}
                                                            onClick={project.hasLiveDemo ? () => openProjectDemo(project.id) : undefined}
                                                            onKeyDown={project.hasLiveDemo ? (event) => {
                                                                if (event.key === 'Enter' || event.key === ' ') {
                                                                    event.preventDefault();
                                                                    openProjectDemo(project.id);
                                                                }
                                                            } : undefined}
                                                            role={project.hasLiveDemo ? 'button' : undefined}
                                                            tabIndex={project.hasLiveDemo ? 0 : undefined}
                                                        >
                                                            <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${getCategoryGradient(project.category)}`}>
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <motion.div
                                                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                                                        transition={{ duration: 0.3 }}
                                                                    >
                                                                        <div className="h-24 w-24 text-primary/40">
                                                                            {project.category === 'Industry Tool' && <Package className="h-full w-full" />}
                                                                            {project.category === 'Data Intelligence' && <TrendingUp className="h-full w-full" />}
                                                                            {project.category === 'Sustainability' && <Leaf className="h-full w-full" />}
                                                                            {project.category === 'Production' && <Factory className="h-full w-full" />}
                                                                            {project.category === 'Operations' && <Activity className="h-full w-full" />}
                                                                            {project.category === 'Standardization' && <ClipboardCheck className="h-full w-full" />}
                                                                        </div>
                                                                    </motion.div>
                                                                </div>
                                                                <Badge className="absolute left-4 top-4" variant="secondary">
                                                                    {getCategoryIcon(project.category)}
                                                                    <span className="ml-1">{project.category}</span>
                                                                </Badge>
                                                                {project.featured ? (
                                                                    <Badge className="absolute right-4 top-4 border-sky-400/30 bg-sky-500/90 text-white hover:bg-sky-500">
                                                                        Featured
                                                                    </Badge>
                                                                ) : null}
                                                            </div>
                                                            <CardHeader>
                                                                <CardTitle>{project.title}</CardTitle>
                                                                <CardDescription>{project.description}</CardDescription>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <AnimatePresence mode="wait">
                                                                    {hoveredProject === project.id && project.detailedMetrics ? (
                                                                        <motion.div
                                                                            key="detailed"
                                                                            initial={{ opacity: 0, height: 0 }}
                                                                            animate={{ opacity: 1, height: 'auto' }}
                                                                            exit={{ opacity: 0, height: 0 }}
                                                                            transition={{ duration: 0.2 }}
                                                                            className="mb-4 grid gap-3 sm:grid-cols-3"
                                                                        >
                                                                            {project.detailedMetrics.map((metric, metricIndex) => (
                                                                                <div key={metricIndex} className="rounded-xl bg-muted/20 p-3 text-center sm:bg-transparent sm:p-0">
                                                                                    <div className="text-lg font-bold text-primary">{metric.value}</div>
                                                                                    <div className="text-xs text-muted-foreground">{metric.label}</div>
                                                                                </div>
                                                                            ))}
                                                                        </motion.div>
                                                                    ) : (
                                                                        <motion.div
                                                                            key="normal"
                                                                            initial={{ opacity: 0 }}
                                                                            animate={{ opacity: 1 }}
                                                                            exit={{ opacity: 0 }}
                                                                            transition={{ duration: 0.2 }}
                                                                            className="mb-4 grid gap-3 sm:grid-cols-3"
                                                                        >
                                                                            {project.metrics?.map((metric, metricIndex) => (
                                                                                <div key={metricIndex} className="rounded-xl bg-muted/20 p-3 text-center sm:bg-transparent sm:p-0">
                                                                                    <div className="text-lg font-bold text-primary">{metric.value}</div>
                                                                                    <div className="text-xs text-muted-foreground">{metric.label}</div>
                                                                                </div>
                                                                            ))}
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                                <div className="mb-4 flex flex-wrap gap-2">
                                                                    {projectTags.map((tag) => (
                                                                        <Badge key={tag} variant="outline" className="text-xs">
                                                                            {tag}
                                                                        </Badge>
                                                                    ))}
                                                                </div>

                                                                {project.hasLiveDemo ? (
                                                                    <div className="flex flex-col gap-3 sm:flex-row">
                                                                        <Button
                                                                            className="w-full bg-sky-500 text-white hover:bg-sky-600 sm:flex-1"
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                openProjectDemo(project.id);
                                                                            }}
                                                                        >
                                                                            Live Demo
                                                                            <ExternalLink className="ml-2 h-4 w-4" />
                                                                        </Button>
                                                                        {project.links?.github ? (
                                                                            <Button
                                                                                variant="outline"
                                                                                className="w-full sm:w-auto"
                                                                                onClick={(event) => {
                                                                                    event.stopPropagation();
                                                                                    window.open(project.links?.github, '_blank', 'noopener,noreferrer');
                                                                                }}
                                                                            >
                                                                                GitHub
                                                                                <Github className="ml-2 h-4 w-4" />
                                                                            </Button>
                                                                        ) : null}
                                                                    </div>
                                                                ) : (
                                                                    <Button
                                                                        variant="ghost"
                                                                        className="w-full transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                                                                        onClick={() => handleProjectCardClick(project)}
                                                                    >
                                                                        View Details
                                                                        <ExternalLink className="ml-2 h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    </motion.div>
                                                );
                                            })}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>

                        {activeLiveDemoProject ? (
                            <div
                                ref={liveDemoRef}
                                id="project-live-demo"
                                className="mt-8 overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-b from-sky-500/[0.06] to-transparent p-3 sm:p-4 md:p-6"
                            >
                                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <Badge className="mb-3 border-sky-400/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/10">
                                            Live Demo
                                        </Badge>
                                        <h3 className="text-xl font-bold sm:text-2xl">{activeLiveDemoProject.title}</h3>
                                        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                                            {activeLiveDemoProject.longDescription ?? activeLiveDemoProject.description}
                                        </p>
                                    </div>
                                    <Button variant="outline" className="w-full sm:w-auto" onClick={closeProjectDemo}>
                                        Close Demo
                                        <X className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                                    {activeDemoId === 'smart-order-tracker' ? (
                                        <OrderTrackerDashboard />
                                    ) : activeDemoId === 'solar-yield-estimator' ? (
                                        <React.Suspense
                                            fallback={
                                                <div className="rounded-2xl border border-border bg-card/60 p-8 text-center text-muted-foreground">
                                                    Loading interactive project demo...
                                                </div>
                                            }
                                        >
                                            <SolarEstimator />
                                        </React.Suspense>
                                    ) : activeDemoId === 'turbine-data-management' ? (
                                        <React.Suspense
                                            fallback={
                                                <div className="rounded-2xl border border-border bg-card/60 p-8 text-center text-muted-foreground">
                                                    Loading interactive project demo...
                                                </div>
                                            }
                                        >
                                            <TurbineDataManagementDemo />
                                        </React.Suspense>
                                    ) : (
                                        <React.Suspense
                                            fallback={
                                                <div className="rounded-2xl border border-border bg-card/60 p-8 text-center text-muted-foreground">
                                                    Loading interactive project demo...
                                                </div>
                                            }
                                        >
                                            <ProjectPortfolioDataDemo />
                                        </React.Suspense>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </motion.div>
                </div>
            </section>

            {/* Publications Section */}
            <section id="publications" className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="text-center mb-12">
                            <Badge className="mb-4" variant="outline">Research</Badge>
                            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Publications & Papers</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Contributing to the advancement of energy systems through research and technical publications
                            </p>
                        </div>

                        <div className="max-w-4xl mx-auto space-y-4">
                            {publications.map((pub, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="hover:shadow-md transition-shadow">
                                        <CardContent className="pt-6">
                                            <div className="flex flex-col items-start gap-4 sm:flex-row">
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <FileText className="w-6 h-6 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold mb-2">{pub.title}</h3>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        {pub.journal} • {pub.year}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground mb-3">
                                                        Authors: {pub.authors}
                                                    </p>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" variant="outline" className="w-full sm:w-auto">
                                                                Read Paper
                                                                <ExternalLink className="w-3 h-3 ml-2" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="h-[85vh] w-[calc(100vw-1rem)] max-w-4xl p-4 sm:h-[90vh] sm:w-[90vw] sm:p-6">
                                                            <DialogHeader>
                                                                <DialogTitle className="pr-8 text-left text-base leading-snug sm:text-lg">{pub.title}</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="mt-4 flex h-full min-h-[60vh] w-full flex-1 sm:min-h-[70vh]">
                                                                <iframe
                                                                    src={`${pub.link}#toolbar=0`}
                                                                    className="w-full h-full rounded-md border"
                                                                    title={pub.title}
                                                                />
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Experience Section with Timeline */}
            <section id="experience" className="py-20">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="text-center mb-12">
                            <Badge className="mb-4" variant="outline">Career</Badge>
                            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Professional Experience</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                A track record of delivering innovative energy solutions across diverse projects, with visual story highlights from the field.
                            </p>
                        </div>

                        <div className="max-w-4xl mx-auto relative">
                            {/* Timeline Line */}
                            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

                            <div className="space-y-8">
                                {experience.map((exp, index) => {
                                    const storyBundles = (exp.storySources ?? [])
                                        .map((source, sourceIndex) => buildExperienceStoryBundle(source, index * 3 + sourceIndex))
                                        .filter((bundle): bundle is NonNullable<typeof bundle> => Boolean(bundle));

                                    return (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: index * 0.1 }}
                                            className="relative"
                                        >
                                            {/* Timeline Dot */}
                                            <div className="absolute left-6 top-6 w-5 h-5 rounded-full bg-primary border-4 border-background z-10 hidden md:block" />

                                            <div className="md:ml-20">
                                                <Card>
                                                    <CardHeader>
                                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                                            <div>
                                                                <CardTitle>{exp.title}</CardTitle>
                                                                <CardDescription className="text-base">{exp.company}</CardDescription>
                                                            </div>
                                                            <Badge variant="outline">{exp.period}</Badge>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="text-muted-foreground mb-4">{exp.description}</p>
                                                        <div className="space-y-2">
                                                            <h4 className="font-semibold text-sm">Key Achievements:</h4>
                                                            <ul className="space-y-2">
                                                                {exp.achievements.map((achievement, i) => (
                                                                    <li key={i} className="flex items-start gap-2 text-sm">
                                                                        <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                                                        <span>{achievement}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        {storyBundles.length > 0 ? (
                                                            <div className="mt-6 border-t border-border pt-5">
                                                                <div className="space-y-3">
                                                                    <div>
                                                                        <p className="text-sm font-semibold">Visual Stories</p>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            Tap a story to review field photos and short notes linked to this experience.
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex flex-wrap items-start gap-4">
                                                                        {storyBundles.map((storyBundle) => (
                                                                            <div key={`${exp.company}-${storyBundle.title}`} className="flex items-center gap-3">
                                                                                <StoryViewer
                                                                                    stories={storyBundle.stories}
                                                                                    username={storyBundle.title}
                                                                                    avatar={storyBundle.avatar}
                                                                                    timestamp={storyBundle.timestamp}
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Education Section */}
            <section id="education" className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="text-center mb-12">
                            <Badge className="mb-4" variant="outline">Education</Badge>
                            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Academic Background</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Degrees and programs that shaped my engineering foundation
                            </p>
                        </div>

                        <div className="max-w-4xl mx-auto space-y-4">
                            {education.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="hover:shadow-md transition-shadow">
                                        <CardContent className="pt-6">
                                            <div className="flex flex-col items-start gap-4 sm:flex-row">
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <BookOpen className="w-6 h-6 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold mb-2">{item.degree}</h3>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        {item.institution} • {item.location}
                                                    </p>
                                                    <p className="text-sm font-medium text-primary">
                                                        {item.period}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-20">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="text-center mb-12">
                            <Badge className="mb-4" variant="outline">Get in Touch</Badge>
                            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Let's Connect</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Interested in collaborating on renewable energy projects or discussing innovative solutions?
                            </p>
                        </div>

                        <div className="max-w-2xl mx-auto">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                                        <motion.a
                                            href="mailto:engineer@example.com"
                                            whileHover={{ scale: 1.05 }}
                                            className="flex items-start gap-4 rounded-lg border border-border p-4 transition-colors hover:border-primary sm:items-center"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Mail className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <div className="font-semibold">Email</div>
                                                <div className="text-sm text-muted-foreground">engineer@example.com</div>
                                            </div>
                                        </motion.a>

                                        <motion.a
                                            href="https://linkedin.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            whileHover={{ scale: 1.05 }}
                                            className="flex items-start gap-4 rounded-lg border border-border p-4 transition-colors hover:border-primary sm:items-center"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Linkedin className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <div className="font-semibold">LinkedIn</div>
                                                <div className="text-sm text-muted-foreground">Connect with me</div>
                                            </div>
                                        </motion.a>

                                        <motion.a
                                            href="https://github.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            whileHover={{ scale: 1.05 }}
                                            className="flex items-start gap-4 rounded-lg border border-border p-4 transition-colors hover:border-primary sm:items-center"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Github className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <div className="font-semibold">GitHub</div>
                                                <div className="text-sm text-muted-foreground">View my code</div>
                                            </div>
                                        </motion.a>

                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            className="flex items-start gap-4 rounded-lg border border-border p-4 sm:items-center"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Award className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <div className="font-semibold">PE License</div>
                                                <div className="text-sm text-muted-foreground">Licensed Professional</div>
                                            </div>
                                        </motion.div>
                                    </div>

                                    <Separator className="my-6" />

                                    <div className="text-center">
                                        <Button size="lg" className="w-full md:w-auto">
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Full Resume
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-border bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary" />
                            <span className="font-semibold">Energy Systems Engineer</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            © 2024 All rights reserved. Building a sustainable future.
                        </div>
                        <div className="flex items-center gap-4">
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="mailto:engineer@example.com" className="hover:text-primary transition-colors">
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default EnergySystemsPortfolio;
