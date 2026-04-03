import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Bot, Brain, FileSearch, TrendingUp, MessageSquare, Sparkles } from 'lucide-react';

const aiFeatures = [
  { icon: Bot, title: 'HR Chatbot (RAG)', desc: 'Natural language Q&A over company policies, handbooks, and HR data using Retrieval-Augmented Generation.' },
  { icon: FileSearch, title: 'AI Resume Screening', desc: 'Automatically parse, score, and rank candidates against job requirements using NLP and skill matching.' },
  { icon: TrendingUp, title: 'Attrition Prediction', desc: 'ML models analyze engagement, performance, and behavior patterns to predict flight risk before it happens.' },
  { icon: Brain, title: 'Sentiment Analysis', desc: 'Analyze employee feedback, survey responses, and chat sentiment to gauge organizational health in real-time.' },
  { icon: MessageSquare, title: 'Smart Letter Generation', desc: 'AI drafts offer letters, appraisal letters, experience certificates, and warnings from templates with context.' },
  { icon: Sparkles, title: 'Anomaly Detection', desc: 'Detect payroll discrepancies, attendance fraud, unusual expense patterns, and policy violations automatically.' },
];

const AISection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="ai" className="section-padding relative overflow-hidden" ref={ref}>
      {/* Background orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] orb-violet rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] orb-cyan rounded-full blur-3xl opacity-20" />

      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-display text-sm tracking-widest uppercase font-semibold">AI Engine</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 text-foreground">
            Intelligence at <span className="gradient-text">Every Layer</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Our FastAPI-powered AI engine with pgvector embeddings, LangChain orchestration, and multi-model support (GPT-4, Claude, Gemini)
            brings human-level intelligence to every HR decision.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* AI Features list */}
          <div className="grid sm:grid-cols-2 gap-4">
            {aiFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glow-card glow-card-violet p-5 group"
              >
                <div className="w-10 h-10 rounded-lg bg-[hsl(260_80%_60%/0.1)] border border-[hsl(260_80%_60%/0.2)] flex items-center justify-center mb-4 transition-all duration-500 group-hover:bg-[hsl(260_80%_60%/0.2)] group-hover:shadow-[0_0_20px_hsl(260_80%_60%/0.2)]">
                  <f.icon className="w-5 h-5 text-[hsl(260_80%_60%)]" />
                </div>
                <h3 className="font-display font-semibold text-sm text-foreground mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* AI Chat mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="glow-card p-1 max-w-md mx-auto lg:mx-0 lg:ml-auto"
          >
            <div className="rounded-lg bg-card border border-border/30 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-display font-semibold text-foreground">SRP AI Assistant</div>
                  <div className="text-[10px] text-primary">Online • RAG-powered</div>
                </div>
              </div>
              <div className="p-4 space-y-4 h-80 overflow-y-auto">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-primary/20 border border-primary/30 rounded-lg rounded-tr-none px-3 py-2 max-w-[80%]">
                    <p className="text-xs text-foreground">What's the leave policy for new joiners?</p>
                  </div>
                </div>
                {/* AI response */}
                <div className="flex justify-start">
                  <div className="bg-secondary/50 border border-border/30 rounded-lg rounded-tl-none px-3 py-2 max-w-[85%]">
                    <p className="text-xs text-foreground/90 leading-relaxed">
                      Based on the HR Policy Handbook (v4.2), new joiners receive:<br /><br />
                      • <strong>15 days</strong> Earned Leave (prorated)<br />
                      • <strong>10 days</strong> Sick Leave<br />
                      • <strong>3 days</strong> Casual Leave<br />
                      • <strong>5 days</strong> Compensatory Off eligibility<br /><br />
                      Leave is credited from the date of joining. Probation employees can use Sick Leave immediately but Earned Leave unlocks after 6 months.
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Sparkles className="w-3 h-3 text-primary" /> Sources: HR Handbook §4.2, Leave Policy 2026
                    </div>
                  </div>
                </div>
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-primary/20 border border-primary/30 rounded-lg rounded-tr-none px-3 py-2 max-w-[80%]">
                    <p className="text-xs text-foreground">Generate an offer letter for Priya Sharma — Senior Developer, CTC 28L</p>
                  </div>
                </div>
                {/* AI response */}
                <div className="flex justify-start">
                  <div className="bg-secondary/50 border border-border/30 rounded-lg rounded-tl-none px-3 py-2 max-w-[85%]">
                    <p className="text-xs text-foreground/90 leading-relaxed">
                      ✅ Offer letter generated for <strong>Priya Sharma</strong>.<br /><br />
                      Position: Senior Developer<br />
                      CTC: ₹28,00,000/annum<br />
                      Joining: April 15, 2026<br /><br />
                      📄 <span className="text-primary underline cursor-pointer">Download PDF</span> | 
                      ✉️ <span className="text-primary underline cursor-pointer">Send via Email</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-border/30">
                <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                  <input type="text" placeholder="Ask anything about HR..." className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none" readOnly />
                  <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                    <MessageSquare className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AISection;
