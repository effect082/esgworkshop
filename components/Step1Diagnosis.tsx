import React, { useMemo, useState } from 'react';
import { DiagnosisScore, DiagnosisDetail, Step, INDICATORS_META, WorkshopData, INITIAL_DETAILS } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Info, ChevronDown, ChevronUp, Bot, Loader2, RotateCcw } from 'lucide-react';
import FileUploader from './FileUploader';
import { generateDiagnosisAnalysis } from '../services/gemini';
import ExportButtons from './ExportButtons';

interface Props {
  data: DiagnosisScore;
  workshopData: WorkshopData;
  updateData: (data: DiagnosisScore) => void;
  updateAnalysis: (analysis: string) => void;
  nextStep: () => void;
}

const Step1Diagnosis: React.FC<Props> = ({ data, workshopData, updateData, updateAnalysis, nextStep }) => {
  const [expanded, setExpanded] = useState<string | null>('E');
  const [analyzing, setAnalyzing] = useState(false);

  const handleReset = () => {
    if (confirm("이 단계의 데이터를 모두 초기화하시겠습니까?")) {
      updateData({
        environment: 0,
        social: 0,
        governance: 0,
        details: INITIAL_DETAILS
      });
      updateAnalysis('');
    }
  };

  const updateDetail = (key: keyof DiagnosisDetail, value: string) => {
    // Parse as float for 4.0 scale (e.g. 2.2)
    const numValue = parseFloat(value); 
    const newDetails = { ...data.details, [key]: numValue };
    
    // Auto-calculate averages based on the specific count of indicators
    const envKeys = INDICATORS_META.filter(i => i.code.startsWith('E')).map(i => i.key);
    const socKeys = INDICATORS_META.filter(i => i.code.startsWith('S')).map(i => i.key);
    const govKeys = INDICATORS_META.filter(i => i.code.startsWith('G')).map(i => i.key);

    // Calculate normalized average (0-100) from 4.0 scale
    // Formula: (Sum / Count) / 4.0 * 100 => (Sum / Count) * 25
    const calcNormalizedAvg = (keys: string[]) => {
      const sum = keys.reduce((acc, k) => acc + (newDetails[k as keyof DiagnosisDetail] || 0), 0);
      const avgRaw = sum / keys.length;
      return Math.round(avgRaw * 25); // Convert 4.0 scale to 100 scale
    };

    updateData({
      ...data,
      environment: calcNormalizedAvg(envKeys),
      social: calcNormalizedAvg(socKeys),
      governance: calcNormalizedAvg(govKeys),
      details: newDetails
    });
  };

  const chartData = [
    { subject: 'Environment', score: data.environment, fullMark: 100 },
    { subject: 'Social', score: data.social, fullMark: 100 },
    { subject: 'Governance', score: data.governance, fullMark: 100 },
  ];

  const handleFileParsed = (parsedData: any) => {
    if (parsedData) {
      updateData({
        environment: parsedData.environment || data.environment,
        social: parsedData.social || data.social,
        governance: parsedData.governance || data.governance,
        details: {
          ...data.details,
          ...(parsedData.details || {})
        }
      });
      alert("진단 결과 파일 분석이 완료되었습니다. 38개 지표 점수를 확인해주세요.");
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const analysis = await generateDiagnosisAnalysis(data.details);
    updateAnalysis(analysis);
    setAnalyzing(false);
  };

  // Helper to group indicators by "Group" (Middle Classification) within a main Category
  const renderCategorySection = (categoryCode: string, title: string, color: string) => {
    const categoryIndicators = INDICATORS_META.filter(i => i.code.startsWith(categoryCode));
    
    // Group by 'group' field
    const groups: Record<string, typeof INDICATORS_META> = {};
    categoryIndicators.forEach(ind => {
      if (!groups[ind.group]) groups[ind.group] = [];
      groups[ind.group].push(ind);
    });

    const isExpanded = expanded === categoryCode;
    const accentColor = color.split('-')[1]; // e.g., 'green' from 'text-green-600'
    const currentScore = categoryCode === 'E' ? data.environment : categoryCode === 'S' ? data.social : data.governance;

    return (
      <div className={`border border-${accentColor}-100 rounded-xl overflow-hidden`}>
        <div 
          className={`bg-${accentColor}-50 p-4 flex justify-between items-center cursor-pointer hover:bg-${accentColor}-100 transition-colors`}
          onClick={() => setExpanded(isExpanded ? null : categoryCode)}
        >
          <div>
            <h3 className={`font-bold ${color.replace('600', '800')} flex items-center gap-2`}>
              [{categoryCode}] {title}
            </h3>
            <p className={`text-xs ${color} mt-0.5`}>
              환산 점수 (100점 만점): <span className="font-bold text-lg">{currentScore}</span>점
            </p>
          </div>
          {isExpanded ? <ChevronUp className={color} size={20}/> : <ChevronDown className={color} size={20}/>}
        </div>
        
        {isExpanded && (
          <div className="p-4 bg-white space-y-6">
            <div className="text-xs text-gray-500 text-right border-b pb-2 mb-2">
               ※ 각 지표는 4.0점 만점 기준으로 입력해주세요. (0.0 ~ 4.0)
            </div>
            {Object.entries(groups).map(([groupName, indicators]) => (
              <div key={groupName} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <h4 className="font-semibold text-gray-800 text-sm mb-3 px-1 border-l-4 border-gray-300 pl-2">
                  {groupName}
                </h4>
                <div className="space-y-3 pl-2">
                  {indicators.map(ind => (
                    <div key={ind.key}>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs text-gray-600 flex-1">
                          <span className="font-bold mr-1">{ind.code}</span> {ind.label}
                        </label>
                        <span className={`text-xs font-bold ${color} ml-2 w-12 text-right`}>
                          {data.details[ind.key as keyof DiagnosisDetail].toFixed(1)} / 4.0
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="0"
                            max="4"
                            step="0.1"
                            value={data.details[ind.key as keyof DiagnosisDetail]}
                            onChange={(e) => updateDetail(ind.key as keyof DiagnosisDetail, e.target.value)}
                            className={`flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-${accentColor}-600`}
                        />
                        <input 
                            type="number"
                            min="0"
                            max="4"
                            step="0.1"
                            value={data.details[ind.key as keyof DiagnosisDetail]}
                            onChange={(e) => {
                                let val = parseFloat(e.target.value);
                                if (val > 4) val = 4;
                                if (val < 0) val = 0;
                                updateDetail(ind.key as keyof DiagnosisDetail, isNaN(val) ? '0' : val.toString());
                            }}
                            className="w-14 text-xs border rounded p-1 text-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-start md:items-center">
        <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded mr-3">STEP 1</span>
                ESG 자체 진단 (Self-Diagnosis)
            </h2>
            <p className="text-gray-600">
                ESG 3대 범주, 38개 진단지표에 대한 자체진단 결과를 입력하세요. (4.0점 만점 기준)
            </p>
        </div>
        <div className="flex items-center gap-2">
            <button 
               onClick={handleReset}
               className="text-gray-400 hover:text-red-500 transition-colors p-2"
               title="이 단계 초기화 (새로고침)"
            >
               <RotateCcw size={20} />
            </button>
            <ExportButtons targetId="step1-content" fileName="ESG_Diagnosis_Result" />
        </div>
      </div>

      <div id="step1-content" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        
        <FileUploader step={Step.DIAGNOSIS} onDataParsed={handleFileParsed} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {renderCategorySection('E', '환경 (Environment)', 'text-green-600')}
          {renderCategorySection('S', '사회 (Social)', 'text-blue-600')}
          {renderCategorySection('G', '지배구조 (Governance)', 'text-orange-600')}
        </div>

        {/* Analysis & Strategy Section - This is the target for export */}
        <div className="mt-12 pt-8 border-t border-gray-100">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
             <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
               <Bot size={20} className="text-purple-600" />
               AI 진단 결과 분석 및 중장기 발전계획 제언
             </h3>
             <div className="flex gap-2">
               <ExportButtons targetId="ai-diagnosis-analysis" fileName="AI_Diagnosis_Analysis" />
               <button
                 onClick={handleAnalyze}
                 disabled={analyzing}
                 className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50 transition-colors"
               >
                 {analyzing ? <Loader2 className="animate-spin" size={14}/> : <Bot size={14}/>}
                 {analyzing ? "분석 중..." : "진단 결과 분석 및 제언 생성"}
               </button>
             </div>
           </div>
           
           {/* Targeted Container for Export */}
           <div id="ai-diagnosis-analysis">
             {workshopData.diagnosisAnalysis ? (
               <div 
                 className="bg-purple-50 p-6 rounded-xl border border-purple-100 prose prose-sm max-w-none text-gray-700"
                 // Render HTML content safely
                 dangerouslySetInnerHTML={{ __html: workshopData.diagnosisAnalysis }}
               >
               </div>
             ) : (
               <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 text-center text-gray-500">
                 <Info className="mx-auto mb-2 text-gray-400" size={24} />
                 <p>위 버튼을 클릭하여 AI가 분석한 진단 결과와 중장기 발전계획 제언을 확인하세요.</p>
                 <p className="text-xs mt-1">입력된 점수를 바탕으로 취약점을 분석하고 구체적인 전략을 제안합니다.</p>
               </div>
             )}
           </div>
        </div>

        {/* Charts Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
           <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 flex flex-col h-72">
             <h4 className="text-center font-bold text-gray-700 mb-4">ESG 종합 역량 진단 (100점 환산 기준)</h4>
             {/* Fix: Added min-w-0 to flex child to allow shrinking, and relative for absolute child positioning */}
             <div className="flex-1 min-h-0 min-w-0 relative">
               <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name="ESG Score" dataKey="score" stroke="#2563EB" fill="#3B82F6" fillOpacity={0.6} />
                        <Tooltip />
                      </RadarChart>
                  </ResponsiveContainer>
               </div>
             </div>
           </div>
           
           <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 flex flex-col justify-center h-72">
             <div className="flex items-start gap-3">
               <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
               <div>
                 <h4 className="font-bold text-blue-800 text-lg mb-2">진단 결과 활용 가이드</h4>
                 <p className="text-sm text-blue-700 mb-2">
                   총 38개 지표(4.0점 만점)를 기반으로 우리 기관의 강점과 약점을 파악하세요.
                 </p>
                 <ul className="text-sm text-blue-700 space-y-2 list-disc pl-4">
                   <li>
                     <strong>분석 기능 활용:</strong> '진단 결과 분석'을 통해 도출된 제언을 다음 단계(SWOT, 전략수립)에서 적극 활용하세요.
                   </li>
                   <li>
                     <strong>취약점 보완:</strong> 점수가 낮은 지표는 로드맵의 우선 추진 과제로 선정하는 것이 좋습니다.
                   </li>
                 </ul>
               </div>
             </div>
           </div>
        </div>

      </div>

      <div className="flex justify-end pt-4 print:hidden">
        <button
          onClick={nextStep}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors"
        >
          다음: SWOT 분석 하러가기
        </button>
      </div>
    </div>
  );
};

export default Step1Diagnosis;