import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';

const categories = ['All', 'Core HR', 'Talent', 'Workforce', 'Finance', 'Intelligence'];

const modules = [
  { name: 'Employee Management', cat: 'Core HR', status: 'live' },
  { name: 'Organization Chart', cat: 'Core HR', status: 'live' },
  { name: 'Department Hierarchy', cat: 'Core HR', status: 'live' },
  { name: 'Position Management', cat: 'Core HR', status: 'live' },
  { name: 'Document Vault', cat: 'Core HR', status: 'live' },
  { name: 'Employee Self-Service', cat: 'Core HR', status: 'live' },
  { name: 'Onboarding Workflows', cat: 'Core HR', status: 'live' },
  { name: 'Offboarding Automation', cat: 'Core HR', status: 'live' },
  { name: 'Job Postings & Career Page', cat: 'Talent', status: 'addon' },
  { name: 'Candidate Pipeline (ATS)', cat: 'Talent', status: 'addon' },
  { name: 'AI Resume Screening', cat: 'Talent', status: 'addon' },
  { name: 'Interview Scheduling', cat: 'Talent', status: 'addon' },
  { name: 'Offer Letter Automation', cat: 'Talent', status: 'addon' },
  { name: 'Performance Reviews', cat: 'Talent', status: 'live' },
  { name: 'Goal Tracking', cat: 'Talent', status: 'live' },
  { name: 'Skill Matrix', cat: 'Talent', status: 'coming' },
  { name: '360° Feedback', cat: 'Talent', status: 'coming' },
  { name: '9-Box Grid', cat: 'Talent', status: 'coming' },
  { name: 'Succession Planning', cat: 'Talent', status: 'coming' },
  { name: 'Attendance Tracking', cat: 'Workforce', status: 'live' },
  { name: 'Leave Management', cat: 'Workforce', status: 'live' },
  { name: 'LOP (Loss of Pay)', cat: 'Workforce', status: 'live' },
  { name: 'Shift Scheduling', cat: 'Workforce', status: 'live' },
  { name: 'Holiday Calendar', cat: 'Workforce', status: 'live' },
  { name: 'Calendar Overview', cat: 'Workforce', status: 'live' },
  { name: 'Geo-Fenced Check-in', cat: 'Workforce', status: 'coming' },
  { name: 'Timesheet & Projects', cat: 'Workforce', status: 'coming' },
  { name: 'Payroll Processing', cat: 'Finance', status: 'live' },
  { name: 'Salary Structures', cat: 'Finance', status: 'live' },
  { name: 'Tax & Statutory Rules', cat: 'Finance', status: 'live' },
  { name: 'Payslip Generation', cat: 'Finance', status: 'live' },
  { name: 'Multi-Country Compliance', cat: 'Finance', status: 'live' },
  { name: 'Expense Management', cat: 'Finance', status: 'coming' },
  { name: 'Loans & Advances', cat: 'Finance', status: 'coming' },
  { name: 'Executive Dashboards', cat: 'Intelligence', status: 'live' },
  { name: 'Workforce Analytics', cat: 'Intelligence', status: 'live' },
  { name: 'AI HR Chatbot (GPT-4o)', cat: 'Intelligence', status: 'live' },
  { name: 'System Audit Logs', cat: 'Intelligence', status: 'live' },
  { name: 'Attrition Prediction', cat: 'Intelligence', status: 'coming' },
  { name: 'Sentiment Analysis', cat: 'Intelligence', status: 'coming' },
  { name: 'Anomaly Detection', cat: 'Intelligence', status: 'coming' },
];

const ModulesSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const [activeCat, setActiveCat] = useState('All');

  const filtered = activeCat === 'All' ? modules : modules.filter((m) => m.cat === activeCat);

  return (
    <section id="modules" className="section-padding bg-secondary/20" ref={ref}>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="text-primary font-display text-sm tracking-widest uppercase font-semibold">Complete Platform</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 text-foreground">
            <span className="gradient-text">35+</span> Modules
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Every module you'll ever need — from hire to retire. Each independently configurable per company.
          </p>
        </motion.div>

        {/* Category filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-display font-semibold uppercase tracking-wider transition-all duration-300
                ${activeCat === cat
                  ? 'text-white shadow-lg'
                  : 'bg-secondary/50 text-muted-foreground hover:text-foreground border border-border/50'
                }`}
              style={activeCat === cat ? { background: 'var(--gradient-primary)' } : {}}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Modules grid */}
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((m, i) => (
            <motion.div
              key={m.name}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: i * 0.02 }}
              className="glass-card p-4 text-center group hover:border-primary/30 transition-all duration-300 relative"
            >
              <div className="text-xs font-display font-medium text-foreground mb-1">{m.name}</div>
              <div className={`text-[10px] font-semibold uppercase tracking-wider ${
                m.status === 'live' ? 'text-emerald-400' : m.status === 'addon' ? 'text-sky-400' : 'text-amber-400'
              }`}>
                {m.status === 'live' ? '● Live' : m.status === 'addon' ? '◆ Add-on' : '◐ Coming Soon'}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ModulesSection;
