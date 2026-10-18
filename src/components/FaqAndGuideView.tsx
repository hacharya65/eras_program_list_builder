'use client';

import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Sparkles,
  ArrowLeft,
  Compass,
  FileCheck,
  MailCheck,
  BookOpen,
  TrendingUp,
  ExternalLink,
  ShieldAlert,
  Info,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';

export interface FaqAndGuideViewProps {
  onBack: () => void;
  onStartWalkthrough: () => void;
  onNavigateToView?: (view: string) => void;
  targetSpecialty?: string;
}

interface FaqItem {
  id: string;
  category:
    | 'general'
    | 'school_list'
    | 'signals'
    | 'intake'
    | 'letters'
    | 'journal';
  categoryLabel: string;
  question: string;
  answer: string;
  tips?: string[];
  actionLabel?: string;
  actionView?: string;
}

const FAQ_DATABASE: FaqItem[] = [
  {
    id: 'faq-gen-1',
    category: 'general',
    categoryLabel: 'General & Account',
    question: 'How does Ethmoid personalize my residency strategy?',
    answer:
      'Ethmoid synthesizes your core clinical clerkship grades, USMLE Step examinations, research output, and work experiences to calculate an evidence-based Strategic Readiness Score. It cross-references your profile with historical NRMP charting outcomes and specialty-specific competitiveness standards.',
    tips: [
      'Complete your Advising Intake Dossier first to establish your personalized baseline.',
      'Your account begins with a clean slate—no pre-populated programs or mock letters.',
    ],
    actionLabel: 'Complete Advising Intake',
    actionView: 'intake',
  },
  {
    id: 'faq-gen-2',
    category: 'general',
    categoryLabel: 'General & Account',
    question: 'How do I replay the Platform Walkthrough at any time?',
    answer:
      'You can re-launch the interactive 6-step walkthrough at any moment by clicking the "Replay Platform Walkthrough & Tour" button at the top of this FAQ page or by selecting "FAQ & Platform Walkthrough" from the user profile dropdown.',
  },
  {
    id: 'faq-gen-3',
    category: 'general',
    categoryLabel: 'General & Account',
    question: 'Can I switch my target specialty, and what happens to my saved data?',
    answer:
      'Yes. You can switch your applying specialty from the top of the Dashboard or inside your Profile Management. Because program lists, signal caps (Gold/Silver), and advising champions differ by specialty, Ethmoid prompts you with a safety confirmation before resetting or isolating your specialty-specific program list.',
    actionLabel: 'Open Profile Management',
    actionView: 'profile',
  },
  {
    id: 'faq-sl-1',
    category: 'school_list',
    categoryLabel: 'Programs & Strategy',
    question: 'What do the Reach, Target, and Safety program tiers mean?',
    answer:
      'Tiers help ensure a balanced application portfolio. Reach programs represent highly competitive academic institutions where applicant metrics generally exceed historical averages. Target programs closely match your clinical performance and Step score profile. Safety programs provide solid probability based on regional retention and historical interview invite rates.',
    tips: [
      'Most faculty advisors recommend a 20% Reach, 50% Target, and 30% Safety distribution.',
      'Verify that your school list has sufficient depth based on your specialty’s NRMP match curve.',
    ],
    actionLabel: 'View School List Matrix',
    actionView: 'school_list',
  },
  {
    id: 'faq-sl-2',
    category: 'school_list',
    categoryLabel: 'Programs & Strategy',
    question: 'How do I add ACGME accredited programs to my list?',
    answer:
      'Navigate to the Programs & Strategy tab (School List Matrix). You can search the master ACGME database of over 2,500 programs by institution name, city, state, or ACGME 10-digit ID. Click "Add to Strategy" on any program to assign a tier, signaling preference, and private notes.',
    actionLabel: 'Search ACGME Programs',
    actionView: 'school_list',
  },
  {
    id: 'faq-sig-1',
    category: 'signals',
    categoryLabel: 'Gold & Silver Signals',
    question: 'What is the difference between Gold and Silver preference signals?',
    answer:
      'Gold signals denote your absolute top-tier interest in a program, signaling highest commitment. Silver signals communicate strong genuine interest. Residency program directors increasingly use signals as a primary screen before reviewing full application packets.',
    tips: [
      'Never signal a program without reviewing whether they consider signals in their selection process.',
      'Check whether your home institution and away rotation programs expect signals or consider you known applicants.',
    ],
  },
  {
    id: 'faq-sig-2',
    category: 'signals',
    categoryLabel: 'Gold & Silver Signals',
    question: 'How are signal quotas enforced across different specialties?',
    answer:
      'Each specialty establishes its own signal structure. For example, Internal Medicine allows 3 Gold and 12 Silver signals (total 15), Dermatology allows 3 Gold and 25 Silver (total 28), while Orthopedic Surgery allows 30 standard signals. Ethmoid dynamically tracks your assigned signals against the official specialty limit and alerts you if you exceed the quota.',
    actionLabel: 'Review Your Assigned Signals',
    actionView: 'school_list',
  },
  {
    id: 'faq-sig-3',
    category: 'signals',
    categoryLabel: 'Gold & Silver Signals',
    question: 'Should I signal my home program or away rotations?',
    answer:
      'Specialty guidelines vary. Many specialties (like Internal Medicine and General Surgery) explicitly state that home programs and away rotations do not require signals because connection is already established. However, some specialties advise signaling everyone you wish to be interviewed by. Review official specialty society and ACGME recommendations for your cycle.',
    actionLabel: 'Review Your Assigned Signals',
    actionView: 'school_list',
  },
  {
    id: 'faq-int-1',
    category: 'intake',
    categoryLabel: 'Advising Intake Dossier',
    question: 'How do I record and modify my Core Clinical Clerkships?',
    answer:
      'Under the Documents & Packet tab, open the Advising Intake Dossier. You will find "What are your Core Clinical Clerkship grades?" with 7 core clinical clerkships (Internal Medicine, Surgery, Pediatrics, OB/GYN, Psychiatry, Family Medicine, and Neurology). You can record your grade (Honors, High Pass, Pass, In Progress), add additional clerkships (e.g. Sub-Internships or Critical Care), or remove electives that do not apply.',
    actionLabel: 'Update Clerkship Grades',
    actionView: 'intake',
  },
  {
    id: 'faq-int-2',
    category: 'intake',
    categoryLabel: 'Advising Intake Dossier',
    question: 'Why does Ethmoid ask about Work Experiences count?',
    answer:
      'The NRMP Charting Outcomes matrix analyzes applicant matched probability relative to verified work experience count alongside publications and volunteer positions. Tracking this metric ensures your calculated competitiveness reflects the comprehensive residency applicant index.',
  },
  {
    id: 'faq-lor-1',
    category: 'letters',
    categoryLabel: 'Letters of Recommendation',
    question: 'How many letters of recommendation should I upload?',
    answer:
      'Most programs require 3 to 4 letters of recommendation. Typically, this includes 1 Department Chair or Program Director Summary Letter, 1 to 2 clinical letters from faculty in your applying specialty (preferably sub-internship attendings), and 1 elective or research letter.',
    tips: [
      'Confirm whether your specialty requires a standardized letter format (e.g., eSLOR for Orthopedics, SLOE for Emergency Medicine).',
      'Follow up politely 3 to 4 weeks prior to the ERAS document release deadline.',
    ],
    actionLabel: 'Manage Letter Requests',
    actionView: 'letters',
  },
  {
    id: 'faq-lor-2',
    category: 'letters',
    categoryLabel: 'Letters of Recommendation',
    question: 'Can I assign different letters to different programs?',
    answer:
      'Yes. In ERAS, letters are assigned on a per-program basis. Ethmoid’s LOR tracker allows you to record which writers have agreed, track submission status, and designate specialty tags so you know which letters will be submitted to each tier of your list.',
  },
  {
    id: 'faq-jrn-1',
    category: 'journal',
    categoryLabel: 'Reflective Journal',
    question: 'How should I utilize the Reflective Experience Journal?',
    answer:
      'The Reflective Journal is your personal repository for capturing memorable patient interactions, ethical dilemmas, clinical insights, and leadership challenges as they occur. When drafting your personal statement and ERAS impactful experiences, you can draw directly from these authentic journal entries.',
    tips: [
      'Write entries shortly after notable encounters while details and emotional nuances are fresh.',
      'Never include real patient identifiers (PHI) in journal notes.',
    ],
    actionLabel: 'Open Experience Journal',
    actionView: 'journal',
  },
];

export function FaqAndGuideView({
  onBack,
  onStartWalkthrough,
  onNavigateToView,
  targetSpecialty = 'Internal Medicine',
}: FaqAndGuideViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFaqIds, setExpandedFaqIds] = useState<Record<string, boolean>>({
    'faq-gen-1': true,
    'faq-sl-1': true,
  });

  const toggleFaq = (id: string) => {
    setExpandedFaqIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'general', label: 'General & Account' },
    { id: 'school_list', label: 'Programs & Strategy' },
    { id: 'signals', label: 'Gold & Silver Signals' },
    { id: 'intake', label: 'Advising Intake' },
    { id: 'letters', label: 'Letters of Rec' },
    { id: 'journal', label: 'Reflective Journal' },
  ];

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return FAQ_DATABASE.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        (item.tips && item.tips.some((t) => t.toLowerCase().includes(q)));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-[#1F3A30] hover:text-[#142720] bg-white border border-[#D6E5DF] px-3.5 py-2 rounded-xl shadow-2xs hover:bg-[#F2F7F4] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Applicant Dashboard</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Targeting {targetSpecialty} &bull; Match 2027</span>
          </span>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-gradient-to-r from-[#1F3A30] to-[#27483C] rounded-3xl p-6 sm:p-8 text-white shadow-sm border border-[#1F3A30]">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-medium border border-white/10">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Support &amp; Strategy Knowledgebase</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Frequently Asked Questions &amp; Guide
          </h1>

          <p className="text-sm sm:text-base text-neutral-200/90 leading-relaxed">
            Essential guidance for navigating your residency match strategy, allocating Gold &amp; Silver preference signals, maintaining your clinical dossier, and building a balanced, evidence-based program list.
          </p>

          {/* Interactive Replay Walkthrough Banner */}
          <div className="pt-3">
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    Need a guided refresher of the platform?
                  </div>
                  <div className="text-xs text-emerald-200/90">
                    Step through the interactive 6-step tour of all tabs, tools, and workflows.
                  </div>
                </div>
              </div>

              <button
                onClick={onStartWalkthrough}
                className="inline-flex items-center gap-2 bg-white text-[#1F3A30] hover:bg-emerald-50 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#1F3A30]" />
                <span>Replay Platform Walkthrough</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 shadow-2xs space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by topic, keyword (e.g. signals, clerkships, tiers, letters)..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3A30] focus:bg-white transition-all placeholder:text-neutral-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => {
            const isSelected = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1F3A30] text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-800">
              No matching questions found
            </h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              We couldn't find any questions matching "{searchQuery}". Try searching for another term like "signals", "tiers", or "clerkships".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-xs font-semibold text-[#1F3A30] underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = Boolean(expandedFaqIds[faq.id]);
            return (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 hover:bg-neutral-50/70 transition-colors cursor-pointer"
                  aria-expanded={isExpanded}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#4E8773] bg-[#EAF2EE] px-2 py-0.5 rounded-full inline-block">
                      {faq.categoryLabel}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-neutral-900">
                      {faq.question}
                    </h3>
                  </div>

                  <div className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 shrink-0 mt-1">
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-[#1F3A30]' : ''
                      }`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-neutral-100 text-neutral-700 text-xs sm:text-sm leading-relaxed space-y-3 bg-[#FDFEFE]">
                    <p>{faq.answer}</p>

                    {faq.tips && faq.tips.length > 0 && (
                      <div className="bg-[#F8FAF9] rounded-xl p-3 border border-[#E3ECE8] space-y-1.5">
                        <div className="text-[11px] font-bold text-[#1F3A30] uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#4E8773]" />
                          <span>Advising Recommendations</span>
                        </div>
                        <ul className="space-y-1 text-xs text-neutral-600 pl-4 list-disc">
                          {faq.tips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {faq.actionLabel && faq.actionView && onNavigateToView && (
                      <div className="pt-2">
                        <button
                          onClick={() => onNavigateToView(faq.actionView!)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F3A30] hover:text-[#12231D] bg-[#EAF2EE] hover:bg-[#D7E8DF] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <span>{faq.actionLabel}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
