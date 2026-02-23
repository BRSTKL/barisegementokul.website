import React, { useState, useEffect } from 'react';
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
import { ProjectDetails } from './ProjectDetails';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";


interface Project {
    id: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    image: string;
    metrics?: {
        label: string;
        value: string;
    }[];
    detailedMetrics?: {
        label: string;
        value: string;
    }[];
}

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

const EnergySystemsPortfolio: React.FC = () => {
    const [activeSection, setActiveSection] = useState('home');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [hoveredProject, setHoveredProject] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const { scrollYProgress } = useScroll();
    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

    const NAV_ITEMS = [
        { id: 'home', tile: 'Home' },
        { id: 'about', tile: 'About' },
        { id: 'projects', tile: 'Projects' },
        { id: 'publications', tile: 'Publications' },
        { id: 'experience', tile: 'Experience' },
        { id: 'education', tile: 'Education' },
        { id: 'contact', tile: 'Contact' }
    ];

    const projects: Project[] = [
        {
            id: '1',
            title: 'Solar Farm Optimization',
            description: 'Designed and implemented a 50MW solar farm with advanced tracking systems, increasing energy yield by 23%.',
            category: 'Sustainability',
            tags: ['PV Systems', 'SCADA', 'Energy Modeling'],
            image: 'solar',
            metrics: [
                { label: 'Capacity', value: '50MW' },
                { label: 'Efficiency Gain', value: '+23%' },
                { label: 'ROI', value: '4.2 years' }
            ],
            detailedMetrics: [
                { label: 'Annual Generation', value: '95 GWh' },
                { label: 'CO2 Avoided', value: '42,000 tons' },
                { label: 'Homes Powered', value: '15,000' }
            ]
        },
        {
            id: '2',
            title: 'Wind Energy Integration',
            description: 'Led grid integration project for 100MW offshore wind farm, ensuring stable power delivery and grid compliance.',
            category: 'Production',
            tags: ['Grid Integration', 'Power Quality', 'Forecasting'],
            image: 'wind',
            metrics: [
                { label: 'Capacity', value: '100MW' },
                { label: 'Uptime', value: '97.8%' },
                { label: 'Grid Stability', value: '99.9%' }
            ],
            detailedMetrics: [
                { label: 'Annual Generation', value: '320 GWh' },
                { label: 'Turbines', value: '40 units' },
                { label: 'Capacity Factor', value: '36.5%' }
            ]
        },
        {
            id: '3',
            title: 'Battery Storage System',
            description: 'Developed control algorithms for 20MWh battery storage system, optimizing charge/discharge cycles for peak shaving.',
            category: 'Operations',
            tags: ['BESS', 'Control Systems', 'Peak Shaving'],
            image: 'battery',
            metrics: [
                { label: 'Capacity', value: '20MWh' },
                { label: 'Cycle Life', value: '+15%' },
                { label: 'Cost Savings', value: '$2.1M/yr' }
            ],
            detailedMetrics: [
                { label: 'Response Time', value: '< 100ms' },
                { label: 'Round-trip Eff.', value: '92%' },
                { label: 'Depth of Discharge', value: '85%' }
            ]
        },
        {
            id: '4',
            title: 'Microgrid Design',
            description: 'Architected hybrid microgrid system combining solar, wind, and storage for remote industrial facility.',
            category: 'Standardization',
            tags: ['Microgrid', 'Hybrid Systems', 'Energy Management'],
            image: 'hybrid',
            metrics: [
                { label: 'Renewable %', value: '85%' },
                { label: 'Reliability', value: '99.5%' },
                { label: 'Diesel Reduction', value: '78%' }
            ],
            detailedMetrics: [
                { label: 'Total Capacity', value: '5MW' },
                { label: 'Storage', value: '8MWh' },
                { label: 'Payback Period', value: '6.8 years' }
            ]
        }
    ];

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
            const sections = ['home', 'about', 'projects', 'publications', 'experience', 'education', 'contact'];
            const current = sections.find(section => {
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

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setMobileMenuOpen(false);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Sustainability': return <Leaf className="w-4 h-4" />;
            case 'Production': return <Factory className="w-4 h-4" />;
            case 'Operations': return <Activity className="w-4 h-4" />;
            case 'Standardization': return <ClipboardCheck className="w-4 h-4" />;
            default: return <Zap className="w-4 h-4" />;
        }
    };

    const getCategoryGradient = (category: string) => {
        switch (category) {
            case 'Sustainability': return 'from-yellow-500/20 to-orange-500/20';
            case 'Production': return 'from-blue-500/20 to-cyan-500/20';
            case 'Operations': return 'from-green-500/20 to-emerald-500/20';
            case 'Standardization': return 'from-purple-500/20 to-pink-500/20';
            default: return 'from-primary/20 to-primary/10';
        }
    };

    if (selectedProject) {
        return (
            <ProjectDetails
                projectTitle={selectedProject.title}
                onBack={() => setSelectedProject(null)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Navigation */}
            <motion.nav
                className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <motion.div
                            className="flex items-center gap-2"
                            whileHover={{ scale: 1.05 }}
                        >
                            <Zap className="w-6 h-6 text-primary" />
                            <span className="text-xl font-bold">Energy Systems Engineer</span>
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
                            className="md:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
                                className="md:hidden mt-4 pb-4"
                            >
                                {['home', 'about', 'projects', 'publications', 'experience', 'education', 'contact'].map((section) => (
                                    <button
                                        key={section}
                                        onClick={() => scrollToSection(section)}
                                        className="block w-full text-left py-2 capitalize hover:text-primary transition-colors"
                                    >
                                        {section}
                                    </button>
                                ))}
                                <div className="flex items-center justify-between mt-4 mb-2">
                                    <span className="text-sm font-medium">Theme</span>
                                    <div className="flex items-center">
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
            <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />

                {/* Animated Energy Flow Circuits */}
                <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="circuit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {[...Array(5)].map((_, i) => (
                        <motion.path
                            key={i}
                            d={`M ${i * 25}% 0 L ${i * 25 + 10}% 50 L ${i * 25}% 100`}
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
                    className="container mx-auto px-4 text-center relative z-10"
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
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Powering the Future
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Energy Systems Engineer specializing in renewable energy integration, grid modernization, and sustainable power solutions
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Button size="lg" onClick={() => scrollToSection('projects')}>
                                View Projects
                                <ChevronDown className="w-4 h-4 ml-2" />
                            </Button>
                            <Button size="lg" variant="outline" onClick={() => scrollToSection('contact')}>
                                Get in Touch
                                <Mail className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        {[
                            { label: 'MW Designed', value: '500+' },
                            { label: 'Projects', value: '50+' },
                            { label: 'Years Experience', value: '8+' },
                            { label: 'Certifications', value: '4' }
                        ].map((stat, index) => (
                            <Card key={index} className="bg-card/50 backdrop-blur">
                                <CardContent className="pt-6">
                                    <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </motion.div>
                </motion.div>

                <motion.div
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
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
                            <h2 className="text-4xl font-bold mb-4">Expertise & Skills</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Passionate about creating sustainable energy solutions that drive the transition to a cleaner future
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mb-12">
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
                            <h2 className="text-4xl font-bold mb-4">Featured Projects</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Showcasing innovative energy solutions across solar, wind, storage, and hybrid systems
                            </p>
                        </div>

                        <Tabs defaultValue="all" className="mb-8">
                            <TabsList className="grid w-full max-w-md mx-auto grid-cols-5">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="Sustainability">Sustainability</TabsTrigger>
                                <TabsTrigger value="Production">Production</TabsTrigger>
                                <TabsTrigger value="Operations">Operations</TabsTrigger>
                                <TabsTrigger value="Standardization">Standardization</TabsTrigger>
                            </TabsList>

                            {['all', 'Sustainability', 'Production', 'Operations', 'Standardization'].map((category) => (
                                <TabsContent key={category} value={category} className="mt-8">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {projects
                                            .filter(p => category === 'all' || p.category === category)
                                            .map((project, index) => (
                                                <motion.div
                                                    key={project.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: index * 0.1 }}
                                                    onMouseEnter={() => setHoveredProject(project.id)}
                                                    onMouseLeave={() => setHoveredProject(null)}
                                                >
                                                    <Card className="h-full hover:shadow-lg transition-all duration-300 overflow-hidden group">
                                                        <div className={`h-48 bg-gradient-to-br ${getCategoryGradient(project.category)} relative overflow-hidden`}>
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <motion.div
                                                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                                                    transition={{ duration: 0.3 }}
                                                                >
                                                                    <div className="w-24 h-24 text-primary/40">
                                                                        {project.category === 'Sustainability' && <Leaf className="w-full h-full" />}
                                                                        {project.category === 'Production' && <Factory className="w-full h-full" />}
                                                                        {project.category === 'Operations' && <Activity className="w-full h-full" />}
                                                                        {project.category === 'Standardization' && <ClipboardCheck className="w-full h-full" />}
                                                                    </div>
                                                                </motion.div>
                                                            </div>
                                                            <Badge className="absolute top-4 right-4" variant="secondary">
                                                                {getCategoryIcon(project.category)}
                                                                <span className="ml-1">{project.category}</span>
                                                            </Badge>
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
                                                                        className="grid grid-cols-3 gap-4 mb-4"
                                                                    >
                                                                        {project.detailedMetrics.map((metric, i) => (
                                                                            <div key={i} className="text-center">
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
                                                                        className="grid grid-cols-3 gap-4 mb-4"
                                                                    >
                                                                        {project.metrics?.map((metric, i) => (
                                                                            <div key={i} className="text-center">
                                                                                <div className="text-lg font-bold text-primary">{metric.value}</div>
                                                                                <div className="text-xs text-muted-foreground">{metric.label}</div>
                                                                            </div>
                                                                        ))}
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                            <div className="flex flex-wrap gap-2 mb-4">
                                                                {project.tags.map((tag) => (
                                                                    <Badge key={tag} variant="outline" className="text-xs">
                                                                        {tag}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                                                onClick={() => setSelectedProject(project)}
                                                            >
                                                                View Details
                                                                <ExternalLink className="w-4 h-4 ml-2" />
                                                            </Button>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
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
                            <h2 className="text-4xl font-bold mb-4">Publications & Papers</h2>
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
                                            <div className="flex items-start gap-4">
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
                                                            <Button size="sm" variant="outline">
                                                                Read Paper
                                                                <ExternalLink className="w-3 h-3 ml-2" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-4xl w-[90vw] h-[90vh]">
                                                            <DialogHeader>
                                                                <DialogTitle>{pub.title}</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="flex-1 w-full h-full min-h-[70vh] mt-4">
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
                            <h2 className="text-4xl font-bold mb-4">Professional Experience</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                A track record of delivering innovative energy solutions across diverse projects
                            </p>
                        </div>

                        <div className="max-w-4xl mx-auto relative">
                            {/* Timeline Line */}
                            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

                            <div className="space-y-8">
                                {experience.map((exp, index) => (
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
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </motion.div>
                                ))}
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
                            <h2 className="text-4xl font-bold mb-4">Academic Background</h2>
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
                                            <div className="flex items-start gap-4">
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
                            <h2 className="text-4xl font-bold mb-4">Let's Connect</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Interested in collaborating on renewable energy projects or discussing innovative solutions?
                            </p>
                        </div>

                        <div className="max-w-2xl mx-auto">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <motion.a
                                            href="mailto:engineer@example.com"
                                            whileHover={{ scale: 1.05 }}
                                            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary transition-colors"
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
                                            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary transition-colors"
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
                                            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary transition-colors"
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
                                            className="flex items-center gap-4 p-4 rounded-lg border border-border"
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
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
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
