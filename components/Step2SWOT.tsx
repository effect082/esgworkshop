import React, { useState } from 'react';
import { SwotData, SwotItem, Step } from '../types';
import { generateAiSuggestions, generateSwotAnalysis } from '../services/gemini';
import { Plus, Trash2, Wand2, Loader2, BarChart2, RotateCcw } from 'lucide-react';
import FileUploader from './FileUploader';
import ExportButtons from './ExportButtons';

type SwotCategory = 'strengths' | 'weaknesses' | 'opportunities' | 'threats';

interface Props {
  data: SwotData;
  updateData: (data: SwotData) => void;
  nextStep: () => void;
  prevStep: () => void;
  teamName: string;
  diagnosisAnalysis: string;
}

const Step2SWOT: React.FC<Props> = ({ data, updateData, nextStep, prevStep, teamName, diagnosisAnalysis }) => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [contextInput, setContextInput] = useState('');

  const handleReset = () => {
    if (confirm("이 단계의 데이터를 모두 초기화하시겠습니까?")) {
      updateData({
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
        analysis: undefined
      });
    }
  };

  const addItem = (category: SwotCategory, text: string = '') => {
    const newItem: SwotItem = { id: Date.now().toString() + Math.random(), text };
    updateData({ ...data, [category]: [...data[category], newItem] });
  };

  const updateItem = (category: SwotCategory, id: string, text: string) => {
    const newItems = data[category].map(item => item.id === id ? { ...item, text } : item);
    updateData({ ...data, [category]: newItems });
  };

  const deleteItem = (category: SwotCategory, id: string) => {
    const newItems = data[category].filter(item => item.id !== id);
    updateData({ ...data, [category]: newItems });
  };

  const handleAiAssist = async () => {
    if (!contextInput) return alert("기관의 상황이나 특징을 간단히 입력해주세요.");
    setLoading(true);
    const suggestion = await generateAiSuggestions(contextInput, 'SWOT');
    alert(`AI 제안 내용:\n\n${suggestion}\n\n이 내용을 참고하여 칸을 채워보세요.`);
    setLoading(false);
  };

  const handleSwotAnalysis = async () => {
    const hasItems = data.strengths.length > 0 || data.weaknesses.length > 0 || data.opportunities.length > 0 || data.threats.length > 0;
    if (!hasItems) return alert("SWOT 항목을 먼저 입력해주세요.");

    setAnalyzing(true);
    // Pass the diagnosis analysis to the generation function
    const result = await generateSwotAnalysis(data, diagnosisAnalysis);
    if (result) {
      updateData({ ...data, analysis: result });
      alert("SWOT 매트릭스 분석이 완료되었습니다. 하단의 분석 결과를 확인하세요.");
    } else {
      alert("분석 중 오류가 발생했습니다.");
    }
    setAnalyzing(false);
  };

  const handleFileParsed = (parsedData: any) => {
      if (!parsedData) return;
      
      const newSwot = { ...data };
      const categories: SwotCategory[] = ['strengths', 'weaknesses', 'opportunities', 'threats'];
      
      categories.forEach(cat => {
          if (parsedData[cat] && Array.isArray(parsedData[cat])) {
              // Append parsed items
              const newItems = parsedData[cat].map((text: string) => ({
                  id: Date.now().toString() + Math.random(),
                  text
              }));
              newSwot[cat] = [...newSwot[cat], ...newItems];
          }
      });
      updateData(newSwot);
      alert("파일 분석 결과가 추가되었습니다.");
  };

  const renderSection = (title: string, category: SwotCategory, color: string, description: string) => (
    <div className={`border-t-4 ${color} bg-white p-4 rounded shadow-sm flex flex-col min-h-[300px]`}>
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <button onClick={() => addItem(category)} className="text-gray-500 hover:text-blue-600">
          <Plus size={20} />
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto max-h-60">
        {data[category].map((item) => (
          <div key={item.id} className="flex gap-2 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></span>
            <input
              type="text"
              value={item.text}
              onChange={(e) => updateItem(category, item.id, e.target.value)}
              placeholder="내용 입력..."
              className="flex-1 border-b border-gray-200 focus:border-blue-500 outline-none py-1 text-sm"
            />
            <button onClick={() => deleteItem(category, item.id)} className="text-gray-300 hover:text-red-500">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {data[category].length === 0 && (
          <p className="text-gray-300 text-sm text-center py-4">항목을 추가해주세요</p>
        )}
      </div>
    </div>
  );

  const renderStrategyList = (items: string[]) => {
    return (
      <ul className="space-y-3">
        {items.map((item, i) => {
          // Split by the first colon found (handle both half-width and full-width colons)
          const separatorMatch = item.match(/[:：]/);
          const separatorIndex = separatorMatch ? separatorMatch.index : -1;
          
          let title = item;
          let desc = '';
          
          if (separatorIndex !== undefined && separatorIndex !== -1) {
            title = item.substring(0, separatorIndex).trim();
            desc = item.substring(separatorIndex + 1).trim();
          }

          return (
            <li key={i} className="text-sm text-gray-700">
               {separatorIndex !== undefined && separatorIndex !== -1 ? (
                 <>
                   <div className="font-bold text-indigo-800 flex items-start gap-1">
                     <span className="flex-shrink-0">￭</span> 
                     <span>{title}</span>
                   </div>
                   <div className="pl-4 text-gray-600 mt-1 leading-snug border-l-2 border-gray-100 ml-1">
                     {desc}
                   </div>
                 </>
               ) : (
                 <div className="flex items-start gap-1">
                    <span className="font-bold flex-shrink-0">￭</span> 
                    <span>{item}</span>
                 </div>
               )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded mr-3">STEP 2</span>
            SWOT 분석 및 전략 도출
          </h2>
          <p className="text-sm text-gray-600 mt-1">내부 강점/약점과 외부 기회/위협 요인을 분석하고 대응 전략을 수립합니다.</p>
        </div>
        
        <div className="flex gap-2 items-center">
            <button 
               onClick={handleReset}
               className="text-gray-400 hover:text-red-500 transition-colors p-2"
               title="이 단계 초기화 (새로고침)"
            >
               <RotateCcw size={20} />
            </button>
            {/* AI Assist Tool */}
            <div className="flex gap-2 items-center bg-purple-50 p-2 rounded-lg border border-purple-100">
            <input 
                type="text" 
                placeholder="예: 지역 내 노인 인구 증가..." 
                className="text-sm p-1.5 border rounded w-48 focus:ring-purple-500"
                value={contextInput}
                onChange={(e) => setContextInput(e.target.value)}
            />
            <button 
                onClick={handleAiAssist}
                disabled={loading}
                className="flex items-center gap-1 bg-purple-600 text-white text-sm px-3 py-1.5 rounded hover:bg-purple-700 disabled:opacity-50"
            >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                AI 아이디어
            </button>
            </div>
        </div>
      </div>
      
      <FileUploader step={Step.SWOT} onDataParsed={handleFileParsed} />

      {/* Basic SWOT Inputs - Responsive Grid with Natural Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderSection('강점 (Strength)', 'strengths', 'border-blue-500', '내부적 긍정 요인')}
        {renderSection('약점 (Weakness)', 'weaknesses', 'border-red-500', '내부적 부정 요인')}
        {renderSection('기회 (Opportunity)', 'opportunities', 'border-green-500', '외부적 긍정 요인')}
        {renderSection('위협 (Threat)', 'threats', 'border-orange-500', '외부적 부정 요인')}
      </div>

      {/* Analysis Action - Automatically Positioned Below Inputs */}
      <div className="flex justify-center mt-8 mb-8 print:hidden">
        <button 
        onClick={handleSwotAnalysis}
        disabled={analyzing}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-10 rounded-full shadow-lg flex items-center gap-2 transform transition hover:scale-105 disabled:opacity-50 disabled:scale-100"
        >
        {analyzing ? <Loader2 className="animate-spin" size={20} /> : <BarChart2 size={20} />}
        SWOT 매트릭스 분석 및 전략 자동 도출
        </button>
      </div>

      {/* Matrix Result - Targeted for Export */}
      {data.analysis && (
        <div className="animate-slide-up">
           <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                 <span className="w-2 h-8 bg-indigo-600 rounded"></span>
                 SWOT 전략 매트릭스
              </h3>
              <ExportButtons targetId="swot-matrix-analysis" fileName="SWOT_Strategy_Matrix" />
           </div>
           
           <div id="swot-matrix-analysis" className="bg-white p-6 rounded-lg shadow-lg border border-gray-300">
                <div className="grid grid-cols-[1fr_1.5fr_1.5fr] gap-0 border-2 border-gray-300 text-sm">
                    {/* Header Row */}
                    <div className="bg-gray-100 p-4 border-r border-b border-gray-300 font-bold text-center flex items-center justify-center">
                        내부 \ 외부 요인
                    </div>
                    <div className="bg-green-50 p-4 border-r border-b border-gray-300">
                    <strong className="text-green-800 block mb-2 text-center text-lg">기회 (Opportunities)</strong>
                    <ul className="list-disc pl-4 text-green-700 space-y-1">
                        {data.analysis.summarized.opportunities.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                    </div>
                    <div className="bg-orange-50 p-4 border-b border-gray-300">
                    <strong className="text-orange-800 block mb-2 text-center text-lg">위협 (Threats)</strong>
                    <ul className="list-disc pl-4 text-orange-700 space-y-1">
                        {data.analysis.summarized.threats.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                    </div>

                    {/* Strength Row */}
                    <div className="bg-blue-50 p-4 border-r border-b border-gray-300">
                        <strong className="text-blue-800 block mb-2 text-center text-lg">강점 (Strengths)</strong>
                        <ul className="list-disc pl-4 text-blue-700 space-y-1">
                        {data.analysis.summarized.strengths.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                    </div>
                    <div className="p-4 border-r border-b border-gray-300 bg-white hover:bg-blue-50 transition-colors">
                        <div className="mb-2 font-bold text-indigo-700 border-b pb-1 flex justify-between">
                        <span>SO 전략 (우선사업)</span>
                        <span className="text-xs font-normal text-gray-500">강점+기회</span>
                        </div>
                        {renderStrategyList(data.analysis.matrix.so)}
                    </div>
                    <div className="p-4 border-b border-gray-300 bg-white hover:bg-blue-50 transition-colors">
                        <div className="mb-2 font-bold text-indigo-700 border-b pb-1 flex justify-between">
                        <span>ST 전략 (RISK 포함)</span>
                        <span className="text-xs font-normal text-gray-500">강점+위협</span>
                        </div>
                        {renderStrategyList(data.analysis.matrix.st)}
                    </div>

                    {/* Weakness Row */}
                    <div className="bg-red-50 p-4 border-r border-gray-300">
                        <strong className="text-red-800 block mb-2 text-center text-lg">약점 (Weaknesses)</strong>
                        <ul className="list-disc pl-4 text-red-700 space-y-1">
                        {data.analysis.summarized.weaknesses.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                    </div>
                    <div className="p-4 border-r border-gray-300 bg-white hover:bg-red-50 transition-colors">
                        <div className="mb-2 font-bold text-indigo-700 border-b pb-1 flex justify-between">
                        <span>WO 전략 (우선보완)</span>
                        <span className="text-xs font-normal text-gray-500">약점+기회</span>
                        </div>
                        {renderStrategyList(data.analysis.matrix.wo)}
                    </div>
                    <div className="p-4 bg-white hover:bg-red-50 transition-colors">
                        <div className="mb-2 font-bold text-indigo-700 border-b pb-1 flex justify-between">
                        <span>WT 전략 (장기보완)</span>
                        <span className="text-xs font-normal text-gray-500">약점+위협</span>
                        </div>
                        {renderStrategyList(data.analysis.matrix.wt)}
                    </div>
                </div>
           </div>
        </div>
      )}

      <div className="flex justify-between pt-4 print:hidden">
        <button
          onClick={prevStep}
          className="text-gray-600 hover:text-gray-900 px-6 py-2"
        >
          이전 단계
        </button>
        <button
          onClick={nextStep}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors"
        >
          다음: 전략 수립 하러가기
        </button>
      </div>
    </div>
  );
};

export default Step2SWOT;