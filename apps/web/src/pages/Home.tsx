import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Zap,
  ShieldCheck,
  Globe,
  Code,
  Database,
  MessageSquare,
  Users,
  CheckCircle2,
  ArrowRight,
  Headphones,
  BarChart3,
  Layers,
  Cpu,
  Check,
  Copy,
  ExternalLink,
  Star,
  Play,
  ChevronDown,
  Search,
  Building,
  PhoneCall,
  Mail,
  Lock,
  UtensilsCrossed,
  Hotel,
  Briefcase,
  Stethoscope,
  Home as HomeIcon,
  ShoppingBag,
  Send,
  RefreshCw,
} from 'lucide-react';

export function Home() {
  const [activeTab, setActiveTab] = useState<'restaurant' | 'agency' | 'hotel' | 'clinic'>('agency');
  const [clientIdInput, setClientIdInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Interactive Live Sandbox Chat State
  const [sandboxMessages, setSandboxMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; pills?: string[] }>>([
    {
      sender: 'bot',
      text: 'Namaste! 👋 Welcome to NestChat. I am powered by Advanced AI. How can I assist your business today?',
      pills: ['Request Web Quote', 'View Services', 'Book Consultation', 'Test Hinglish AI'],
    },
  ]);
  const [sandboxInput, setSandboxInput] = useState('');
  const [isSandboxThinking, setIsSandboxThinking] = useState(false);

  const handleSandboxSend = (textToSend?: string) => {
    const text = (textToSend || sandboxInput).trim();
    if (!text) return;

    const userMsg = { sender: 'user' as const, text };
    setSandboxMessages(prev => [...prev, userMsg]);
    if (!textToSend) setSandboxInput('');
    setIsSandboxThinking(true);

    setTimeout(() => {
      let replyText = '';
      let replyPills: string[] | undefined = undefined;

      const lower = text.toLowerCase();
      if (lower.includes('hinglish') || lower.includes('namaste') || lower.includes('kaise')) {
        replyText = 'Haanji! Aap Roman Hindi / Hinglish me bhi baat kar sakte hain. Main aapke business website ke liye automated leads aur instant answers offer karta hoon!';
        replyPills = ['Price batao', 'Contact details', 'Demo dekho'];
      } else if (lower.includes('quote') || lower.includes('price') || lower.includes('website') || lower.includes('cost')) {
        replyText = 'I would be happy to help with your website quote! May I know your Full Name first?';
        replyPills = ['Submit Details', 'Talk to Team'];
      } else if (lower.includes('service') || lower.includes('view services')) {
        replyText = 'We provide Custom Web Development, Multi-tenant AI Chatbot Integration, UI/UX Design, and Cloud Hosting solutions. What type of project are you planning?';
        replyPills = ['Web App Development', 'AI Chatbot Setup', 'E-Commerce Website'];
      } else if (lower.includes('book') || lower.includes('consultation')) {
        replyText = 'I can help reserve a 1-on-1 consultation slot. Would you like our technical team to connect with you via Phone or Email?';
        replyPills = ['Phone Call', 'Email Response'];
      } else {
        replyText = `Thank you for your question about "${text}". NestChat uses RAG (Retrieval-Augmented Generation) to answer business-specific queries with 100% Zero-Hallucination accuracy.`;
        replyPills = ['What is RAG?', 'Try Lead Form', 'Export CSV'];
      }

      setSandboxMessages(prev => [...prev, { sender: 'bot', text: replyText, pills: replyPills }]);
      setIsSandboxThinking(false);
    }, 700);
  };

  const handleCopyCode = () => {
    const snippet = `<script\n  src="https://nestchat-api.onrender.com/widget.js"\n  data-client-id="${clientIdInput || 'your-client-id'}"\n  data-api-url="https://nestchat-api.onrender.com/api"\n  defer>\n</script>`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* ─── NAVIGATION BAR ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                NestChat <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">v2.0 AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Enterprise SaaS Chatbot Platform</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
            <a href="#solutions" className="hover:text-indigo-400 transition-colors">Industry Solutions</a>
            <a href="#integration" className="hover:text-indigo-400 transition-colors">1-Click Install</a>
            <a href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing</a>
            <a href="#faqs" className="hover:text-indigo-400 transition-colors">FAQs</a>
          </nav>

          <div className="flex items-center gap-4">
            <a
              href="https://nestchat-admin-7my6.onrender.com"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all border border-slate-700/60"
            >
              Admin Dashboard <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href="#demo"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              Try Live AI Demo
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* ─── HERO SECTION ────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-20 lg:py-28 bg-radial-gradient">
          {/* Background Ambient Glow Effects */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Column: Headline & Value Prop */}
              <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-inner">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span>Powered by Advanced AI</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
                  Automate Leads & Support With <br />
                  <span className="text-gradient">Next-Gen AI Chatbots</span>
                </h1>

                <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                  NestChat is a multi-tenant SaaS AI platform that converts website visitors into qualified leads. Featuring <strong className="text-indigo-300 font-semibold">Zero-Hallucination RAG Search</strong>, native Hinglish/Hindi AI memory, and automatic CRM lead sync.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <a
                    href="https://nestchat-admin-7my6.onrender.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 transition-all shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Deploy Chatbot Free <ArrowRight className="w-5 h-5" />
                  </a>
                  <a
                    href="#integration"
                    className="w-full sm:w-auto px-7 py-4 rounded-xl text-base font-semibold text-slate-300 hover:text-white glass-panel hover:bg-slate-800/90 transition-all flex items-center justify-center gap-2 border border-slate-700/80"
                  >
                    <Code className="w-5 h-5 text-indigo-400" /> Get Embed Code
                  </a>
                </div>

                {/* Trust Metrics Bar */}
                <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-center lg:text-left">
                  <div>
                    <div className="text-2xl lg:text-3xl font-extrabold text-white">100k+</div>
                    <div className="text-xs text-slate-400 font-medium">Conversations Handled</div>
                  </div>
                  <div>
                    <div className="text-2xl lg:text-3xl font-extrabold text-emerald-400">&lt;500ms</div>
                    <div className="text-xs text-slate-400 font-medium">AI Latency</div>
                  </div>
                  <div>
                    <div className="text-2xl lg:text-3xl font-extrabold text-indigo-400">100%</div>
                    <div className="text-xs text-slate-400 font-medium">Zero-Hallucination RAG</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Interactive Demo Widget Container */}
              <div className="lg:col-span-5 relative" id="demo">
                <div className="relative mx-auto max-w-md glass-card rounded-3xl p-4 shadow-2xl border-slate-700/60 glow-purple">
                  
                  {/* Widget Header Mockup */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-2xl flex items-center justify-between text-white shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                          <Bot className="w-6 h-6 text-white" />
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-indigo-600 rounded-full" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm leading-snug">NestChat AI Assistant</h4>
                        <span className="text-[11px] text-indigo-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Online • Live AI Engine
                        </span>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-white/10 text-indigo-100 font-mono">
                      v2.0
                    </span>
                  </div>

                  {/* Widget Chat Messages Stream */}
                  <div className="p-4 space-y-3 h-[320px] overflow-y-auto text-xs scrollbar-thin">
                    {sandboxMessages.map((msg, index) => (
                      <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}>
                        <div
                          className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none shadow-md'
                              : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-none shadow-inner'
                          }`}
                        >
                          {msg.text}
                        </div>

                        {/* Quick Action Pills if any */}
                        {msg.pills && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {msg.pills.map((pill, pIdx) => (
                              <button
                                key={pIdx}
                                onClick={() => handleSandboxSend(pill)}
                                className="px-2.5 py-1 rounded-full bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition-all text-[11px] font-medium"
                              >
                                {pill}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {isSandboxThinking && (
                      <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>NestChat AI is thinking...</span>
                      </div>
                    )}
                  </div>

                  {/* Widget Input Box */}
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <input
                      type="text"
                      value={sandboxInput}
                      onChange={(e) => setSandboxInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSandboxSend()}
                      placeholder="Type a message or test Hinglish..."
                      className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button
                      onClick={() => handleSandboxSend()}
                      className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all shadow-md active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─── GRIDNEST WEB SOLUTION FEATURE HIGHLIGHT ─────────────────────── */}
        <section className="py-16 bg-slate-900/60 border-y border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Proven In Production
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Powering Web Solutions Like <span className="text-gradient">GridNest Web Solution</span>
            </h3>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">
              NestChat actively runs on official client websites like <strong className="text-slate-200">gridnestsolution.in</strong>, delivering instant customer quotes, automated inquiry tracking, and high-conversion lead generation.
            </p>
          </div>
        </section>

        {/* ─── FEATURE SHOWCASE GRID ───────────────────────────────────────── */}
        <section id="features" className="py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Enterprise AI Capabilities</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Everything You Need To Automate <br />
                <span className="text-gradient">Customer Conversations & Sales</span>
              </h2>
              <p className="text-slate-400 text-base">
                Engineered with high-throughput LLM infrastructure, strict RAG context validation, and multi-tenant isolation for enterprise security.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Feature 1 */}
              <div className="glass-card p-6 rounded-2xl space-y-4 transition-all">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Advanced AI Engine</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Powered by high-speed AI inference engine for deep reasoning and accurate zero-hallucination answers.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-card p-6 rounded-2xl space-y-4 transition-all">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">RAG & Vector Search</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Nomic Text Embeddings (<code className="text-purple-300">nomic-embed-text-v1.5</code>) vectorize your knowledge base for 100% accurate document search.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-card p-6 rounded-2xl space-y-4 transition-all">
                <div className="w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Hinglish & Multi-Language</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Understands Romanized Hindi (Hinglish) natively ("Muje pricing batao"), Devnagari Hindi, and English fluently.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="glass-card p-6 rounded-2xl space-y-4 transition-all">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Smart Lead Capture</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  4-step automated lead collector (Name, Phone, Email, Requirement) with deduplication guardrails and instant CRM sync.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="glass-card p-6 rounded-2xl space-y-4 transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Multi-Tenant Platform</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Manage multiple client websites from a single central admin dashboard with isolated data and tenant security.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="glass-card p-6 rounded-2xl space-y-4 transition-all">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Headphones className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Human Agent Handoff</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Real-time Socket.IO agent takeover when a user requests human support or complex sales assistance.
                </p>
              </div>

              {/* Feature 7 */}
              <div className="glass-card p-6 rounded-2xl space-y-4 transition-all">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Real-Time Analytics</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Track conversation volume, lead conversion rates, unanswered questions, and client module status live.
                </p>
              </div>

              {/* Feature 8 */}
              <div className="glass-card p-6 rounded-2xl space-y-4 transition-all">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <Code className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">1-Click Script Embed</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Integrates seamlessly into HTML, React, WordPress, Shopify, Next.js, or any custom website stack.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ─── INDUSTRY SOLUTIONS SWITCHER ─────────────────────────────────── */}
        <section id="solutions" className="py-24 bg-slate-900/40 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Adaptive AI Intelligence</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Tailored Solutions For Every Industry
              </h2>
              <p className="text-slate-400 text-sm">
                NestChat automatically infers your business type and dynamically adapts its conversation style, questions, and lead forms.
              </p>
            </div>

            {/* Industry Selector Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setActiveTab('agency')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  activeTab === 'agency'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                    : 'glass-panel text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                <Briefcase className="w-4 h-4" /> Web Agency & Tech
              </button>
              <button
                onClick={() => setActiveTab('restaurant')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  activeTab === 'restaurant'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                    : 'glass-panel text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" /> Restaurant & Dining
              </button>
              <button
                onClick={() => setActiveTab('hotel')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  activeTab === 'hotel'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                    : 'glass-panel text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                <Hotel className="w-4 h-4" /> Hotels & Hospitality
              </button>
              <button
                onClick={() => setActiveTab('clinic')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  activeTab === 'clinic'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                    : 'glass-panel text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                <Stethoscope className="w-4 h-4" /> Healthcare & Clinics
              </button>
            </div>

            {/* Active Tab Preview Card */}
            <div className="glass-card rounded-3xl p-8 max-w-4xl mx-auto border-indigo-500/20">
              {activeTab === 'agency' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Web Development & Agency AI</h3>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Captures client project requirements, budget, timeline, and website type (Corporate, E-Commerce, Landing Page) automatically.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-400">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Auto-collects Website Type & Project Scope</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Prompts visitor for Full Name, Phone & Email</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Forwards inquiry to agency inbox & CRM</li>
                    </ul>
                  </div>
                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-xs space-y-3 font-mono">
                    <div className="text-slate-500 text-[10px]">Sample Bot Conversation:</div>
                    <div className="bg-slate-800 p-2.5 rounded-lg text-slate-300">Bot: "May I know your Full Name?"</div>
                    <div className="bg-indigo-600/30 p-2.5 rounded-lg text-indigo-200 text-right">User: "Vishal Sahu"</div>
                    <div className="bg-slate-800 p-2.5 rounded-lg text-slate-300">Bot: "What is your Email address?"</div>
                  </div>
                </div>
              )}

              {activeTab === 'restaurant' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <UtensilsCrossed className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Restaurant & Cafe Automation</h3>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Answers menu inquiries, pricing, dish availability, and handles table reservation details effortlessly.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-400">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Answers exact menu items & pricing</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Collects date, time & number of guests</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Zero hallucination on unlisted dishes</li>
                    </ul>
                  </div>
                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-xs space-y-3 font-mono">
                    <div className="text-slate-500 text-[10px]">Sample Bot Conversation:</div>
                    <div className="bg-slate-800 p-2.5 rounded-lg text-slate-300">Bot: "Our special menu includes Paneer Tikka & Dal Makhani. Would you like to reserve a table?"</div>
                    <div className="bg-indigo-600/30 p-2.5 rounded-lg text-indigo-200 text-right">User: "Yes table for 4 guests"</div>
                  </div>
                </div>
              )}

              {activeTab === 'hotel' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Hotel className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Hotel & Resort Booking AI</h3>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Guides guests through room availability, check-in policies, amenities, and reservation inquiries.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-400">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Room category details & tariff answers</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Collects guest contact for confirmation</li>
                    </ul>
                  </div>
                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-xs space-y-3 font-mono">
                    <div className="text-slate-500 text-[10px]">Sample Bot Conversation:</div>
                    <div className="bg-slate-800 p-2.5 rounded-lg text-slate-300">Bot: "Deluxe Ocean View Rooms are available. May I know your expected check-in date?"</div>
                  </div>
                </div>
              )}

              {activeTab === 'clinic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Healthcare & Dental Appointments</h3>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Assists patients with doctor schedules, clinic timings, appointment requests, and consultation booking.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-400">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Doctor timings & consultation fee info</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Patient name & preferred slot collection</li>
                    </ul>
                  </div>
                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-xs space-y-3 font-mono">
                    <div className="text-slate-500 text-[10px]">Sample Bot Conversation:</div>
                    <div className="bg-slate-800 p-2.5 rounded-lg text-slate-300">Bot: "Dr. Sharma is available 5 PM - 8 PM. May I know your Full Name to book an appointment?"</div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ─── 1-CLICK INTEGRATION SECTION ─────────────────────────────────── */}
        <section id="integration" className="py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-card rounded-3xl p-8 lg:p-12 border-slate-700/60 relative z-10 space-y-8">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Instant Setup</span>
                  <h2 className="text-3xl font-extrabold text-white">
                    Embed NestChat On Any Website In <span className="text-gradient">30 Seconds</span>
                  </h2>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Simply paste a single line of JavaScript into your website's HTML before the closing <code className="text-indigo-300">&lt;/body&gt;</code> tag. Compatible with WordPress, React, Shopify, HTML, Webflow, and Wix.
                  </p>
                  
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Enter Your Client ID:</label>
                    <input
                      type="text"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      placeholder="e.g. trial-client-id"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Code Snippet Box */}
                <div className="lg:col-span-6 bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-3 font-mono text-xs relative">
                  <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                    <span className="flex items-center gap-2"><Code className="w-4 h-4 text-indigo-400" /> HTML Embed Code</span>
                    <button
                      onClick={handleCopyCode}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-[11px] font-semibold flex items-center gap-1.5 shadow"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>

                  <pre className="text-indigo-200 overflow-x-auto text-[11px] leading-relaxed p-2">
{`<script
  src="https://nestchat-api.onrender.com/widget.js"
  data-client-id="${clientIdInput || 'your-client-id'}"
  data-api-url="https://nestchat-api.onrender.com/api"
  defer>
</script>`}
                  </pre>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─── PRICING PLANS ───────────────────────────────────────────────── */}
        <section id="pricing" className="py-24 bg-slate-900/40 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Simple & Transparent Pricing</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Choose The Plan That Fits Your Scale
              </h2>
              <p className="text-slate-400 text-sm">
                No hidden fees. Every plan includes AI acceleration and automated lead collection.
              </p>

              {/* Billing Toggle */}
              <div className="inline-flex items-center gap-2 p-1.5 rounded-xl glass-panel border-slate-700/80">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    billingCycle === 'monthly' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    billingCycle === 'yearly' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Yearly (Save 20%)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              
              {/* Starter Plan */}
              <div className="glass-card p-8 rounded-3xl space-y-6 flex flex-col justify-between border-slate-800">
                <div className="space-y-4">
                  <div className="inline-block px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[11px] font-bold">
                    Starter
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">
                      {billingCycle === 'monthly' ? '$2' : '$1.6'}
                    </span>
                    <span className="text-slate-400 text-xs">/ month</span>
                  </div>
                  <p className="text-slate-400 text-xs">Perfect for personal websites and early-stage startups.</p>
                  
                  <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-800">
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400" /> 1 Website Client Integration</li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400" /> 1,000 Messages / month</li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400" /> AI Engine</li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400" /> Standard Lead Capture Form</li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400" /> Admin Panel & CSV Export</li>
                  </ul>
                </div>

                <a
                  href="https://nestchat-admin-7my6.onrender.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors text-center"
                >
                  Start Free Trial
                </a>
              </div>

              {/* Pro Growth Plan (Highlighted) */}
              <div className="glass-card p-8 rounded-3xl space-y-6 flex flex-col justify-between border-indigo-500/50 glow-purple relative scale-[1.03]">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                  Most Popular
                </div>

                <div className="space-y-4">
                  <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold">
                    Pro Growth
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">
                      {billingCycle === 'monthly' ? '$5' : '$4'}
                    </span>
                    <span className="text-slate-400 text-xs">/ month</span>
                  </div>
                  <p className="text-slate-400 text-xs">Ideal for growing businesses, agencies, and e-commerce stores.</p>
                  
                  <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-800">
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400" /> 5 Website Client Integrations</li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400" /> Unlimited AI Messages</li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400" /> RAG Semantic Vector Search</li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400" /> Native Hinglish & Multi-Language</li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400" /> Priority Webhook & Email Forwarding</li>
                  </ul>
                </div>

                <a
                  href="https://nestchat-admin-7my6.onrender.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs transition-all shadow-lg text-center"
                >
                  Upgrade To Pro
                </a>
              </div>

            </div>
          </div>
        </section>

        {/* ─── FAQS SECTION ────────────────────────────────────────────────── */}
        <section id="faqs" className="py-24 relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Got Questions?</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "How does NestChat guarantee Zero-Hallucination answers for my business?",
                  a: "NestChat operates under a strict Closed-World Assumption for business queries. It searches only your uploaded knowledge base, FAQs, and scraped website pages using RAG (Retrieval-Augmented Generation). If specific business facts are not present, it gracefully offers to collect visitor contact details instead of inventing details."
                },
                {
                  q: "Does NestChat support Roman Hindi (Hinglish)?",
                  a: "Yes! NestChat has native Hinglish understanding engineered directly into its system prompt. Visitors can chat in conversational Hinglish ('Muje website ka cost batao') and the bot will reply fluently in Hinglish."
                },
                {
                  q: "How are lead notifications delivered to my team?",
                  a: "As soon as a visitor completes a lead form or inquiry, the details are instantly saved to your NestChat Admin Dashboard, logged in real-time notifications, and can be exported via CSV or forwarded directly to your website's custom API/Webhook."
                },
                {
                  q: "Can I manage multiple client websites from one account?",
                  a: "Yes! NestChat is a full multi-tenant SaaS platform. Each client receives a unique Client ID, custom branding themes, independent knowledge base items, and isolated inquiry records."
                },
                {
                  q: "How do I embed NestChat on my website?",
                  a: "Copy the single-line `<script>` tag provided in your admin panel or in our 1-click installer section above and paste it before the `</body>` tag of your site."
                }
              ].map((faq, index) => (
                <div key={index} className="glass-card rounded-2xl border-slate-800 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full p-5 text-left font-bold text-sm text-white flex items-center justify-between gap-4"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-indigo-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === index && (
                    <div className="px-5 pb-5 text-slate-400 text-xs leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ─── BOTTOM CTA BANNER ────────────────────────────────────────────── */}
        <section className="py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-card rounded-3xl p-10 lg:p-16 border-indigo-500/30 text-center space-y-6 glow-purple relative z-10">
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
                Ready To Automate Your Website Sales?
              </h2>
              <p className="text-slate-300 text-sm max-w-2xl mx-auto">
                Join GridNest Web Solution and modern enterprises leveraging NestChat for AI automated lead capture.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="https://gridnestsolution.in/contact"
                  target="_blank"
                  rel="noreferrer"
                  className="px-8 py-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/30"
                >
                  Get Started For Free
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/80 py-12 bg-slate-950 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-white text-sm">NestChat AI SaaS</span>
            <span className="text-slate-600">|</span>
            <span>Powered by GridNest Web Solution</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="https://gridnestsolution.in" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              GridNest Website
            </a>
            <a href="https://nestchat-admin-7my6.onrender.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              Admin Portal
            </a>
          </div>

          <div>
            &copy; {new Date().getFullYear()} NestChat. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
