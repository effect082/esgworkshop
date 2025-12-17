import React, { useState } from 'react';
import { RoadmapItem, RoadmapGoal, Step, ROADMAP_PHASES, WorkshopData } from '../types';
import { Plus, X, RotateCcw, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import FileUploader from './FileUploader';
import ExportButtons from './ExportButtons';
import { generateRoadmap } from '../services/gemini';

interface Props {
  data: RoadmapItem[];
  updateData: (data: RoadmapItem[]) => void;
  // We need to update the parent's workshop data to store goals
  updateWorkshopData: (data: Partial<WorkshopData>) => void;
  roadmapGoals: RoadmapGoal[];
  nextStep: () => void;
  prevStep: () => void;
}

const Step4Roadmap: React.FC<Props> = ({ data, updateData, updateWorkshopData, roadmapGoals, nextStep, prevStep }) => {
  const [strategyText, setStrategyText] = useState('');
  const [swotText, setSwotText] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleReset = () => {
    if (confirm("이 단계의 데이터를 모두 초기화하시겠습니까?")) {
      updateData([]);
      updateWorkshopData({ roadmapGoals: [] });
      setStrategyText('');
      setSwotText('');
    }
  };

  const handleAiGenerate = async () => {
      if (!strategyText && !swotText) {
          alert("정확한 분석을 위해 '추진 전략' 또는 'SWOT 분석' 파일을 최소 하나 이상 업로드해주세요.");
          return;
      }
      
      setGenerating(true);
      try {
          const result = await generateRoadmap(strategyText, swotText);
          if (Array.isArray(result)) {
              const newGoals: RoadmapGoal[] = [];
              const newTasks: RoadmapItem[] = [];

              result.forEach((item: any) => {
                  // Push Goal
                  newGoals.push({
                      category: item.category,
                      year: item.year,
                      goal: item.goal
                  });
                  // Push Tasks
                  if (Array.isArray(item.tasks)) {
                      item.tasks.forEach((t: string) => {
                          newTasks.push({
                              id: Date.now().toString() + Math.random(),
                              category: item.category,
                              year: item.year,
                              task: t
                          });
                      });
                  }
              });

              updateWorkshopData({ roadmapGoals: newGoals });
              updateData(newTasks);
              alert("통합 분석을 통해 '추진 목표'와 '세부 실천과제'가 자동 생성되었습니다.");
          } else {
              alert("분석 결과 생성에 실패했습니다.");
          }
      } catch (e) {
          console.error(e);
          alert("오류가 발생했습니다.");
      } finally {
          setGenerating(false);
      }
  };

  const addTask = (category: 'E' | 'S' | 'G', year: RoadmapItem['year']) => {
    const newTask: RoadmapItem = {
      id: Date.now().toString(),
      category,
      task: '',
      year
    };
    updateData([...data, newTask]);
  };

  const updateTask = (id: string, text: string) => {
    updateData(data.map(t => t.id === id ? { ...t, task: text } : t));
  };

  const removeTask = (id: string) => {
    updateData(data.filter(t => t.id !== id));
  };
  
  const updateGoal = (category: 'E'|'S'|'G', year: string, text: string) => {
      const existingIndex = roadmapGoals.findIndex(g => g.category === category && g.year === year);
      const newGoals = [...roadmapGoals];
      if (existingIndex > -1) {
          newGoals[existingIndex].goal = text;
      } else {
          newGoals.push({ category, year, goal: text });
      }
      updateWorkshopData({ roadmapGoals: newGoals });
  };

  // Callback for file parsers
  const handleStrategyFileParsed = (parsed: any) => {
      if (parsed?.text) {
          setStrategyText(parsed.text);
          alert("추진 전략 파일 내용이 분석 준비되었습니다.");
      }
  };
  const handleSwotFileParsed = (parsed: any) => {
      if (parsed?.text) {
          setSwotText(parsed.text);
          alert("SWOT 분석 파일 내용이 분석 준비되었습니다.");
      }
  };

  const renderCell = (category: 'E' | 'S' | 'G', year: RoadmapItem['year']) => {
    const tasks = data.filter(t => t.category === category && t.year === year);
    const goal = roadmapGoals.find(g => g.category === category && g.year === year)?.goal || '';

    return (
      <div className="border border-gray-200 p-2 min-h-[200px] bg-white relative group hover:bg-gray-50 transition-colors flex flex-col">
        {/* Goal Section */}
        <div className="mb-3 pb-2 border-b border-gray-100 border-dashed">
            <label className="text-[10px] font-bold text-gray-500 block mb-1">추진 목표</label>
            <textarea
                value={goal}
                onChange={(e) => updateGoal(category, year, e.target.value)}
                className="w-full text-xs font-bold bg-blue-50/50 border border-blue-100 rounded p-1.5 focus:border-blue-400 outline-none resize-none text-blue-800"
                placeholder="핵심 목표 입력"
                rows={2}
            />
        </div>

        {/* Tasks Section */}
        <div className="flex-1 space-y-2 relative">
             <label className="text-[10px] font-bold text-gray-400 block mb-1">세부 실천과제</label>
             <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity print:hidden z-10">
                <button onClick={() => addTask(category, year)} className="bg-blue-100 text-blue-600 rounded-full p-1 hover:bg-blue-200" title="과제 추가">
                    <Plus size={14} />
                </button>
            </div>
            {tasks.map(task => (
                <div key={task.id} className="flex items-start gap-1">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    category === 'E' ? 'bg-green-500' : category === 'S' ? 'bg-blue-500' : 'bg-orange-500'
                }`}></span>
                <div className="flex-1 relative">
                    <textarea
                        value={task.task}
                        onChange={(e) => updateTask(task.id, e.target.value)}
                        className="w-full text-xs bg-transparent border-b border-transparent focus:border-gray-300 outline-none resize-none overflow-hidden leading-relaxed"
                        placeholder="- 과제 입력"
                        rows={2}
                    />
                    <button onClick={() => removeTask(task.id)} className="absolute -right-1 -top-1 text-gray-300 hover:text-red-500 print:hidden opacity-0 group-hover:opacity-100">
                        <X size={12} />
                    </button>
                </div>
                </div>
            ))}
            {tasks.length === 0 && <span className="text-gray-300 text-[10px] italic p-1 print:hidden">과제 추가 +</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded mr-3">STEP 5</span>
            ESG 경영 중장기 추진 일정 (Roadmap)
            </h2>
            <p className="text-sm text-gray-600 mt-1">분석된 전략과 SWOT 결과를 바탕으로 연차별 추진 목표와 세부 실천과제를 수립합니다.</p>
        </div>
        <div className="flex items-center gap-2">
            <button 
               onClick={handleReset}
               className="text-gray-400 hover:text-red-500 transition-colors p-2"
               title="이 단계 초기화 (새로고침)"
            >
               <RotateCcw size={20} />
            </button>
            <ExportButtons targetId="step5-content" fileName="ESG_Roadmap" />
        </div>
      </div>

      <div id="step5-content">
        {/* Upload & Auto-Gen Section */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-purple-600"/>
                전문 분석 기반 로드맵 자동 생성
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-3">
                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                        <p className="text-xs text-gray-500 mb-2 font-bold">1. ESG 분야별 추진 전략 및 과제 파일 (Step 3)</p>
                        <FileUploader 
                            step={Step.STRATEGY} 
                            onDataParsed={handleStrategyFileParsed}
                            customLabel="전략 결과 파일 업로드"
                            hideTemplate={true}
                            parseMode="TEXT_ONLY"
                        />
                        {strategyText && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 size={10}/> 파일 내용 확인됨</p>}
                    </div>
                </div>
                <div className="flex-1 space-y-3">
                     <div className="bg-gray-50 p-3 rounded border border-gray-100">
                        <p className="text-xs text-gray-500 mb-2 font-bold">2. SWOT 전략 매트릭스 분석결과 파일 (Step 2)</p>
                        <FileUploader 
                            step={Step.SWOT} 
                            onDataParsed={handleSwotFileParsed}
                            customLabel="SWOT 결과 파일 업로드"
                            hideTemplate={true}
                            parseMode="TEXT_ONLY"
                        />
                        {swotText && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 size={10}/> 파일 내용 확인됨</p>}
                    </div>
                </div>
                <div className="flex items-end">
                    <button 
                        onClick={handleAiGenerate}
                        disabled={generating}
                        className="h-[88px] w-full md:w-48 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 text-sm"
                    >
                        {generating ? <Loader2 className="animate-spin" size={24}/> : <Sparkles size={24}/>}
                        {generating ? "분석 및 생성 중..." : "추진 목표 및 과제 자동 생성"}
                    </button>
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
                ※ 두 개의 결과 파일을 모두 업로드하면, AI가 이를 통합 분석하여 연차별 최적의 목표와 실행 과제를 제안합니다.
            </p>
        </div>

        <div className="overflow-x-auto">
            <div className="min-w-[800px]">
            <div className="grid grid-cols-4 gap-0 border-l border-t border-gray-300">
                {/* Header */}
                <div className="bg-gray-100 p-3 font-bold text-center border-r border-b border-gray-300 text-gray-700 flex items-center justify-center">구분</div>
                {ROADMAP_PHASES.map((phase, idx) => (
                    <div key={idx} className="bg-blue-50 p-3 font-bold text-center border-r border-b border-gray-300 text-blue-800 flex items-center justify-center">
                        {phase}
                    </div>
                ))}

                {/* Environment Row */}
                <div className="bg-green-50 p-4 font-bold border-r border-b border-gray-300 flex items-center justify-center text-green-800">환경 (E)</div>
                {ROADMAP_PHASES.map((phase, idx) => (
                    <div key={`E-${idx}`} className="">{renderCell('E', phase)}</div>
                ))}

                {/* Social Row */}
                <div className="bg-blue-50 p-4 font-bold border-r border-b border-gray-300 flex items-center justify-center text-blue-800">사회 (S)</div>
                {ROADMAP_PHASES.map((phase, idx) => (
                    <div key={`S-${idx}`} className="">{renderCell('S', phase)}</div>
                ))}

                {/* Governance Row */}
                <div className="bg-orange-50 p-4 font-bold border-r border-b border-gray-300 flex items-center justify-center text-orange-800">지배구조 (G)</div>
                {ROADMAP_PHASES.map((phase, idx) => (
                    <div key={`G-${idx}`} className="">{renderCell('G', phase)}</div>
                ))}
            </div>
            </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 print:hidden">
        <button onClick={prevStep} className="text-gray-600 hover:text-gray-900 px-6 py-2">
          이전 단계
        </button>
        <button
          onClick={nextStep}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors"
        >
          다음: 최종 보고서 생성
        </button>
      </div>
    </div>
  );
};

export default Step4Roadmap;