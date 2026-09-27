import React, { useState } from 'react';
import { AgencyState, FifaLicenseState } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { soundEngine } from '../utils/soundEffects';
import { 
  Award, 
  BadgeCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  BookOpen, 
  Sparkles, 
  X, 
  Scale, 
  Crown, 
  FileText,
  Lock,
  ChevronRight,
  TrendingUp,
  Percent
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FifaLicensingModalProps {
  agency: AgencyState;
  onClose: () => void;
  onUpdateAgency: (agency: AgencyState) => void;
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface ExamQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const EXAM_QUESTIONS_POOL: ExamQuestion[] = [
  {
    id: 1,
    question: 'Under the FIFA Football Agent Regulations (FFAR), what is the maximum legal commission cap for an agent representing a player on their individual player contract?',
    options: ['3% of player remuneration', '5% of player remuneration', '10% of player remuneration', '15% of player remuneration'],
    correctIndex: 1,
    explanation: 'Under FFAR Article 12, the standard commission cap for representing an individual player is 5% of annual remuneration (or 3% for salaries exceeding $200k/yr unless dual representation applies).'
  },
  {
    id: 2,
    question: 'According to FIFA Article 19 regarding the protection of minors, under which condition is an international transfer of an under-18 player strictly permitted?',
    options: [
      'If the player receives a lucrative sponsorship deal',
      'If the player\'s parents move to the new club\'s country for reasons not linked to football',
      'If the agent pays a solidarity guarantee fee',
      'If the player is ranked in the top 50 global wonderkids'
    ],
    correctIndex: 1,
    explanation: 'Article 19 permits minor international transfers only if parents relocate for non-football reasons, or within EU/EEA between ages 16-18 under strict educational standards.'
  },
  {
    id: 3,
    question: 'What is the FIFA Training Solidarity Contribution percentage distributed to previous youth training clubs upon an international transfer?',
    options: ['2.5% of transfer fee', '5% of total transfer fee', '10% of transfer fee', '12% of transfer fee'],
    correctIndex: 1,
    explanation: 'A 5% solidarity contribution is deducted from the transfer fee and distributed proportionally to all clubs that trained the player between ages 12 and 23.'
  },
  {
    id: 4,
    question: 'Under UEFA Financial Sustainability regulations, what is the maximum length over which a transfer fee amortisation can be spread for accounting purposes?',
    options: ['3 years', '5 years', '8 years', '10 years'],
    correctIndex: 1,
    explanation: 'UEFA closed the long-contract loophole by capping transfer fee amortisation at a maximum of 5 years, regardless of contract duration.'
  },
  {
    id: 5,
    question: 'Which of the following scenarios constitutes an illegal Conflict of Interest under FIFA Code of Ethics Article 19?',
    options: [
      'An agent negotiating a commercial boot deal with Nike',
      'An agent simultaneously owning equity in a buying club while representing the selling player without disclosure',
      'An agent hiring a licensed physical trainer for their client',
      'An agent arranging a media interview with a national newspaper'
    ],
    correctIndex: 1,
    explanation: 'Dual financial interests in club ownership and player agency representation without independent blind trust governance is a severe Article 19 ethics violation.'
  }
];

export const FifaLicensingModal: React.FC<FifaLicensingModalProps> = ({
  agency,
  onClose,
  onUpdateAgency,
  addToast
}) => {
  const currentLicense: FifaLicenseState = agency.fifaLicense || {
    tier: 'national',
    licenseNumber: 'FIFA-AGT-2026-8849',
    examPassed: true,
    examScore: 85,
    commissionCapPercent: 5,
    maxRepresentableValuation: 25000000,
    reputationMultiplier: 1.0
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'exam' | 'tiers'>('overview');
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examScore, setExamScore] = useState(0);

  // Tiers configuration
  const TIERS = [
    {
      id: 'grassroots',
      name: 'Grassroots Scout (Tier 1)',
      feeCap: '3% Legal Cap',
      valCap: '≤ €1,000,000',
      valCapNum: 1000000,
      feeCapNum: 3,
      examRequired: 'None (Automatic Starter)',
      repReq: 10,
      color: 'border-slate-700 bg-slate-900',
      badge: 'bg-slate-700 text-slate-200'
    },
    {
      id: 'national',
      name: 'National Licensed Agent (Tier 2)',
      feeCap: '5% Legal Cap',
      valCap: '≤ €25,000,000',
      valCapNum: 25000000,
      feeCapNum: 5,
      examRequired: 'National FIFA Compliance Exam (60%+)',
      repReq: 35,
      color: 'border-blue-500/50 bg-blue-950/30',
      badge: 'bg-blue-600 text-white'
    },
    {
      id: 'uefa',
      name: 'Continental UEFA Broker (Tier 3)',
      feeCap: '7% Legal Cap',
      valCap: '≤ €75,000,000',
      valCapNum: 75000000,
      feeCapNum: 7,
      examRequired: 'UEFA Continental Broker Exam (80%+)',
      repReq: 65,
      color: 'border-purple-500/50 bg-purple-950/30',
      badge: 'bg-purple-600 text-white'
    },
    {
      id: 'fifa_global',
      name: 'FIFA Global Super-Agent (Tier 4)',
      feeCap: '10% Maximum Cap',
      valCap: 'Unlimited (€100M+ World Records)',
      valCapNum: 999999999,
      feeCapNum: 10,
      examRequired: 'FIFA Global Master Exam (80%+)',
      repReq: 85,
      color: 'border-amber-500/60 bg-amber-950/40',
      badge: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black'
    }
  ];

  const handleStartExam = () => {
    setExamStarted(true);
    setExamSubmitted(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    if (agency.soundEnabled) soundEngine.playClickSound();
  };

  const handleSelectAnswer = (qIndex: number, optIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleSubmitExam = () => {
    let correctCount = 0;
    EXAM_QUESTIONS_POOL.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount += 1;
      }
    });

    const percentage = Math.round((correctCount / EXAM_QUESTIONS_POOL.length) * 100);
    setExamScore(percentage);
    setExamSubmitted(true);

    const passed = percentage >= 80;

    if (passed) {
      if (agency.soundEnabled) soundEngine.playCashSound();
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });

      let nextTier: 'grassroots' | 'national' | 'uefa' | 'fifa_global' = 'uefa';
      if (currentLicense.tier === 'national') nextTier = 'uefa';
      if (currentLicense.tier === 'uefa') nextTier = 'fifa_global';
      if (currentLicense.tier === 'grassroots') nextTier = 'national';

      const tierData = TIERS.find(t => t.id === nextTier) || TIERS[3];

      const updatedLicense: FifaLicenseState = {
        tier: nextTier,
        licenseNumber: `FIFA-AGT-${agency.currentSeason}-${Math.floor(1000 + Math.random() * 9000)}`,
        examPassed: true,
        examScore: percentage,
        lastExamWeek: agency.currentWeek,
        lastExamSeason: agency.currentSeason,
        commissionCapPercent: tierData.feeCapNum,
        maxRepresentableValuation: tierData.valCapNum,
        reputationMultiplier: 1.25
      };

      onUpdateAgency({
        ...agency,
        reputation: Math.min(100, agency.reputation + 8),
        fifaLicense: updatedLicense
      });

      if (addToast) {
        addToast(`🏆 FIFA EXAM PASSED (${percentage}%)! Promoted to ${tierData.name}!`, 'success');
      }
    } else {
      if (agency.soundEnabled) soundEngine.playWhistle();
      if (addToast) {
        addToast(`❌ Exam Failed (${percentage}%). 80% required to pass. Review regulations and retake.`, 'error');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-indigo-500/60 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative space-y-6 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border-2 border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow">
              <BadgeCheck className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-500/30">
                  Official FIFA Governance System
                </span>
                <span className="text-xs text-slate-400 font-bold">Licence #{currentLicense.licenseNumber}</span>
              </div>
              <h3 className="text-lg font-black text-white">FIFA Agent Licensing &amp; Commission Exam Center</h3>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          {[
            { id: 'overview', label: 'License Card & Status', icon: Award },
            { id: 'exam', label: 'Take FIFA Licensing Exam', icon: BookOpen },
            { id: 'tiers', label: '4-Tier Hierarchy & Caps', icon: Scale }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer min-h-[44px] ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & OFFICIAL CREDENTIALS CARD */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Digital License Credential */}
            <div className="bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-900 border-2 border-indigo-400/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Crown className="w-48 h-48 text-white" />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/30 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                    Federation Internationale de Football Association
                  </span>
                  <h4 className="text-2xl font-black text-white mt-0.5">FIFA Certified Football Agent</h4>
                  <p className="text-xs text-slate-400 font-bold">Holder: <strong className="text-amber-300">{agency.agentName}</strong> • {agency.agencyName}</p>
                </div>

                <div className="bg-slate-900/90 border border-indigo-500/40 p-3 rounded-2xl text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Current Certification Tier</p>
                  <p className="text-sm font-black text-amber-400 capitalize">{currentLicense.tier.replace('_', ' ')} Agent</p>
                </div>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Percent className="w-3 h-3 text-indigo-400" /> Max Legal Commission
                  </p>
                  <p className="text-base font-black text-emerald-400">{currentLicense.commissionCapPercent}% of Remuneration</p>
                  <p className="text-[10px] text-slate-500">Regulated under FFAR Art. 12</p>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-indigo-400" /> Representation Cap
                  </p>
                  <p className="text-base font-black text-amber-400">
                    {currentLicense.maxRepresentableValuation > 100000000 ? 'Unlimited / Superstars' : formatMoney(currentLicense.maxRepresentableValuation)}
                  </p>
                  <p className="text-[10px] text-slate-500">Max Player Market Valuation</p>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Exam Compliance
                  </p>
                  <p className="text-base font-black text-indigo-300">
                    {currentLicense.examPassed ? `Passed (${currentLicense.examScore || 85}%)` : 'Pending Exam'}
                  </p>
                  <p className="text-[10px] text-slate-500">Good Standing Status</p>
                </div>
              </div>
            </div>

            {/* Quick Exam CTA */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
              <div>
                <h5 className="text-xs font-black text-white">Upgrade to Higher Commission Tier?</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sit the 5-question FIFA regulatory compliance exam to unlock continental and global super-agent representation privileges.
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveTab('exam');
                  handleStartExam();
                }}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs cursor-pointer transition shadow-lg shrink-0"
              >
                Sit FIFA Exam Now
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE FIFA REGULATORY COMPLIANCE EXAM */}
        {activeTab === 'exam' && (
          <div className="space-y-5">
            {!examStarted ? (
              <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-400/40 mx-auto flex items-center justify-center text-indigo-300">
                  <BookOpen className="w-8 h-8 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Official FIFA Football Agent Examination</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    5 multiple-choice questions testing your knowledge of transfer amortisation, minors protection (Art. 19), solidarity contributions, and dual-representation ethics.
                  </p>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-xl max-w-sm mx-auto text-xs text-slate-300 space-y-1 text-left border border-slate-800">
                  <p className="font-bold text-indigo-300">📋 Exam Guidelines:</p>
                  <p>• Total Questions: 5</p>
                  <p>• Pass Requirement: 80% (4 of 5 correct)</p>
                  <p>• Reward: Direct Tier Promotion &amp; Increased Commission Rates</p>
                </div>

                <button
                  onClick={handleStartExam}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-6 py-3 rounded-xl text-xs cursor-pointer transition shadow-lg"
                >
                  Begin Official Exam
                </button>
              </div>
            ) : !examSubmitted ? (
              <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-black text-indigo-300">
                    Question {currentQuestionIndex + 1} of {EXAM_QUESTIONS_POOL.length}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {Object.keys(selectedAnswers).length} / {EXAM_QUESTIONS_POOL.length} Answered
                  </span>
                </div>

                {/* Current Question */}
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-white leading-relaxed">
                    {EXAM_QUESTIONS_POOL[currentQuestionIndex].question}
                  </h4>

                  {/* Options */}
                  <div className="space-y-2 pt-2">
                    {EXAM_QUESTIONS_POOL[currentQuestionIndex].options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectAnswer(currentQuestionIndex, optIdx)}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white'
                          }`}
                        >
                          <span>{opt}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(i => i - 1)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous Question
                  </button>

                  {currentQuestionIndex < EXAM_QUESTIONS_POOL.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex(i => i + 1)}
                      className="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow"
                    >
                      Next Question
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitExam}
                      className="px-6 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 cursor-pointer shadow-lg"
                    >
                      Submit Exam for Evaluation
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Exam Result View */
              <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl text-center space-y-4">
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg">
                  {examScore >= 80 ? (
                    <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                  ) : (
                    <XCircle className="w-16 h-16 text-red-400" />
                  )}
                </div>

                <div>
                  <h4 className="text-xl font-black text-white">
                    {examScore >= 80 ? '🎉 CONGRATULATIONS! EXAM PASSED!' : '❌ EXAM NOT PASSED'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Your Official Score: <strong className={examScore >= 80 ? 'text-emerald-400' : 'text-red-400'}>{examScore}%</strong> (80% minimum passing requirement)
                  </p>
                </div>

                {/* Explanation Review */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left space-y-2 text-xs max-h-48 overflow-y-auto">
                  <p className="font-bold text-indigo-300">Regulatory Review Explanations:</p>
                  {EXAM_QUESTIONS_POOL.map((q, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <p className="font-bold text-slate-200">Q{idx + 1}: {q.question}</p>
                      <p className="text-emerald-400 text-[11px]">✓ Correct Answer: {q.options[q.correctIndex]}</p>
                      <p className="text-slate-400 text-[10px]">{q.explanation}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={handleStartExam}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  >
                    Retake Practice Exam
                  </button>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow"
                  >
                    View Updated Credentials
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: 4-TIER HIERARCHY & COMMISSIONS */}
        {activeTab === 'tiers' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {TIERS.map(tier => {
                const isCurrent = currentLicense.tier === tier.id;
                return (
                  <div
                    key={tier.id}
                    className={`border-2 rounded-2xl p-4 space-y-3 transition ${
                      isCurrent ? 'border-amber-500/80 bg-amber-950/30 shadow-lg' : tier.color
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${tier.badge}`}>
                        {tier.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded">
                          ACTIVE TIER
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-300 space-y-1.5 pt-1">
                      <p>Commission Cap: <strong className="text-emerald-400">{tier.feeCap}</strong></p>
                      <p>Player Market Cap: <strong className="text-amber-400">{tier.valCap}</strong></p>
                      <p className="text-[11px] text-slate-400">Prerequisite: {tier.examRequired}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
