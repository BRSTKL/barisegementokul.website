export interface ProjectMetric {
  label: string
  value: string
}

export interface ProjectGalleryItem {
  src: string
  alt: string
  label?: string
  caption?: string
}

export interface ProjectLinkSet {
  demo?: string
  github?: string
}

export interface Project {
  id: string
  title: string
  description: string
  longDescription?: string
  category: string
  projectType?: "gallery" | "interactive-demo" | "story-gallery"
  tags?: string[]
  tech?: string[]
  image: string
  metrics?: ProjectMetric[]
  detailedMetrics?: ProjectMetric[]
  gallery?: ProjectGalleryItem[]
  featured?: boolean
  hasLiveDemo?: boolean
  links?: ProjectLinkSet
}

export const PROJECTS: Project[] = [
  {
    id: "smart-order-tracker",
    title: "Smart Order Tracker",
    description:
      "Real-time order management dashboard concept for Siemens Energy Gas Services. Features automated delay detection, KPI monitoring, regional analytics, and priority-based alerts.",
    longDescription:
      "Built as a portfolio project demonstrating Order Management domain knowledge for a Werkstudent application at Siemens Energy (Gas Services, M\u00fclheim an der Ruhr). Tracks 247+ spare part orders across European energy companies with live status updates and automated notifications.",
    category: "Industry Tool",
    tech: ["React", "TypeScript", "Recharts", "Tailwind CSS"],
    image: "order-tracker",
    featured: true,
    hasLiveDemo: true,
    links: {
      demo: "#order-tracker-demo",
      github: "https://github.com/BRSTKL/barisegementokul.website",
    },
    metrics: [
      { label: "Coverage", value: "247+ Orders" },
      { label: "Alerting", value: "Auto Escalation" },
      { label: "Focus", value: "Gas Services" },
    ],
    detailedMetrics: [
      { label: "Views", value: "KPIs + Charts" },
      { label: "Alerts", value: "Priority Driven" },
      { label: "Region", value: "EU Portfolio" },
    ],
  },
  {
    id: "data-lab",
    title: "Construction Portfolio Data Lab",
    description:
      "Interactive construction portfolio intelligence demo that consolidates Excel and PDF trackers, runs QA checks, exports reports, and produces secure Gemini-backed management summaries.",
    longDescription:
      "Portfolio data intelligence demo for construction reporting workflows. Upload Excel and PDF files, run column mapping and QA checks, export reporting packs, and generate secure AI-backed management commentary in one live workspace.",
    category: "Data Intelligence",
    projectType: "interactive-demo",
    featured: true,
    hasLiveDemo: true,
    tags: [
      "Excel Ingestion",
      "PDF Parsing",
      "QA Checks",
      "CSV Export",
      "Secure Gemini Proxy",
      "Management Reporting",
    ],
    image: "data-lab",
    links: {
      demo: "#project-live-demo",
    },
    metrics: [
      { label: "Inputs", value: "Excel + PDF" },
      { label: "Outputs", value: "CSV + Report" },
      { label: "LLM Mode", value: "Server-secure" },
    ],
    detailedMetrics: [
      { label: "Audit", value: "Column Mapping" },
      { label: "Checks", value: "QA + Staleness" },
      { label: "Summary", value: "Gemini Proxy" },
    ],
  },
  {
    id: "1",
    title: "Energy Efficiency & Compliance Optimization",
    description:
      "Improved energy performance and safety compliance across HVAC, heat pump, and manufacturing systems by integrating ISO standards and performance monitoring tools.",
    longDescription:
      "Case study focused on site-level energy performance upgrades and compliance alignment. The work combined field observation, retrofit prioritization, and ISO-based review loops to improve system efficiency while keeping documentation discipline visible to stakeholders.",
    category: "Sustainability",
    projectType: "story-gallery",
    tags: [
      "Energy Efficiency",
      "ISO Standards",
      "Heat Pumps",
      "Building Systems",
      "Performance Monitoring",
    ],
    image: "solar",
    metrics: [
      { label: "Energy Efficiency Impr.", value: "+12%" },
      { label: "Compliance Impl.", value: "ISO Stds." },
      { label: "Defect Reduction", value: "8%" },
    ],
    detailedMetrics: [
      { label: "Standard", value: "9001/14001/45001" },
      { label: "Focus", value: "HVAC & Heat Pumps" },
      { label: "Tooling", value: "Perf. Monitoring" },
    ],
    gallery: [
      {
        src: "/Futured Projects/Sustainability/IMG_4636.jpg",
        alt: "Sustainability image 1",
        label: "Baseline review",
        caption: "First pass focused on existing building loads, ventilation behavior, and quick wins that could lift efficiency without disrupting operations.",
      },
      {
        src: "/Futured Projects/Sustainability/IMG_4638.jpg",
        alt: "Sustainability image 2",
        label: "Heat pump scope",
        caption: "System notes were translated into retrofit options around HVAC and heat-pump-ready infrastructure to improve long-term energy balance.",
      },
      {
        src: "/Futured Projects/Sustainability/IMG_4642.jpg",
        alt: "Sustainability image 3",
        label: "Compliance loop",
        caption: "ISO 9001, 14001, and 45001 checkpoints were used to keep energy upgrades aligned with safety and environmental documentation standards.",
      },
      {
        src: "/Futured Projects/Sustainability/IMG_4644.jpg",
        alt: "Sustainability image 4",
        label: "Performance watch",
        caption: "Monitoring logic connected technical improvements with measurable performance signals so the impact could be reported clearly.",
      },
      {
        src: "/Futured Projects/Sustainability/IMG_4657.jpg",
        alt: "Sustainability image 5",
        label: "Outcome",
        caption: "The final concept emphasized lower energy demand, tighter compliance visibility, and a cleaner handover path for future upgrades.",
      },
    ],
  },
  {
    id: "2",
    title: "Manufacturing Process Optimization",
    description:
      "Enhanced manufacturing workflows through systematic process analysis, quality assurance protocols, and lean methods across steel and machinery production facilities.",
    longDescription:
      "Industrial process study centered on bottleneck analysis, lean flow, and quality stabilization. The project documented how production observations turned into faster throughput, better cross-team coordination, and more reliable execution on the shop floor.",
    category: "Production",
    projectType: "story-gallery",
    tags: [
      "Lean Manufacturing",
      "Workflow Optimization",
      "Industrial Engineering",
      "QA Systems",
      "Documentation",
    ],
    image: "wind",
    metrics: [
      { label: "Process Eff. Increase", value: "+12%" },
      { label: "Delivery Acceleration", value: "+10%" },
      { label: "Defect Reduction", value: "-8%" },
    ],
    detailedMetrics: [
      { label: "Methodology", value: "Lean Methods" },
      { label: "Focus", value: "Process Analysis" },
      { label: "Industry", value: "Steel & Machinery" },
    ],
    gallery: [
      {
        src: "/Futured Projects/Production/18.jpg",
        alt: "Production image 1",
        label: "Workflow mapping",
        caption: "Operations were broken into visible steps so waiting points and handoff friction could be identified without guesswork.",
      },
      {
        src: "/Futured Projects/Production/20160114_110252.jpg",
        alt: "Production image 2",
        label: "Floor observation",
        caption: "Real production context helped connect engineering assumptions with what teams actually faced during execution.",
      },
      {
        src: "/Futured Projects/Production/20160323_132655.jpg",
        alt: "Production image 3",
        label: "Process analysis",
        caption: "Cycle time, defects, and communication delays were reviewed together instead of treating quality and speed as separate problems.",
      },
      {
        src: "/Futured Projects/Production/9F1B5C80-E8AA-4B35-96BC-0106C16FCCA5.JPG",
        alt: "Production image 4",
        label: "Lean intervention",
        caption: "Lean methods were used to simplify the route from task release to completed output and reduce wasted motion on the line.",
      },
      {
        src: "/Futured Projects/Production/IMG_3133.JPG",
        alt: "Production image 5",
        label: "QA checkpoint",
        caption: "Quality controls were embedded into the workflow so recurring issues could be caught earlier and documented consistently.",
      },
      {
        src: "/Futured Projects/Production/IMG_3642.JPG",
        alt: "Production image 6",
        label: "Team alignment",
        caption: "Production, planning, and quality functions were kept on the same operating picture to accelerate decision-making.",
      },
      {
        src: "/Futured Projects/Production/IMG_6261.JPG",
        alt: "Production image 7",
        label: "Measured result",
        caption: "The final process model supported faster delivery, lower defect risk, and a more disciplined production rhythm.",
      },
    ],
  },
  {
    id: "3",
    title: "Renewable Energy Operations & Planning",
    description:
      "Supported renewable energy production planning and on-site operational optimization using lean methods and KPI-based performance tracking systems.",
    longDescription:
      "Operations and planning case study for renewable energy workflows. The project linked field coordination, daily planning, and KPI visibility so execution teams could work with fewer surprises and better shared priorities.",
    category: "Operations",
    projectType: "story-gallery",
    tags: [
      "Energy Operations",
      "Production Planning",
      "SAP",
      "Performance Analytics",
      "Process Coordination",
    ],
    image: "battery",
    metrics: [
      { label: "KPI Tracking", value: "Power BI & Excel" },
      { label: "Coordination", value: "3 Departments" },
      { label: "Workflow Opt.", value: "Install Efficiency" },
    ],
    detailedMetrics: [
      { label: "Planning", value: "Renewable Energy" },
      { label: "Methodology", value: "Lean Methods" },
      { label: "Tracking", value: "Performance KPIs" },
    ],
    gallery: [
      {
        src: "/Futured Projects/Operations/IMG_4637.jpg",
        alt: "Operations image 1",
        label: "Field setup",
        caption: "The first layer of the work focused on translating project goals into a workable site coordination rhythm.",
      },
      {
        src: "/Futured Projects/Operations/IMG_4640.jpg",
        alt: "Operations image 2",
        label: "Planning board",
        caption: "Daily and weekly priorities were structured so planning could support operations instead of reacting after delays appeared.",
      },
      {
        src: "/Futured Projects/Operations/IMG_4851.jpg",
        alt: "Operations image 3",
        label: "KPI tracking",
        caption: "Power BI and Excel tracking made it easier to follow operational bottlenecks, production readiness, and department dependencies.",
      },
      {
        src: "/Futured Projects/Operations/IMG_4853.jpg",
        alt: "Operations image 4",
        label: "Cross-team flow",
        caption: "Coordination routines connected engineering, planning, and execution teams around a common set of delivery signals.",
      },
      {
        src: "/Futured Projects/Operations/IMG_4860.jpg",
        alt: "Operations image 5",
        label: "Lean support",
        caption: "Lean thinking helped reduce unnecessary process loops and kept attention on practical, field-ready improvements.",
      },
      {
        src: "/Futured Projects/Operations/IMG_4861.jpg",
        alt: "Operations image 6",
        label: "Delivery view",
        caption: "The result was a clearer planning cadence with stronger KPI visibility and better execution confidence across the workflow.",
      },
    ],
  },
  {
    id: "4",
    title: "Quality Management & Process Standardization",
    description:
      "Implemented standardized workflows and internal auditing practices aligned with ISO 9001/14001/45001, improving quality control consistency and operational transparency.",
    longDescription:
      "Quality management case study focused on standardization, evidence-based auditing, and documentation clarity. The project demonstrates how ISO-aligned process design can strengthen transparency and reduce ambiguity across internal workflows.",
    category: "Standardization",
    projectType: "story-gallery",
    tags: [
      "ISO Standards",
      "Internal Audit",
      "Quality Assurance",
      "Process Documentation",
      "Risk Management",
    ],
    image: "hybrid",
    metrics: [
      { label: "Internal Auditor", value: "ISO Certified" },
      { label: "Structured QA", value: "Defect Monitoring" },
      { label: "Documentation", value: "Tech Reporting" },
    ],
    detailedMetrics: [
      { label: "Certifier", value: "T\u00dcV Austria" },
      { label: "Standards", value: "9001/14001/45001" },
      { label: "Focus", value: "Transparency" },
    ],
    gallery: [
      {
        src: "/Futured Projects/Standardization/IMG_4641.jpg",
        alt: "Standardization image 1",
        label: "Audit kickoff",
        caption: "Internal audit work started by clarifying what evidence mattered most and where process gaps were likely to appear.",
      },
      {
        src: "/Futured Projects/Standardization/IMG_4859.jpg",
        alt: "Standardization image 2",
        label: "Process design",
        caption: "Standard workflows were documented to make responsibilities, checkpoints, and reporting paths easier to follow.",
      },
      {
        src: "/Futured Projects/Standardization/IMG_4860.jpg",
        alt: "Standardization image 3",
        label: "ISO alignment",
        caption: "The approach stayed anchored to ISO 9001, 14001, and 45001 so standardization improved both control and credibility.",
      },
      {
        src: "/Futured Projects/Standardization/IMG_3497.JPG",
        alt: "Standardization image 4",
        label: "Transparency result",
        caption: "The final state delivered clearer reporting, more repeatable controls, and stronger operational transparency for stakeholders.",
      },
    ],
  },
]

export const PROJECT_CATEGORIES = [
  "all",
  ...Array.from(new Set(PROJECTS.map((project) => project.category))),
]
