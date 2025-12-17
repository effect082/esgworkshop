import React, { useState } from 'react';
import { WorkshopData, INDICATORS_META, DiagnosisDetail, ROADMAP_PHASES } from '../types';
import { saveToGoogleSheets } from '../services/googleSheets';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Download, Save, CheckCircle, AlertTriangle, Bot, RotateCcw } from 'lucide-react';
import ExportButtons from './ExportButtons';

interface Props {
  data: WorkshopData;
  prevStep: () => void;
}

const Step5Report: React.FC<Props> = ({ data, prevStep }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const chartData = [
    { subject: 'Environment', A: data.diagnosis.environment, fullMark: 100 },
    { subject: 'Social', A: data.diagnosis.social, fullMark: 100 },
    { subject: 'Governance', A: data.diagnosis.governance, fullMark: 100 },
  ];

  const handleReload = () => {
    if (confirm("페이지를 새로고침 하시겠습니까? 입력된 데이터가 모두 초기화될 수 있습니다.")) {
      window.location.reload();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(false);
    const success = await saveToGoogleSheets(data);
    if (success) {
      setSaved(true);
    } else {
      setError(true);
    }
    setSaving(false);
  };

  const getStatus = (score: number) => {
    // 4.0 Scale: 80% = 3.2, 60% = 2.4
    if (score >= 3.2) return <span className="text-green-600 font-bold">양호</span>;
    if (score >= 2.4) return <span className="text-yellow-600 font-bold">보통</span>;
    return <span className="text-red-600 font-bold">미흡</span>;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10 print:space-y-4">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <span className="bg-green-600 text-white text-sm px-2 py-1 rounded mr-3">FINAL</span>
            ESG 경영 워크숍 결과 보고서
          </h2>
          <p className="text-sm text-gray-600 mt-1">작성된 내용을 최종 확인하고 제출합니다.</p>
        </div>
        <div className="flex gap-2">
           <button 
               onClick={handleReload}
               className="text-gray-400 hover:text-red-500 transition-colors p-2"
               title="전체 새로고침"
           >
               <RotateCcw size={20} />
           </button>
           <ExportButtons targetId="final-report-content" fileName={`ESG_Report_${data.teamName || 'Team'}`} />
           <button 
             onClick={handleSave} 
             disabled={saving || saved}
             className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white font-bold shadow-md transition-colors ${
               saved ? 'bg-green-600' : error ? 'bg-red-500' : 'bg-blue-600 hover:bg-blue-700'
             }`}
           >
             {saved ? <><CheckCircle size={18}/>제출 완료</> : error ? <><AlertTriangle size={18}/>전송 실패</> : <><Save size={18}/>데이터 제출</>}
           </button>
        </div>
      </div>

      {/* Report Container */}
      <div id="final-report-content" className="bg-white p-8 shadow-lg max-w-5xl mx-auto border border-gray-200 print:shadow-none print:border-none">
        
        {/* Header Section */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">ESG 경영 중장기 발전계획</h1>
          <p className="text-gray-500 mt-2 text-lg">작성 모둠: {data.teamName || '(모둠명 미입력)'}</p>
          <p className="text-gray-400 text-sm">{new Date().toLocaleDateString()}</p>
        </div>

        {/* 1. Vision & Strategy */}
        <div className="mb-8">
           <h3 className="text-xl font-bold text-blue-800 border-l-4 border-blue-600 pl-3 mb-4">1. 비전 및 전략체계</h3>
           <div className="bg-blue-50 p-6 rounded-lg text-center space-y-4">
              <div>
                <span className="text-sm text-blue-500 font-bold uppercase tracking-wider">Mission</span>
                <p className="text-xl font-bold text-gray-800 mt-1">{data.strategy.mission || '-'}</p>
              </div>
              <div className="w-16 h-1 bg-blue-200 mx-auto"></div>
              <div>
                <span className="text-sm text-blue-500 font-bold uppercase tracking-wider">Vision</span>
                <p className="text-2xl font-extrabold text-blue-900 mt-1">"{data.strategy.vision || '-'}"</p>
              </div>
           </div>
           
           <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
             <div className="bg-green-50 p-0 rounded border border-green-200 overflow-hidden flex flex-col">
               <strong className="block text-white bg-green-600 p-2 text-center">환경(E) 전략</strong>
               <div className="p-3 bg-green-50 text-green-900 font-bold border-b border-green-100 text-center min-h-[3em] flex items-center justify-center">
                  {data.strategy.strategies.environment.strategy || "(전략 미입력)"}
               </div>
               <ul className="p-3 list-disc pl-6 space-y-1 text-gray-700 flex-1">
                  {data.strategy.strategies.environment.tasks.map((task, i) => (
                      <li key={i}>{task || "-"}</li>
                  ))}
               </ul>
             </div>
             
             <div className="bg-blue-50 p-0 rounded border border-blue-200 overflow-hidden flex flex-col">
               <strong className="block text-white bg-blue-600 p-2 text-center">사회(S) 전략</strong>
               <div className="p-3 bg-blue-50 text-blue-900 font-bold border-b border-blue-100 text-center min-h-[3em] flex items-center justify-center">
                  {data.strategy.strategies.social.strategy || "(전략 미입력)"}
               </div>
               <ul className="p-3 list-disc pl-6 space-y-1 text-gray-700 flex-1">
                  {data.strategy.strategies.social.tasks.map((task, i) => (
                      <li key={i}>{task || "-"}</li>
                  ))}
               </ul>
             </div>

             <div className="bg-orange-50 p-0 rounded border border-orange-200 overflow-hidden flex flex-col">
               <strong className="block text-white bg-orange-600 p-2 text-center">지배구조(G) 전략</strong>
               <div className="p-3 bg-orange-50 text-orange-900 font-bold border-b border-orange-100 text-center min-h-[3em] flex items-center justify-center">
                  {data.strategy.strategies.governance.strategy || "(전략 미입력)"}
               </div>
               <ul className="p-3 list-disc pl-6 space-y-1 text-gray-700 flex-1">
                  {data.strategy.strategies.governance.tasks.map((task, i) => (
                      <li key={i}>{task || "-"}</li>
                  ))}
               </ul>
             </div>
           </div>
        </div>

        {/* 2. Diagnosis Results & Analysis */}
        <div className="mb-8">
           <h3 className="text-xl font-bold text-blue-800 border-l-4 border-blue-600 pl-3 mb-4">2. 진단 결과 및 발전계획 제언</h3>
           <div className="flex justify-center mb-6">
                <div className="h-64 w-96 border rounded-lg flex flex-col bg-gray-50 p-2">
                    {/* Fix: Added min-w-0 and relative to ensure Recharts can calculate size */}
                    <div className="flex-1 min-h-0 min-w-0 relative">
                        <div className="absolute inset-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                    <Radar name="Score" dataKey="A" stroke="#2563EB" fill="#3B82F6" fillOpacity={0.6} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
           </div>

           {/* AI Diagnosis Analysis Display */}
           {data.diagnosisAnalysis && (
             <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
               <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                 <Bot size={16} className="text-purple-600" />
                 중장기 발전계획 수립을 위한 AI 제언
               </h4>
               <div 
                 className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap"
                 // Render purified HTML
                 dangerouslySetInnerHTML={{ __html: data.diagnosisAnalysis }}
               >
               </div>
             </div>
           )}
           
           {/* Detailed Table (38 Indicators) */}
           <div className="mt-4 overflow-x-auto">
             <h4 className="font-bold text-gray-700 mb-2 text-sm">상세 진단 결과 (4.0 만점 기준)</h4>
             <table className="w-full text-xs text-left border-collapse border border-gray-200">
                <thead>
                    <tr className="bg-gray-100 text-center">
                        <th className="border p-2">영역</th>
                        <th className="border p-2">코드</th>
                        <th className="border p-2">중분류</th>
                        <th className="border p-2">진단지표</th>
                        <th className="border p-2 w-16">점수</th>
                        <th className="border p-2 w-16">상태</th>
                    </tr>
                </thead>
                <tbody>
                    {INDICATORS_META.map((ind) => {
                       const score = data.diagnosis.details[ind.key as keyof DiagnosisDetail];
                       const category = ind.code.charAt(0) === 'E' ? '환경' : ind.code.charAt(0) === 'S' ? '사회' : '지배구조';
                       const colorClass = ind.code.charAt(0) === 'E' ? 'bg-green-50' : ind.code.charAt(0) === 'S' ? 'bg-blue-50' : 'bg-orange-50';
                       
                       return (
                         <tr key={ind.key}>
                            <td className={`border p-2 text-center font-bold ${colorClass}`}>{category}</td>
                            <td className="border p-2 text-center">{ind.code}</td>
                            <td className="border p-2">{ind.group}</td>
                            <td className="border p-2">{ind.label}</td>
                            <td className="border p-2 text-center">{score.toFixed(1)}</td>
                            <td className="border p-2 text-center">{getStatus(score)}</td>
                         </tr>
                       );
                    })}
                </tbody>
             </table>
           </div>
        </div>

        {/* 3. SWOT */}
        <div className="mb-8">
           <h3 className="text-xl font-bold text-blue-800 border-l-4 border-blue-600 pl-3 mb-4">3. SWOT 분석</h3>
           <div className="grid grid-cols-2 gap-2 text-xs h-auto min-h-[12rem]">
             <div className="border border-blue-200 bg-blue-50 p-2 overflow-hidden">
               <strong className="text-blue-700">S (강점)</strong>
               <ul className="list-disc pl-4 mt-1 space-y-1">{data.swot.strengths.slice(0,5).map(i => <li key={i.id}>{i.text}</li>)}</ul>
             </div>
             <div className="border border-red-200 bg-red-50 p-2 overflow-hidden">
               <strong className="text-red-700">W (약점)</strong>
               <ul className="list-disc pl-4 mt-1 space-y-1">{data.swot.weaknesses.slice(0,5).map(i => <li key={i.id}>{i.text}</li>)}</ul>
             </div>
             <div className="border border-green-200 bg-green-50 p-2 overflow-hidden">
               <strong className="text-green-700">O (기회)</strong>
               <ul className="list-disc pl-4 mt-1 space-y-1">{data.swot.opportunities.slice(0,5).map(i => <li key={i.id}>{i.text}</li>)}</ul>
             </div>
             <div className="border border-orange-200 bg-orange-50 p-2 overflow-hidden">
               <strong className="text-orange-700">T (위협)</strong>
               <ul className="list-disc pl-4 mt-1 space-y-1">{data.swot.threats.slice(0,5).map(i => <li key={i.id}>{i.text}</li>)}</ul>
             </div>
           </div>
        </div>

        {/* 4. ESG Action Ideas */}
        <div className="mb-8">
           <h3 className="text-xl font-bold text-blue-800 border-l-4 border-blue-600 pl-3 mb-4">4. ESG 실천 아이디어</h3>
           <div className="border border-gray-300 rounded text-sm">
             <div className="grid grid-cols-4 bg-gray-100 border-b font-bold text-center">
               <div className="p-2 border-r">구분</div>
               <div className="p-2 border-r">As-Is</div>
               <div className="p-2 border-r">To-Be</div>
               <div className="p-2">Idea</div>
             </div>
             {[
               { name: '환경(E)', key: 'environment', val: data.actionIdeas.environment },
               { name: '사회(S)', key: 'social', val: data.actionIdeas.social },
               { name: '지배구조(G)', key: 'governance', val: data.actionIdeas.governance }
             ].map((item: any) => (
               <div key={item.key} className="grid grid-cols-4 border-b last:border-b-0">
                 <div className="p-2 border-r font-bold bg-gray-50 flex items-center justify-center text-center">{item.name}</div>
                 <div className="p-2 border-r whitespace-pre-wrap">{item.val.asIs}</div>
                 <div className="p-2 border-r whitespace-pre-wrap">{item.val.toBe}</div>
                 <div className="p-2 whitespace-pre-wrap">{item.val.idea}</div>
               </div>
             ))}
           </div>
        </div>

        {/* 5. Roadmap */}
        <div>
           <h3 className="text-xl font-bold text-blue-800 border-l-4 border-blue-600 pl-3 mb-4">5. 중장기 추진 과제</h3>
           <table className="w-full text-sm border-collapse border border-gray-300">
             <thead>
               <tr className="bg-gray-100">
                 <th className="border p-2">영역</th>
                 {ROADMAP_PHASES.map((phase, idx) => (
                    <th key={idx} className="border p-2">{phase}</th>
                 ))}
               </tr>
             </thead>
             <tbody>
               {['E', 'S', 'G'].map(cat => (
                 <tr key={cat}>
                   <td className={`border p-2 font-bold text-center ${cat === 'E' ? 'bg-green-50 text-green-800' : cat === 'S' ? 'bg-blue-50 text-blue-800' : 'bg-orange-50 text-orange-800'}`}>
                     {cat}
                   </td>
                   {ROADMAP_PHASES.map((phase, idx) => {
                      const tasks = data.roadmap.filter(t => t.category === cat && t.year === phase);
                      return (
                        <td key={idx} className="border p-2 align-top">
                          <ul className="list-disc pl-4 space-y-1">
                            {tasks.map(t => <li key={t.id}>{t.task}</li>)}
                          </ul>
                        </td>
                      );
                   })}
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>
      
      <div className="text-center print:hidden">
        <button onClick={prevStep} className="text-gray-500 hover:text-gray-800 text-sm">수정하기 (이전 단계)</button>
      </div>
    </div>
  );
};

export default Step5Report;