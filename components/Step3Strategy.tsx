import React, { useState, useRef, useEffect } from 'react';
import { StrategyData, SwotData, Step, StrategyCandidate } from '../types';
import { analyzeSwotToStrategy, generateAiSuggestions } from '../services/gemini';
import { Wand2, Loader2, Lightbulb, CheckCircle2, RotateCcw, X, Check, Copy, ArrowDownCircle, ArrowRight, FileText } from 'lucide-react';
import FileUploader from './FileUploader';
import ExportButtons from './ExportButtons';

interface Props {
  data: StrategyData;
  swotData: SwotData;
  diagnosisAnalysis: string;
  updateData: (data: StrategyData) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const Step3Strategy: React.FC<Props> = ({ data, swotData, diagnosisAnalysis, updateData, nextStep, prevStep }) => {
  const [loadingVision, setLoadingVision] = useState(false);
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  const candidatesRef = useRef<HTMLDivElement>(null);

  // Separate states for uploaded content strings
  const [uploadedDiagnosisText, setUploadedDiagnosisText] = useState<string>('');
  const [uploadedSwotText, setUploadedSwotText] = useState<string>('');

  // Auto-scroll to candidates when they are generated
  useEffect(() => {
    if (data.candidates && data.candidates.length > 0 && !loadingStrategy) {
      setTimeout(() => {
        candidatesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [data.candidates, loadingStrategy]);

  const handleReset = () => {
    if (confirm("이 단계의 데이터를 모두 초기화하시겠습니까?")) {
      updateData({
        mission: '',
        vision: '',
        strategies: { 
            environment: { strategy: '', tasks: ['', '', '', '', ''] },
            social: { strategy: '', tasks: ['', '', '', '', ''] },
            governance: { strategy: '', tasks: ['', '', '', '', ''] }
        },
        candidates: undefined
      });
      setUploadedDiagnosisText('');
      setUploadedSwotText('');
    }
  };

  const handleAiVision = async () => {
    if (!data.mission) return alert("미션을 먼저 입력하시면 더 좋은 비전을 제안해드릴 수 있습니다.");
    setLoadingVision(true);
    const result = await generateAiSuggestions(data.mission, 'VISION');
    updateData({ ...data, vision: result.replace(/"/g, '') });
    setLoadingVision(false);
  };

  const handleAiStrategy = async () => {
    if (!data.mission || !data.vision) {
        alert("AI 분석을 위해 미션과 비전을 먼저 입력해주세요.");
        return;
    }

    setLoadingStrategy(true);
    
    try {
        // Determine which context to use: Uploaded files take precedence over App state
        const effectiveDiagnosisAnalysis = uploadedDiagnosisText || diagnosisAnalysis;
        const effectiveSwotText = uploadedSwotText || ''; 

        // Call the updated service function that accepts all context including override text
        const result = await analyzeSwotToStrategy(
            swotData, 
            data.mission, 
            data.vision, 
            effectiveDiagnosisAnalysis, 
            effectiveSwotText
        );
        
        if (result && result.candidates && Array.isArray(result.candidates)) {
            // Automatically save candidates to state to display them
            updateData({
                ...data,
                candidates: result.candidates
            });
            // Scroll handled by useEffect
            alert("3가지 버전의 전략이 생성되었습니다. 하단의 생성 결과를 확인하세요.");
        } else {
            alert("전략 도출에 실패했습니다. (AI 응답 오류)");
        }
    } catch (error) {
        console.error("Strategy Generation Failed:", error);
        alert("전략 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
        setLoadingStrategy(false);
    }
  };

  const applyCandidate = (candidate: StrategyCandidate, e?: React.MouseEvent) => {
      // Prevent any default button behavior
      if (e) {
          e.preventDefault();
          e.stopPropagation();
      }

      if (!candidate) return;

      if (window.confirm(`[${candidate.versionName || '선택한 전략'}] 내용을 적용하시겠습니까?\n※ 상단 'ESG 분야별 추진 전략 및 과제 (최종)' 입력란의 기존 내용은 삭제되고 선택한 내용으로 대체됩니다.`)) {
          try {
              // Helper to clean common list artifacts from AI text
              const cleanVal = (val: any): string => {
                  if (typeof val !== 'string') return '';
                  return val
                    .replace(/^[\d]+\.\s*/, '') // Remove "1. "
                    .replace(/^-\s*/, '')      // Remove "- "
                    .replace(/^•\s*/, '')      // Remove "• "
                    .replace(/^\*\*/, '')      // Remove "**" prefix
                    .replace(/\*\*$/, '')      // Remove "**" suffix
                    .replace(/^"|"$/g, '')     // Remove quotes
                    .trim();
              };

              // Helper to prepare tasks array (ensure exactly 5 strings)
              const prepareTasks = (tasks: any): string[] => {
                  let arr: string[] = [];
                  if (Array.isArray(tasks)) {
                      arr = tasks.map(cleanVal);
                  }
                  // Pad with empty strings
                  while (arr.length < 5) arr.push('');
                  return arr.slice(0, 5);
              };

              // Construct the new strategies object using DIRECT property access.
              // We rely on the structure { environment: { strategy, tasks }, ... } 
              // which matches the structure used to render the cards.
              const newStrategies = {
                  environment: { 
                      strategy: cleanVal(candidate.environment?.strategy), 
                      tasks: prepareTasks(candidate.environment?.tasks)
                  },
                  social: { 
                      strategy: cleanVal(candidate.social?.strategy), 
                      tasks: prepareTasks(candidate.social?.tasks)
                  },
                  governance: { 
                      strategy: cleanVal(candidate.governance?.strategy), 
                      tasks: prepareTasks(candidate.governance?.tasks)
                  }
              };

              console.log("Applying Strategies (Data):", newStrategies);

              // Update state
              // IMPORTANT: We spread `data` to keep other fields (mission, vision, candidates)
              // and overwrite `strategies` with the new object.
              updateData({
                  ...data,
                  strategies: newStrategies
              });
              
              // Visual Feedback
              setTimeout(() => {
                  const target = document.getElementById('esg-strategy-content');
                  if (target) {
                      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      target.animate([
                          { backgroundColor: 'rgba(99, 102, 241, 0.2)' },
                          { backgroundColor: 'transparent' }
                      ], { duration: 1000, easing: 'ease-out' });
                  }
              }, 100);

          } catch (error) {
              console.error("Failed to apply candidate:", error);
              alert("전략 적용 중 오류가 발생했습니다.");
          }
      }
  };

  const handleDiagnosisFileParsed = (parsedData: any) => {
    if (parsedData && parsedData.text) {
        setUploadedDiagnosisText(parsedData.text);
        alert("자체진단 결과(제언) 파일 내용이 등록되었습니다.");
    }
  };

  const handleSwotFileParsed = (parsedData: any) => {
    if (parsedData && parsedData.text) {
        setUploadedSwotText(parsedData.text);
        alert("SWOT 전략 매트릭스 파일 내용이 등록되었습니다.");
    }
  };

  // Handler for uploading the Strategy/Tasks CSV/PDF directly
  const handleStrategyInputFileParsed = (parsedData: any) => {
    if (parsedData && parsedData.strategies) {
        const cleanVal = (val: any) => typeof val === 'string' ? val.trim() : '';
        const ensureTasks = (tasks: any[]) => {
            const arr = Array.isArray(tasks) ? tasks.map(String) : [];
            while (arr.length < 5) arr.push('');
            return arr.slice(0, 5);
        };

        updateData({
            ...data,
            // Do not update mission/vision from file as per request
            strategies: {
                environment: {
                    strategy: cleanVal(parsedData.strategies.environment?.strategy),
                    tasks: ensureTasks(parsedData.strategies.environment?.tasks)
                },
                social: {
                    strategy: cleanVal(parsedData.strategies.social?.strategy),
                    tasks: ensureTasks(parsedData.strategies.social?.tasks)
                },
                governance: {
                    strategy: cleanVal(parsedData.strategies.governance?.strategy),
                    tasks: ensureTasks(parsedData.strategies.governance?.tasks)
                }
            }
        });
        alert("파일의 전략 및 과제 데이터가 적용되었습니다. (미션/비전 제외)");
        
        // Visual Feedback
        setTimeout(() => {
            document.getElementById('esg-strategy-content')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    } else {
        alert("올바른 전략 데이터 형식을 찾을 수 없습니다. 템플릿을 확인해주세요.");
    }
  };

  // Helper to update specific task in the MAIN input area
  const updateTask = (category: 'environment' | 'social' | 'governance', index: number, value: string) => {
      const newTasks = [...data.strategies[category].tasks];
      newTasks[index] = value;
      updateData({
          ...data,
          strategies: {
              ...data.strategies,
              [category]: { ...data.strategies[category], tasks: newTasks }
          }
      });
  };

  // Helper to update specific strategy in the MAIN input area
  const updateStrategyText = (category: 'environment' | 'social' | 'governance', value: string) => {
    updateData({
        ...data,
        strategies: {
            ...data.strategies,
            [category]: { ...data.strategies[category], strategy: value }
        }
    });
  };

  const renderCategoryColumn = (
      title: string, 
      category: 'environment' | 'social' | 'governance', 
      headerClass: string, 
      borderClass: string
  ) => (
    <div className={`flex-1 flex flex-col glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl ${borderClass} border-t-4`}>
        {/* Header */}
        <div className={`p-4 text-center font-bold text-white ${headerClass}`}>
            {title}
        </div>
        
        {/* Strategy Section */}
        <div className="p-5 border-b border-gray-100 bg-white/50">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">추진 전략</label>
            <textarea
                value={data.strategies[category].strategy || ''}
                onChange={(e) => updateStrategyText(category, e.target.value)}
                className="w-full h-24 text-sm glass-input rounded-xl p-3 outline-none resize-none placeholder-slate-400 font-medium text-slate-700 leading-relaxed"
                placeholder={`${title} 추진 전략 (매력적인 개조식 문장 1개)`}
            />
        </div>

        {/* Tasks Section */}
        <div className="p-5 flex-1 bg-white/30">
            <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">추진 과제 (5개)</label>
            <div className="space-y-3">
                {data.strategies[category].tasks.map((task, idx) => (
                    <div key={idx} className="flex gap-3 items-center group">
                        <span className="text-xs font-bold text-slate-400 w-4 text-center group-hover:text-slate-600 transition-colors">{idx + 1}.</span>
                        <input 
                            type="text"
                            value={task || ''}
                            onChange={(e) => updateTask(category, idx, e.target.value)}
                            className="flex-1 text-sm bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none py-1.5 placeholder-slate-300 transition-all text-slate-700"
                            placeholder="핵심 실천 과제 입력"
                        />
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 text-sm font-bold">3</span>
              ESG 운영체계 및 전략지도
            </h2>
            <p className="text-slate-500 mt-2 ml-11">미션·비전을 재정립하고, 진단 결과와 SWOT을 통합하여 핵심 전략을 수립합니다.</p>
        </div>
        <button 
           onClick={handleReset}
           className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-white rounded-full shadow-sm border border-slate-100 hover:shadow-md"
           title="이 단계 초기화"
        >
           <RotateCcw size={18} />
        </button>
      </div>

      {/* Uploaders */}
      <div className="glass-card p-6 rounded-2xl border border-indigo-100 bg-indigo-50/30">
         <h3 className="font-bold text-slate-700 mb-4 text-sm flex items-center gap-2">
            <FileText className="text-indigo-600" size={18} />
            참고자료 업로드 (통합 분석용)
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/60 p-4 rounded-xl border border-white shadow-sm">
                <p className="text-xs font-bold text-slate-500 mb-2">1. AI 진단 결과 분석 (Step 1)</p>
                <div className="flex items-center justify-between">
                    <FileUploader 
                        step={Step.STRATEGY} 
                        onDataParsed={handleDiagnosisFileParsed} 
                        customLabel={uploadedDiagnosisText ? "업로드 완료 (재등록)" : "진단결과 파일 선택"}
                        hideTemplate={true}
                        parseMode="TEXT_ONLY"
                    />
                    {uploadedDiagnosisText && <CheckCircle2 size={18} className="text-green-500 animate-pulse"/>}
                </div>
            </div>
            <div className="bg-white/60 p-4 rounded-xl border border-white shadow-sm">
                <p className="text-xs font-bold text-slate-500 mb-2">2. SWOT 전략 매트릭스 (Step 2)</p>
                <div className="flex items-center justify-between">
                    <FileUploader 
                        step={Step.STRATEGY} 
                        onDataParsed={handleSwotFileParsed} 
                        customLabel={uploadedSwotText ? "업로드 완료 (재등록)" : "SWOT결과 파일 선택"}
                        hideTemplate={true}
                        parseMode="TEXT_ONLY"
                    />
                    {uploadedSwotText && <CheckCircle2 size={18} className="text-green-500 animate-pulse"/>}
                </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Mission & Vision */}
        <div className="glass-card p-8 rounded-2xl space-y-6">
          <div className="relative">
            <label className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-indigo-600 border border-indigo-100 rounded-full shadow-sm">MISSION</label>
            <input
              type="text"
              value={data.mission}
              onChange={(e) => updateData({ ...data, mission: e.target.value })}
              placeholder="기관 미션 입력 (예: 장애주민이 꿈꾸는 길을 함께 걷는 파트너)"
              className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-center text-lg text-slate-700 transition-all placeholder-slate-300"
            />
          </div>
          
          <div className="relative">
            <label className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-purple-600 border border-purple-100 rounded-full shadow-sm z-10">VISION</label>
            <div className="absolute right-2 top-2 z-10">
                <button 
                    onClick={handleAiVision}
                    disabled={loadingVision}
                    className="text-xs flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 transition-colors disabled:opacity-50"
                >
                    {loadingVision ? <Loader2 className="animate-spin" size={12}/> : <Wand2 size={12}/>}
                    AI 추천
                </button>
            </div>
            <input
              type="text"
              value={data.vision}
              onChange={(e) => updateData({ ...data, vision: e.target.value })}
              placeholder="기관 비전 입력 (예: 지역사회와 함께하는 지속가능한 ESG 선도 복지관)"
              className="w-full p-5 rounded-xl border border-purple-200 bg-purple-50/30 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none font-extrabold text-center text-xl text-purple-900 transition-all placeholder-purple-200/70"
            />
          </div>
        </div>

        {/* Strategies Main Input Area */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-2 gap-4">
             <div>
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                    ESG 분야별 추진 전략 및 과제 (최종)
                </h3>
             </div>
             <div className="flex flex-wrap gap-2 items-center">
                 {/* Direct Strategy File Uploader */}
                 <div className="scale-90 origin-right mr-2">
                    <FileUploader 
                        step={Step.STRATEGY}
                        onDataParsed={handleStrategyInputFileParsed}
                        customLabel="파일 업로드 (CSV/PDF)"
                        hideTemplate={false} 
                        parseMode="DEFAULT" 
                    />
                 </div>
                <ExportButtons targetId="esg-strategy-content" fileName="ESG_Strategic_Directions" />
                <button 
                    onClick={handleAiStrategy}
                    disabled={loadingStrategy}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 text-sm font-bold active:scale-95"
                >
                    {loadingStrategy ? <Loader2 className="animate-spin" size={18}/> : <Lightbulb size={18}/>}
                    {loadingStrategy ? "AI 생성 중..." : "AI 전략 자동 생성"}
                </button>
             </div>
          </div>
          
          <div id="esg-strategy-content" className="flex flex-col md:flex-row gap-6 mb-8">
              {renderCategoryColumn("환경 (Environment)", "environment", "bg-emerald-500", "border-emerald-500")}
              {renderCategoryColumn("사회 (Social)", "social", "bg-blue-500", "border-blue-500")}
              {renderCategoryColumn("지배구조 (Governance)", "governance", "bg-orange-500", "border-orange-500")}
          </div>

          {/* AI Generated Candidates */}
          {data.candidates && data.candidates.length > 0 && (
             <div ref={candidatesRef} id="ai-strategy-candidates" className="mt-12 pt-10 border-t border-slate-200 animate-slide-up scroll-mt-24">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <Wand2 size={24}/>
                        </div>
                        <div>
                            <h4 className="font-bold text-xl text-slate-800">AI 생성 전략 후보 (3 Options)</h4>
                            <p className="text-sm text-slate-500">마음에 드는 버전을 선택하여 '적용하기'를 누르세요.</p>
                        </div>
                    </div>
                    <ExportButtons targetId="ai-strategy-candidates" fileName="AI_Strategy_Candidates" />
                 </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     {data.candidates.map((candidate, idx) => (
                         <div key={idx} className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 overflow-hidden flex flex-col">
                             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                             
                             <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                 <span className="font-bold text-slate-700">{candidate.versionName}</span>
                                 <button 
                                     type="button"
                                     onClick={(e) => applyCandidate(candidate, e)}
                                     className="relative z-10 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 transform active:scale-95 transition-all print:hidden cursor-pointer"
                                 >
                                     <ArrowDownCircle size={14}/> 적용하기
                                 </button>
                             </div>
                             
                             <div className="p-5 space-y-5 text-sm flex-1 text-slate-600">
                                 {/* Environment */}
                                 <div>
                                     <div className="font-bold text-emerald-600 mb-1.5 flex items-center gap-2">
                                         <span className="w-2 h-2 rounded-full bg-emerald-500"></span>환경 (E)
                                     </div>
                                     <p className="font-bold text-slate-800 mb-2 pl-4 border-l-2 border-emerald-200">"{candidate.environment?.strategy}"</p>
                                     <ul className="space-y-1 pl-4">
                                         {candidate.environment?.tasks.map((t, i) => (
                                             <li key={i} className="flex items-start gap-2 text-xs">
                                                 <span className="text-emerald-400 mt-0.5">•</span>{t}
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                                 {/* Social */}
                                 <div className="border-t border-slate-100 pt-4">
                                     <div className="font-bold text-blue-600 mb-1.5 flex items-center gap-2">
                                         <span className="w-2 h-2 rounded-full bg-blue-500"></span>사회 (S)
                                     </div>
                                     <p className="font-bold text-slate-800 mb-2 pl-4 border-l-2 border-blue-200">"{candidate.social?.strategy}"</p>
                                     <ul className="space-y-1 pl-4">
                                         {candidate.social?.tasks.map((t, i) => (
                                             <li key={i} className="flex items-start gap-2 text-xs">
                                                 <span className="text-blue-400 mt-0.5">•</span>{t}
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                                 {/* Governance */}
                                 <div className="border-t border-slate-100 pt-4">
                                     <div className="font-bold text-orange-600 mb-1.5 flex items-center gap-2">
                                         <span className="w-2 h-2 rounded-full bg-orange-500"></span>지배구조 (G)
                                     </div>
                                     <p className="font-bold text-slate-800 mb-2 pl-4 border-l-2 border-orange-200">"{candidate.governance?.strategy}"</p>
                                     <ul className="space-y-1 pl-4">
                                         {candidate.governance?.tasks.map((t, i) => (
                                             <li key={i} className="flex items-start gap-2 text-xs">
                                                 <span className="text-orange-400 mt-0.5">•</span>{t}
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-6 print:hidden border-t border-slate-200/60 mt-8">
        <button onClick={prevStep} className="flex items-center text-slate-500 hover:text-slate-800 px-6 py-2 transition-colors">
          <ArrowRight className="rotate-180 mr-2" size={16}/> 이전 단계
        </button>
        <button
          onClick={nextStep}
          className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
        >
          다음: 실천 아이디어 <ArrowRight className="ml-2" size={18}/>
        </button>
      </div>
    </div>
  );
};

export default Step3Strategy;