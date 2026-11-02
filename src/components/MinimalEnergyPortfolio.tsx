import React, { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowDown,
  ArrowUpRight,
  Download,
  Github,
  Linkedin,
  Mail,
  Menu,
  X,
} from 'lucide-react'
import { PROJECTS, type Project } from '@/data/projects'
import { OrderTrackerDashboard } from './order-tracker/OrderTrackerDashboard'
import { ProjectDetails } from './ProjectDetails'
import { ProjectStoryPage } from './ProjectStoryPage'

const ProjectPortfolioDataDemo = React.lazy(() =>
  import('./ProjectPortfolioDataDemo').then((module) => ({ default: module.ProjectPortfolioDataDemo })),
)
const TurbineDataManagementDemo = React.lazy(() =>
  import('./TurbineDataManagementDemo').then((module) => ({ default: module.TurbineDataManagementDemo })),
)
const SolarEstimator = React.lazy(() =>
  import('./SolarEstimatorModern').then((module) => ({ default: module.SolarEstimator })),
)

const experience = [
  ['Production Engineering Trainee', 'Emas Machine Industry', '2024'],
  ['Project Engineer Trainee', 'Propenta Steel Industry', '2023'],
  ['Sales Engineer Trainee', 'Danfoss Turkey', '2022—23'],
  ['Production Planning Trainee', 'Dogus Energy', '2022'],
]

const publications = [
  ['Applying Numerical Methods to Solve Management-Oriented Engineering Problems', '2024', '/publications/Applying Numerical Methods to SolveManagement-Oriented Engineering Problems.pdf'],
  ['From Strategy to Skills: Building Competitive Edge through Digital Transformation', '2024', '/publications/From Strategy to Skills Building CompetitiveEdge through Digital Transformation.pdf'],
  ['Holistic Production Planning and Control', '2024', '/publications/Holistic Production Planning andControl.pdf'],
  ['Innovation as a Factor Stimulating Economic Growth', '2024', '/publications/Innovation as a factor stimulating economicgrowth.pdf'],
  ['Promoting Employee Engagement and Productivity', '2024', '/publications/Promoting Employee Engagement and Productivity.pdf'],
  ['Electricity Market Clearing Price and Market Relationship', '2024', '/publications/Relationship Between Electricity Market Clearing Price (PTF) and Market.pdf'],
  ['PVsyst Project Berlinovo Report', '2024', '/publications/Pvsyst_Project_Berlinovo_Report.pdf'],
]

const navItems = [
  ['Work', 'work'],
  ['About', 'about'],
  ['Experience', 'experience'],
  ['Contact', 'contact'],
]

function ProjectVisual({ project }: { project: Project }) {
  if (project.id === 'smart-order-tracker') {
    return (
      <div className="mp-browser mp-order-visual" aria-hidden="true">
        <div className="mp-browser-bar"><span /><span /><span /></div>
        <div className="mp-order-head"><strong>Orders</strong><span>Search</span></div>
        {[72, 88, 64, 81, 55].map((width, index) => (
          <div className="mp-order-row" key={width}>
            <span style={{ width: `${width}%` }} /><i className={index === 1 ? 'active' : ''} />
          </div>
        ))}
      </div>
    )
  }

  if (project.id === 'solar-yield-estimator') {
    return (
      <div className="mp-map-visual" aria-hidden="true">
        <div className="mp-map-river" />
        <div className="mp-map-pin"><span /></div>
        <div className="mp-map-label">52.5200° N · 13.4050° E</div>
      </div>
    )
  }

  if (project.id === 'turbine-data-management') {
    return (
      <div className="mp-turbine-visual" aria-hidden="true">
        <div className="mp-turbine-ring ring-one" />
        <div className="mp-turbine-ring ring-two" />
        <div className="mp-turbine-core">200</div>
        <span className="mp-visual-caption">BLADE RECORDS · VALIDATED</span>
      </div>
    )
  }

  return (
    <div className="mp-data-visual" aria-hidden="true">
      <div className="mp-data-sidebar">DATA<br />LAB</div>
      <div className="mp-data-lines">
        {[84, 66, 92, 58, 74].map((width) => <span key={width} style={{ width: `${width}%` }} />)}
      </div>
      <span className="mp-visual-caption">EXCEL + PDF · QA READY</span>
    </div>
  )
}

export default function MinimalEnergyPortfolio() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeDemoId, setActiveDemoId] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const demoRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1])
  const heroY = useTransform(scrollYProgress, [0, 0.16], [0, 110])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.14], [1, 0])

  const featuredProjects = PROJECTS.filter((project) => project.projectType !== 'story-gallery').slice(0, 4)
  const fieldProjects = PROJECTS.filter((project) => project.projectType === 'story-gallery')
  const activeDemoProject = featuredProjects.find((project) => project.id === activeDemoId)

  if (selectedProject) {
    return selectedProject.projectType === 'story-gallery' ? (
      <ProjectStoryPage project={selectedProject} onBack={() => setSelectedProject(null)} />
    ) : (
      <ProjectDetails
        projectTitle={selectedProject.title}
        images={selectedProject.gallery}
        onBack={() => setSelectedProject(null)}
      />
    )
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const openDemo = (project: Project) => {
    if (!project.hasLiveDemo) {
      setSelectedProject(project)
      return
    }
    setActiveDemoId(project.id)
    window.setTimeout(() => demoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  return (
    <main className="mp-site">
      <motion.div className="mp-progress" style={{ scaleX: progressScale }} />

      <header className="mp-nav">
        <button className="mp-mark" onClick={() => scrollTo('home')} aria-label="Back to top">B/ET</button>
        <nav className={menuOpen ? 'is-open' : ''} aria-label="Main navigation">
          {navItems.map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)}>{label}</button>
          ))}
          <a href="/resume/BarisEgemenTokul_CV.pdf" target="_blank" rel="noreferrer">CV <ArrowUpRight size={14} /></a>
        </nav>
        <button className="mp-menu" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle menu">
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <section id="home" className="mp-hero">
        <motion.div style={{ y: heroY, opacity: heroOpacity }}>
          <p className="mp-hero-label">Energy systems · Industrial operations · Data</p>
          <h1>Barış Egemen<br />Tokul<span>.</span></h1>
          <div className="mp-hero-meta">
            <p>Energy Systems Engineer — Berlin, Germany</p>
            <p><i /> Available for opportunities</p>
          </div>
          <p className="mp-hero-intro">
            I turn energy and operational challenges into clear, useful systems — from renewable energy analysis to industrial data products.
          </p>
        </motion.div>
        <button className="mp-scroll-cue" onClick={() => scrollTo('work')}>Scroll to explore <ArrowDown size={15} /></button>
      </section>

      <section id="work" className="mp-work">
        <div className="mp-section-kicker"><span>Selected projects</span><span>2022—2026 / 04</span></div>
        {featuredProjects.map((project, index) => (
          <article className="mp-project" key={project.id}>
            <div className="mp-project-copy">
              <span className="mp-index">{String(index + 1).padStart(2, '0')}</span>
              <motion.div
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.65 }}
              >
                <p className="mp-category">{project.category}</p>
                <h2>{project.title}</h2>
                <p className="mp-description">{project.description}</p>
                <div className="mp-tags">{(project.tech ?? project.tags ?? []).slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>
                <button className="mp-text-link" onClick={() => openDemo(project)}>
                  {project.hasLiveDemo ? 'Open live project' : 'View project'} <ArrowUpRight size={17} />
                </button>
              </motion.div>
            </div>
            <motion.div
              className="mp-project-visual"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.8 }}
            >
              <ProjectVisual project={project} />
            </motion.div>
          </article>
        ))}

        {activeDemoProject ? (
          <div className="mp-demo" ref={demoRef}>
            <div className="mp-demo-head">
              <div><p>Live project</p><h3>{activeDemoProject.title}</h3></div>
              <button onClick={() => setActiveDemoId(null)}>Close <X size={17} /></button>
            </div>
            <React.Suspense fallback={<div className="mp-loading">Loading project…</div>}>
              {activeDemoId === 'smart-order-tracker' ? <OrderTrackerDashboard /> : null}
              {activeDemoId === 'solar-yield-estimator' ? <SolarEstimator /> : null}
              {activeDemoId === 'turbine-data-management' ? <TurbineDataManagementDemo /> : null}
              {activeDemoId === 'data-lab' ? <ProjectPortfolioDataDemo /> : null}
            </React.Suspense>
          </div>
        ) : null}
      </section>

      <section id="about" className="mp-about">
        <span className="mp-index">05 / About</span>
        <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          Engineering experience with a digital mindset — <span>built around useful outcomes.</span>
        </motion.h2>
        <div className="mp-capabilities">
          <span>Renewable Energy</span><span>Data & Analytics</span><span>Process Improvement</span>
          <span>Quality Management</span><span>Web Applications</span><span>Technical Reporting</span>
        </div>
        <div className="mp-education">
          <p>MSc Engineering Management<br /><small>Berlin School of Business and Innovation · 2025—Present</small></p>
          <p>BSc Energy Systems Engineering<br /><small>Bahcesehir University · 2018—2024</small></p>
        </div>
      </section>

      <section id="experience" className="mp-list-section">
        <div className="mp-list-title"><span>06 / Experience</span><h2>Experience</h2></div>
        <div className="mp-list">
          {experience.map(([role, company, year]) => (
            <div className="mp-list-row" key={`${role}-${company}`}><strong>{role}</strong><span>{company}</span><span>{year}</span></div>
          ))}
        </div>
      </section>

      <section className="mp-fieldwork">
        <div className="mp-list-title"><span>07 / Field work</span><h2>Selected field work</h2></div>
        <div className="mp-field-grid">
          {fieldProjects.map((project, index) => (
            <button key={project.id} onClick={() => setSelectedProject(project)}>
              <span>{String(index + 1).padStart(2, '0')}</span><strong>{project.title}</strong><ArrowUpRight />
            </button>
          ))}
        </div>
      </section>

      <section className="mp-publications">
        <div className="mp-list-title"><span>08 / Publications</span><h2>Selected writing</h2></div>
        <div className="mp-publication-list">
          {publications.map(([title, year, link], index) => (
            <a href={link} target="_blank" rel="noreferrer" key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span><strong>{title}</strong><span>{year}</span><ArrowUpRight />
            </a>
          ))}
        </div>
      </section>

      <section id="contact" className="mp-contact">
        <span>09 / Contact</span>
        <h2>Let’s make energy<br />work smarter.</h2>
        <a className="mp-email" href="mailto:barisegementokul@gmail.com">barisegementokul@gmail.com</a>
        <div className="mp-contact-links">
          <a href="https://www.linkedin.com/in/baris-egemen-tokul-8016751b5" target="_blank" rel="noreferrer"><Linkedin /> LinkedIn</a>
          <a href="https://github.com/BRSTKL" target="_blank" rel="noreferrer"><Github /> GitHub</a>
          <a href="/resume/BarisEgemenTokul_CV.pdf" target="_blank" rel="noreferrer"><Download /> Download CV</a>
          <a href="mailto:barisegementokul@gmail.com"><Mail /> Email</a>
        </div>
        <footer><strong>BET.</strong><span>Berlin · © {new Date().getFullYear()} Barış Egemen Tokul</span></footer>
      </section>
    </main>
  )
}
