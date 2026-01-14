
import React, { useState, useEffect } from 'react';
import { AppStep, ProbingQuestion, ClaritySynthesis } from './types';
import { getNextQuestion, synthesizeClarity, generateMindMapImage } from './services/geminiService';
import MindMapVisualization from './components/MindMapVisualization';

const MIN_QUESTIONS = 20;
const MAX_QUESTIONS = 30;

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.INITIAL_INPUT);
  const [situation, setSituation] = useState('');
  const [questions, setQuestions] = useState<ProbingQuestion[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isAiClear, setIsAiClear] = useState(false);
  const [loading, setLoading] = useState(false);
  const [synthesis, setSynthesis] = useState<ClaritySynthesis | null>(null);
  const [processingMessage, setProcessingMessage] = useState('Generating Perspective...');

  const startProbing = async () => {
    if (!situation.trim()) return;
    setLoading(true);
    try {
      const first = await getNextQuestion(situation, []);
      setQuestions([{ id: 0, question: first.question, answer: '' }]);
      setIsAiClear(first.isClear);
      setStep(AppStep.PROBING);
    } catch (error) {
      console.error(error);
      alert("Cloud connection failed. Please check your internet.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAnswer.trim() || loading) return;

    setLoading(true);
    const updatedQuestions = [...questions];
    updatedQuestions[updatedQuestions.length - 1].answer = currentAnswer;
    setQuestions(updatedQuestions);
    setCurrentAnswer('');

    if (updatedQuestions.length >= MAX_QUESTIONS) {
      processSynthesis(updatedQuestions);
    } else {
      try {
        const next = await getNextQuestion(situation, updatedQuestions);
        const shouldProceedToSynthesis = updatedQuestions.length >= MIN_QUESTIONS && next.isClear;

        if (shouldProceedToSynthesis) {
          processSynthesis(updatedQuestions);
        } else {
          setQuestions([...updatedQuestions, { 
            id: updatedQuestions.length, 
            question: next.question, 
            answer: '' 
          }]);
          setIsAiClear(next.isClear);
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
        alert("The investigation was interrupted. Retrying last question...");
        setLoading(false);
      }
    }
  };

  const processSynthesis = async (finalQuestions: ProbingQuestion[]) => {
    setLoading(true);
    setStep(AppStep.PROCESSING);
    
    const messages = [
      "Aggregating response patterns...",
      "Mapping cognitive biases...",
      "Simulating objective viewpoints...",
      "Constructing situational model...",
      "This can take a moment for 20+ points of analysis..."
    ];
    let msgIdx = 0;
    const interval = setInterval(() => {
      setProcessingMessage(messages[msgIdx % messages.length]);
      msgIdx++;
    }, 4000);

    try {
      // Step 1: Text Synthesis (Crucial)
      const result = await synthesizeClarity(situation, finalQuestions);
      setSynthesis(result);
      setStep(AppStep.RESULT);
      
      // Step 2: Background Image Generation (Non-blocking)
      generateMindMapImage(situation, result.birdsEyeView).then(imgUrl => {
        if (imgUrl) {
          setSynthesis(prev => prev ? { ...prev, mindMapImageUrl: imgUrl } : null);
        }
      });

    } catch (error) {
      console.error(error);
      alert("Synthesis failed. The conversation was too complex for a single generation. Try again with shorter answers.");
      setStep(AppStep.INITIAL_INPUT);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(AppStep.INITIAL_INPUT);
    setSituation('');
    setQuestions([]);
    setCurrentAnswer('');
    setIsAiClear(false);
    setSynthesis(null);
  };

  const totalProgressPercent = (questions.length / MAX_QUESTIONS) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 md:p-8 max-w-5xl mx-auto bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-12">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
            <i className="fa-solid fa-brain"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">ZenClarity</h1>
        </div>
        {step !== AppStep.INITIAL_INPUT && (
          <button 
            onClick={reset}
            className="text-slate-400 hover:text-slate-100 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <i className="fa-solid fa-rotate-left"></i> Start Over
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="w-full flex-grow flex flex-col">
        
        {step === AppStep.INITIAL_INPUT && (
          <div className="max-w-2xl w-full mx-auto animate-fadeIn">
            <h2 className="text-3xl font-bold text-slate-100 mb-4 text-center">Intensive Situational Deep-Dive</h2>
            <p className="text-slate-400 text-center mb-8">
              A commitment to {MIN_QUESTIONS} to {MAX_QUESTIONS} sequential questions. Total clarity requires deep reflection.
            </p>
            <div className="bg-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-800">
              <textarea
                className="w-full min-h-[150px] p-4 text-lg text-slate-100 bg-slate-800 rounded-xl border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-900/50 outline-none transition-all resize-none"
                placeholder="What is the complex situation you want to untangle? Be as raw and detailed as possible..."
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
              />
              <button
                disabled={loading || !situation.trim()}
                onClick={startProbing}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <>Initiate Deep Inquiry <i className="fa-solid fa-arrow-right"></i></>}
              </button>
            </div>
          </div>
        )}

        {step === AppStep.PROBING && questions.length > 0 && (
          <div className="max-w-2xl w-full mx-auto animate-fadeIn">
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <span className="text-blue-400 font-bold text-sm uppercase tracking-wider">Inquiry Phase</span>
                  <p className="text-xs text-slate-500">Milestone: {MIN_QUESTIONS} Qs | Hard Limit: {MAX_QUESTIONS} Qs</p>
                </div>
                <span className="text-slate-300 text-sm font-medium">Step {questions.length}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-700 ease-in-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                  style={{ width: `${totalProgressPercent}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-800 relative overflow-hidden">
               {loading && (
                 <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] flex items-center justify-center z-10">
                   <div className="flex flex-col items-center gap-2">
                     <i className="fa-solid fa-circle-notch fa-spin text-blue-500 text-3xl"></i>
                     <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Listening...</span>
                   </div>
                 </div>
               )}
              <h3 className="text-xl font-semibold text-slate-100 mb-6 min-h-[60px] leading-relaxed">
                {questions[questions.length - 1].question}
              </h3>
              <form onSubmit={handleAnswerSubmit}>
                <textarea
                  autoFocus
                  className="w-full min-h-[140px] p-4 text-slate-100 bg-slate-800 rounded-xl border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-900/50 outline-none transition-all resize-none mb-6"
                  placeholder="Reflect and answer..."
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !currentAnswer.trim()}
                  className="w-full bg-slate-100 hover:bg-white text-slate-950 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                  Confirm Reflection <i className="fa-solid fa-chevron-right text-xs"></i>
                </button>
              </form>
            </div>
          </div>
        )}

        {step === AppStep.PROCESSING && (
          <div className="flex flex-col items-center justify-center flex-grow py-20 text-center">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-blue-400">
                <i className="fa-solid fa-microchip text-2xl animate-pulse"></i>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">{processingMessage}</h2>
            <p className="text-slate-400 max-w-sm mx-auto">
              Aggregating all {questions.length} responses for a master situational synthesis.
            </p>
          </div>
        )}

        {step === AppStep.RESULT && synthesis && (
          <div className="w-full animate-fadeIn grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-8">
                <div className="flex items-center gap-3 mb-4">
                  <i className="fa-solid fa-satellite text-blue-400 text-xl"></i>
                  <h3 className="text-xl font-bold text-slate-100 uppercase tracking-tighter">Objective Synthesis</h3>
                </div>
                <div className="text-slate-300 leading-relaxed text-lg italic bg-slate-800/50 p-6 rounded-xl border-l-4 border-blue-500 space-y-4">
                  {synthesis.birdsEyeView.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
                </div>
                <div className="mt-8 pt-6 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Core Conflict Architecture</h4>
                  <p className="text-slate-200 font-semibold text-xl">{synthesis.coreConflict}</p>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <i className="fa-solid fa-project-diagram text-blue-400 text-xl"></i>
                    <h3 className="text-xl font-bold text-slate-100">Situational Cartography</h3>
                  </div>
                  {!synthesis.mindMapImageUrl && (
                     <div className="flex items-center gap-2 text-xs text-blue-400 animate-pulse">
                        <i className="fa-solid fa-spinner fa-spin"></i> Rendering Image...
                     </div>
                  )}
                </div>
                <MindMapVisualization 
                  data={synthesis.mindMap} 
                  imageUrl={synthesis.mindMapImageUrl} 
                />
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="bg-blue-900/10 rounded-2xl p-6 border border-blue-900/30">
                  <h4 className="text-blue-400 font-bold mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
                    <i className="fa-solid fa-sparkles"></i> Derived Insights
                  </h4>
                  <ul className="space-y-4">
                    {synthesis.keyInsights.map((insight, i) => (
                      <li key={i} className="flex gap-3 text-slate-300 text-sm leading-relaxed">
                        <span className="font-bold text-blue-500">0{i+1}</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="bg-emerald-900/10 rounded-2xl p-6 border border-emerald-900/30">
                  <h4 className="text-emerald-400 font-bold mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
                    <i className="fa-solid fa-route"></i> Action Trajectory
                  </h4>
                  <ul className="space-y-4">
                    {synthesis.actionableSteps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-slate-300 text-sm leading-relaxed">
                        <span className="flex-shrink-0 w-6 h-6 bg-emerald-900 text-emerald-400 rounded-lg flex items-center justify-center text-[10px] font-black border border-emerald-800">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white text-slate-950 rounded-2xl p-6 shadow-2xl">
                <h4 className="font-black text-xl mb-2 tracking-tighter uppercase">Investigation Report</h4>
                <p className="text-slate-600 text-sm mb-6 leading-tight">
                  Validated against {questions.length} unique data points. Analysis complete.
                </p>
                <div className="space-y-3">
                  <button onClick={() => window.print()} className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-950 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm border border-slate-300">
                    <i className="fa-solid fa-download"></i> Save Clarity
                  </button>
                  <button onClick={reset} className="w-full py-4 bg-slate-950 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm">
                    Analyze Again
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                <h5 className="font-bold text-slate-500 text-xs mb-4 uppercase tracking-widest">Data Record</h5>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {questions.map((q, i) => (
                    <div key={i} className="border-l-2 border-slate-800 pl-3 py-1 hover:border-blue-500 transition-colors">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Point {i + 1}</p>
                      <p className="text-xs text-slate-400 italic font-light leading-relaxed">"{q.answer}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full mt-12 pt-8 border-t border-slate-800 text-center text-slate-600 text-[10px] uppercase tracking-[0.2em]">
        ZenClarity &bull; {new Date().getFullYear()} &bull; Systematic Perspective Engine
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
