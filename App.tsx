import React, { useState } from 'react';
import { INITIAL_DATA, Step, WorkshopData } from './types';
import Step1Diagnosis from './components/Step1Diagnosis';
import Step2SWOT from './components/Step2SWOT';
import Step3Strategy from './components/Step3Strategy';
import StepActionIdeas from './components/StepActionIdeas';
import Step4Roadmap from './components/Step4Roadmap';
import Step5Report from './components/Step5Report';
import { LayoutDashboard, Target, TrendingUp, Calendar, FileText, Lightbulb, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.DIAGNOSIS);
  const [workshopData, setWorkshopData] = useState<WorkshopData>(INITIAL_DATA);

  // Navigation handlers
  const nextStep = () => {
    const steps = Object.values(Step);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    const steps = Object.values(Step);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
      window.scrollTo(0, 0);
    }
  };

  // State update handlers
  const updateData = (newData: Partial<WorkshopData>) => {
    setWorkshopData(prev => ({ ...prev, ...newData }));
  };

  const stepsInfo = [
    { id: Step.DIAGNOSIS, title: '자체진단', icon: LayoutDashboard },
    { id: Step.SWOT, title: 'SWOT', icon: Target },
    { id: Step.STRATEGY, title: '전략수립', icon: TrendingUp },
    { id: Step.ACTION_IDEAS, title: '아이디어', icon: Lightbulb },
    { id: Step.ROADMAP, title: '로드맵', icon: Calendar },
    { id: Step.REPORT, title: '결과보고', icon: FileText },
  ];

  return (
    <div className="min-h-screen font-sans text-slate-800 pb-20">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-blue-50 opacity-80 pointer-events-none"></div>

      {/* Glass Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/20 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold p-1.5 rounded-lg shadow-md shadow-indigo-500/30">
              ESG
            </div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">경영 워크숍 지원 플랫폼</h1>
          </div>
          <div className="flex items-center gap-4">
             <input 
               type="text" 
               placeholder="기관명/모둠명 입력" 
               className="glass-input bg-white/50 border border-slate-200 rounded-full px-4 py-1.5 text-sm outline-none w-48 transition-all focus:w-64 placeholder-slate-400"
               value={workshopData.teamName}
               onChange={(e) => updateData({ teamName: e.target.value })}
             />
          </div>
        </div>
      </header>

      {/* Floating Progress Bar */}
      <div className="max-w-6xl mx-auto px-4 mt-6 mb-8">
        <div className="glass-card rounded-2xl p-2 shadow-lg shadow-slate-200/50">
          <div className="flex justify-between items-center overflow-x-auto px-2 py-1 scrollbar-hide">
            {stepsInfo.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = Object.values(Step).indexOf(currentStep) > idx;
              
              return (
                <div key={step.id} className="flex items-center flex-1 min-w-max">
                  <div 
                    onClick={() => {
                        // Optional: Allow clicking to navigate if completed
                        if (isCompleted || isActive) {
                            setCurrentStep(step.id);
                            window.scrollTo(0, 0);
                        }
                    }}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer
                      ${isActive 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                        : isCompleted 
                          ? 'text-indigo-600 hover:bg-indigo-50' 
                          : 'text-slate-400 hover:text-slate-600'
                      }
                    `}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    <span className={`text-sm font-semibold ${isActive ? '' : 'hidden md:inline-block'}`}>
                      {step.title}
                    </span>
                  </div>
                  
                  {idx < stepsInfo.length - 1 && (
                    <div className="flex-1 h-px bg-slate-200 mx-2 min-w-[20px]">
                      <div 
                        className="h-full bg-indigo-200 transition-all duration-500" 
                        style={{ width: isCompleted ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4">
        <div className="glass-card rounded-3xl p-6 md:p-10 shadow-xl shadow-slate-200/60 min-h-[600px] border border-white/60">
            {currentStep === Step.DIAGNOSIS && (
              <Step1Diagnosis 
                data={workshopData.diagnosis}
                workshopData={workshopData}
                updateData={(d) => updateData({ diagnosis: d })}
                updateAnalysis={(analysis) => updateData({ diagnosisAnalysis: analysis })}
                nextStep={nextStep} 
              />
            )}
            {currentStep === Step.SWOT && (
              <Step2SWOT 
                data={workshopData.swot} 
                updateData={(d) => updateData({ swot: d })} 
                nextStep={nextStep} 
                prevStep={prevStep}
                teamName={workshopData.teamName}
                diagnosisAnalysis={workshopData.diagnosisAnalysis}
              />
            )}
            {currentStep === Step.STRATEGY && (
              <Step3Strategy 
                data={workshopData.strategy}
                swotData={workshopData.swot}
                diagnosisAnalysis={workshopData.diagnosisAnalysis}
                updateData={(d) => updateData({ strategy: d })}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )}
            {currentStep === Step.ACTION_IDEAS && (
              <StepActionIdeas 
                data={workshopData.actionIdeas}
                updateData={(d) => updateData({ actionIdeas: d })}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )}
            {currentStep === Step.ROADMAP && (
              <Step4Roadmap 
                data={workshopData.roadmap} 
                roadmapGoals={workshopData.roadmapGoals}
                updateData={(d) => updateData({ roadmap: d })} 
                updateWorkshopData={updateData}
                nextStep={nextStep} 
                prevStep={prevStep}
              />
            )}
            {currentStep === Step.REPORT && (
              <Step5Report 
                data={workshopData}
                prevStep={prevStep}
              />
            )}
        </div>
      </main>
      
      <footer className="py-8 mt-8 text-center">
        <p className="text-slate-400 text-sm font-medium">
          &copy; {new Date().getFullYear()} ESG Strategy Workshop Platform.
        </p>
      </footer>
    </div>
  );
};

export default App;