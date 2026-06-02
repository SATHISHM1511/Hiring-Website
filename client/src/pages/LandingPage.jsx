import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  FiArrowRight, FiBriefcase, FiUsers, FiTrendingUp, FiZap,
  FiStar, FiBell, FiSearch, FiShield, FiBarChart2, FiCheckCircle,
  FiTwitter, FiLinkedin, FiGithub, FiInstagram, FiMail, FiPhone,
  FiMapPin, FiChevronDown, FiMoon, FiSun, FiMenu, FiX
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api.js';
import styles from './LandingPage.module.css';

function AnimatedCounter({ target, suffix = '', duration = 2 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const observed = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !observed.current) {
        observed.current = true;
        let start = 0;
        const step = target / (duration * 60);
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 1000 / 60);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function FloatingBadge({ icon, text, className }) {
  return (
    <motion.div
      className={`${styles.floatingBadge} ${className}`}
      animate={{ y: [0, -10, 0] }}
      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
    >
      <span>{icon}</span>
      <span>{text}</span>
    </motion.div>
  );
}

const testimonials = [
  {
    name: 'Sarah Chen', role: 'Software Engineer', company: 'TechFlow Inc.',
    avatar: 'SC', rating: 5,
    text: "HireWave's AI matching found me the perfect role in just 2 weeks. The application tracking feature kept me informed every step of the way.",
  },
  {
    name: 'Marcus Johnson', role: 'Head of Talent', company: 'Nexus Labs',
    avatar: 'MJ', rating: 5,
    text: "We reduced our hiring time by 60% using HireWave's smart recruitment tools. The analytics dashboard gives us incredible insights.",
  },
  {
    name: 'Priya Sharma', role: 'Product Designer', company: 'Designify',
    avatar: 'PS', rating: 5,
    text: "The profile builder helped me showcase my portfolio beautifully. Got 3 interviews within a week of signing up!",
  },
  {
    name: 'James Wilson', role: 'CTO', company: 'StartupHub',
    avatar: 'JW', rating: 5,
    text: "Best hiring platform we've used. The candidate quality is exceptional and the whole process feels premium and professional.",
  },
];

const features = [
  {
    icon: '🤖', title: 'AI Job Matching',
    desc: 'Our AI analyzes your skills and preferences to surface the most relevant opportunities with precision matching.',
    color: 'blue',
  },
  {
    icon: '🎯', title: 'Smart Recruitment',
    desc: 'Streamline your hiring funnel with intelligent candidate scoring and automated workflow management.',
    color: 'purple',
  },
  {
    icon: '📄', title: 'Resume Analysis',
    desc: 'Advanced parsing extracts insights from resumes to match candidates with the perfect opportunities.',
    color: 'cyan',
  },
  {
    icon: '🔔', title: 'Real-time Notifications',
    desc: 'Stay updated instantly with Socket.io powered notifications for every stage of the hiring process.',
    color: 'green',
  },
  {
    icon: '📊', title: 'Analytics Dashboard',
    desc: 'Comprehensive insights and visualizations to optimize your hiring strategy and track performance.',
    color: 'orange',
  },
  {
    icon: '🛡️', title: 'Secure Platform',
    desc: 'Enterprise-grade security with JWT authentication and encrypted data storage for peace of mind.',
    color: 'pink',
  },
];

const steps = [
  { step: '01', title: 'Create Profile', desc: 'Build your professional profile with skills, experience, and portfolio.', icon: '👤' },
  { step: '02', title: 'Apply or Post', desc: 'Apply to jobs or post opportunities with our streamlined forms.', icon: '📝' },
  { step: '03', title: 'Get Matched', desc: 'Our AI engine finds the best matches based on skills and requirements.', icon: '🎯' },
  { step: '04', title: 'Get Hired', desc: 'Connect, interview, and land your dream role or perfect candidate.', icon: '🎊' },
];

const companies = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Spotify', 'Airbnb', 'Uber', 'Stripe', 'Figma', 'Notion'];

export default function LandingPage() {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeJobs: 1200, recruiters: 450, candidates: 8500, placements: 3200 });
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, -80]);

  useEffect(() => {
    api.get('/analytics/platform').then(({ data }) => {
      if (data.success) setStats(data.stats);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIdx(i => (i + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How it Works' },
    { href: '#testimonials', label: 'Testimonials' },
  ];

  return (
    <div className={styles.page}>
      <nav className={`${styles.navbar} glass`}>
        <div className={styles.navContainer}>
          <Link to="/" className={styles.navLogo}>
            <div className={styles.logoIcon}><FiZap size={18} /></div>
            <span>HireWave</span>
          </Link>

          <div className={`${styles.navLinks} ${menuOpen ? styles.mobileOpen : ''}`}>
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className={styles.navLink} onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ))}
          </div>

          <div className={styles.navActions}>
            <button className={styles.themeBtn} onClick={toggleTheme}>
              {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>
            {user ? (
              <button className="btn btn-primary btn-sm" onClick={() =>
                navigate(user.role === 'recruiter' ? '/recruiter/dashboard' : '/seeker/dashboard')
              }>
                Dashboard <FiArrowRight size={14} />
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
              </>
            )}
            <button className={styles.mobileMenu} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.blob1} />
          <div className={styles.blob2} />
          <div className={styles.blob3} />
          <div className={styles.grid} />
        </div>

        <motion.div
          className={styles.heroContent}
          style={{ opacity: heroOpacity, y: heroY }}
        >
          <motion.div
            className={styles.heroBadge}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className={styles.badgeDot} />
            <span>✨ AI-Powered Talent Matching</span>
          </motion.div>

          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <span className="text-gradient">Real Human Talent</span>
          </motion.h1>

          <motion.p
            className={styles.heroSubtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Where intelligent technology meets genuine human potential. Connect with
            top-tier opportunities and exceptional talent through AI-driven precision
            and human expertise.
          </motion.p>

          <motion.div
            className={styles.heroCTA}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <Link to="/register?role=job_seeker" className={`btn btn-primary btn-xl ${styles.ctaPrimary}`}>
              <FiSearch size={18} /> Find Jobs
            </Link>
            <Link to="/register?role=recruiter" className={`btn btn-outline btn-xl`}>
              <FiUsers size={18} /> Hire Talent
            </Link>
          </motion.div>

          <motion.div
            className={styles.heroTrust}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <div className={styles.trustAvatars}>
              {['A', 'B', 'C', 'D', 'E'].map((l, i) => (
                <div key={i} className={styles.trustAvatar} style={{ '--i': i }}>
                  {l}
                </div>
              ))}
            </div>
            <div>
              <div className={styles.trustStars}>{'⭐'.repeat(5)}</div>
              <p className={styles.trustText}>Trusted by <strong>10,000+</strong> professionals</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className={styles.heroVisual}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className={styles.heroCard}>
            <div className={styles.heroCardHeader}>
              <div className={styles.heroCardAvatar}>JD</div>
              <div>
                <p className={styles.heroCardName}>Senior React Developer</p>
                <p className={styles.heroCardCompany}>TechCorp · Remote · $120k-$160k</p>
              </div>
              <div className={styles.heroMatchBadge}>98%</div>
            </div>
            <div className={styles.heroCardSkills}>
              {['React', 'TypeScript', 'Node.js', 'AWS'].map(s => (
                <span key={s} className="tag">{s}</span>
              ))}
            </div>
            <div className={styles.heroCardFooter}>
              <span>🕐 2 hours ago</span>
              <button className="btn btn-primary btn-sm">Apply Now</button>
            </div>
          </div>

          <FloatingBadge icon="🎉" text="New offer received!" className={styles.badge1} />
          <FloatingBadge icon="📊" text="98% match found" className={styles.badge2} />
          <FloatingBadge icon="🚀" text="45 jobs this week" className={styles.badge3} />
        </motion.div>

        <motion.div
          className={styles.scrollIndicator}
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <FiChevronDown size={20} />
        </motion.div>
      </section>

      <section className={styles.stats}>
        <div className="container">
          <div className={styles.statsGrid}>
            {[
              { value: stats.activeJobs || 1200, label: 'Active Jobs', icon: '💼', suffix: '+' },
              { value: stats.recruiters || 450, label: 'Top Recruiters', icon: '🏢', suffix: '+' },
              { value: stats.candidates || 8500, label: 'Candidates', icon: '👥', suffix: '+' },
              { value: stats.placements || 3200, label: 'Placements', icon: '🎊', suffix: '+' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className={styles.statCard}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <span className={styles.statEmoji}>{stat.icon}</span>
                <div className={styles.statValue}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className={styles.statLabel}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className={styles.features}>
        <div className="container">
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className={styles.sectionBadge}>⚡ Features</div>
            <h2>Everything you need to hire<br />or get hired</h2>
            <p>Powerful tools built for modern hiring — from AI matching to real-time collaboration</p>
          </motion.div>

          <div className={styles.featuresGrid}>
            {features.map((feature, i) => (
              <motion.div
                key={i}
                className={`${styles.featureCard} ${styles[feature.color]}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -8 }}
              >
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className={styles.howItWorks}>
        <div className="container">
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className={styles.sectionBadge}>🗺️ Process</div>
            <h2>Your journey to success<br />in 4 simple steps</h2>
            <p>A seamless experience designed to connect talent with opportunity</p>
          </motion.div>

          <div className={styles.stepsContainer}>
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className={styles.stepCard}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className={styles.stepNumber}>{step.step}</div>
                <div className={styles.stepIcon}>{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {i < steps.length - 1 && <div className={styles.stepConnector} />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className={styles.testimonials}>
        <div className="container">
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className={styles.sectionBadge}>💬 Testimonials</div>
            <h2>Loved by professionals<br />worldwide</h2>
          </motion.div>

          <div className={styles.testimonialsContainer}>
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIdx}
                className={styles.testimonialCard}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
              >
                <div className={styles.testimonialStars}>
                  {'⭐'.repeat(testimonials[testimonialIdx].rating)}
                </div>
                <p className={styles.testimonialText}>
                  "{testimonials[testimonialIdx].text}"
                </p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.testimonialAvatar}>
                    {testimonials[testimonialIdx].avatar}
                  </div>
                  <div>
                    <p className={styles.testimonialName}>{testimonials[testimonialIdx].name}</p>
                    <p className={styles.testimonialRole}>
                      {testimonials[testimonialIdx].role} · {testimonials[testimonialIdx].company}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className={styles.testimonialDots}>
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${i === testimonialIdx ? styles.activeDot : ''}`}
                  onClick={() => setTestimonialIdx(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.companies}>
        <div className="container">
          <p className={styles.companiesLabel}>Trusted by teams at world's best companies</p>
          <div className={styles.marqueeWrapper}>
            <div className={styles.marquee}>
              {[...companies, ...companies].map((company, i) => (
                <div key={i} className={styles.companyBadge}>{company}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaBanner}>
        <div className="container">
          <motion.div
            className={styles.ctaBox}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className={styles.ctaContent}>
              <h2>Ready to transform<br />your hiring journey?</h2>
              <p>Join thousands of professionals already using HireWave</p>
              <div className={styles.ctaButtons}>
                <Link to="/register?role=job_seeker" className="btn btn-primary btn-xl">
                  Find Your Dream Job <FiArrowRight size={16} />
                </Link>
                <Link to="/register?role=recruiter" className={`btn btn-xl ${styles.ctaOutline}`}>
                  Start Hiring Today
                </Link>
              </div>
            </div>
            <div className={styles.ctaDecor}>
              <div className={styles.ctaBlob} />
            </div>
          </motion.div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>
                <div className={styles.logoIcon}><FiZap size={16} /></div>
                <span>HireWave</span>
              </div>
              <p>AI-Powered Hiring Platform connecting real talent with world-class opportunities.</p>
              <div className={styles.socialLinks}>
                <a href="#" aria-label="Twitter"><FiTwitter /></a>
                <a href="#" aria-label="LinkedIn"><FiLinkedin /></a>
                <a href="#" aria-label="GitHub"><FiGithub /></a>
                <a href="#" aria-label="Instagram"><FiInstagram /></a>
              </div>
            </div>

            <div className={styles.footerLinks}>
              <h4>Platform</h4>
              <Link to="/register?role=job_seeker">Find Jobs</Link>
              <Link to="/register?role=recruiter">Post Jobs</Link>
              <a href="#features">Features</a>
              <a href="#how-it-works">How it Works</a>
            </div>

            <div className={styles.footerLinks}>
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
              <a href="#">Press</a>
            </div>

            <div className={styles.footerLinks}>
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
            </div>

            <div className={styles.footerContact}>
              <h4>Contact</h4>
              <a href="mailto:hello@hirewave.com"><FiMail size={14} /> hello@hirewave.com</a>
              <a href="tel:+911234567890"><FiPhone size={14} /> +91 12345 67890</a>
              <p><FiMapPin size={14} /> Mumbai, India</p>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p>© 2024 HireWave. All rights reserved.</p>
            <p>Made with ❤️ for the hiring community</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
