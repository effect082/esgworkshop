import React from 'react';
import { ActionIdeaData, ActionIdeaRow, Step } from '../types';
import FileUploader from './FileUploader';
import ExportButtons from './ExportButtons';
import { RotateCcw } from 'lucide-react';

interface Props {
  data: ActionIdeaData;
  updateData: (data: ActionIdeaData) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const StepActionIdeas: React.FC<Props> = ({ data, updateData, nextStep, prevStep }) => {
  
  const handleReset = () => {
    if (confirm("이 단계의 데이터를 모두 초기화하시겠습니까?")) {
      updateData({
        environment: { asIs: '', toBe: '', idea: '' },
        social: { asIs: '', toBe: '', idea: '' },
        governance: { asIs: '', toBe: '', idea: '' }
      });
    }
  };

  const handleUpdate = (category: keyof ActionIdeaData, field: keyof ActionIdeaRow, value: string) => {
    updateData({
      ...data,
      [category]: {
        ...data[category],
        [field]: value
      }
    });
  };

  const handleFileParsed = (parsedData: any) => {
    if (!parsedData) return;
    updateData({
      environment: { ...data.environment, ...parsedData.environment },
      social: { ...data.social, ...parsedData.social },
      governance: { ...data.governance, ...parsedData.governance }
    });
    alert("실천 아이디어 분석 내용이 반영되었습니다.");
  };

  const renderRow = (label: string, category: keyof ActionIdeaData, colorClass: string) => (
    <div className="grid grid-cols-1 md:grid-cols-4 border-b border-gray-200">
      <div className={`p-4 font-bold flex items-center justify-center md:justify-start ${colorClass}`}>
        {label}
      </div>
      <div className="p-2 border-l border-gray-100">
         <div className="md:hidden text-xs font-bold text-gray-400 mb-1">현재 우리의 모습 (As-Is)</div>
         <textarea
           value={data[category].asIs}
           onChange={(e) => handleUpdate(category, 'asIs', e.target.value)}
           className="w-full h-32 p-2 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none"
           placeholder="자가진단 결과 및 복지관의 현안(문제점 등)"
         />
      </div>
      <div className="p-2 border-l border-gray-100">
         <div className="md:hidden text-xs font-bold text-gray-400 mb-1">미래의 모습 (To-Be)</div>
         <textarea
           value={data[category].toBe}
           onChange={(e) => handleUpdate(category, 'toBe', e.target.value)}
           className="w-full h-32 p-2 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none"
           placeholder="5년 뒤 우리가 바라는 모습"
         />
      </div>
      <div className="p-2 border-l border-gray-100">
         <div className="md:hidden text-xs font-bold text-gray-400 mb-1">해결 아이디어 (Idea)</div>
         <textarea
           value={data[category].idea}
           onChange={(e) => handleUpdate(category, 'idea', e.target.value)}
           className="w-full h-32 p-2 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none"
           placeholder="구체적으로 무엇을 할까?"
         />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded mr-3">STEP 4</span>
            ESG 실천 아이디어 (Action Ideas)
            </h2>
            <p className="text-sm text-gray-600 mt-1">현재의 문제점(As-Is)과 미래상(To-Be)을 연결하는 구체적인 해결 아이디어를 도출합니다.</p>
        </div>
        <div className="flex items-center gap-2">
            <button 
               onClick={handleReset}
               className="text-gray-400 hover:text-red-500 transition-colors p-2"
               title="이 단계 초기화 (새로고침)"
            >
               <RotateCcw size={20} />
            </button>
            <ExportButtons targetId="step4-content" fileName="ESG_Action_Ideas" />
        </div>
      </div>

      <div id="step4-content">
        <FileUploader step={Step.ACTION_IDEAS} onDataParsed={handleFileParsed} />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header - Desktop only */}
            <div className="hidden md:grid grid-cols-4 bg-gray-100 border-b border-gray-200 font-bold text-gray-700 text-sm text-center">
            <div className="p-3">구분</div>
            <div className="p-3 bg-blue-50 text-blue-800 border-l border-white">
                현재 우리의 모습 (As-Is)<br/>
                <span className="font-normal text-xs text-blue-600">◆ 자가진단 결과 및 현안</span>
            </div>
            <div className="p-3 bg-green-50 text-green-800 border-l border-white">
                미래의 모습 (To-Be)<br/>
                <span className="font-normal text-xs text-green-600">◆ 5년 뒤 우리가 바라는 모습</span>
            </div>
            <div className="p-3 bg-purple-50 text-purple-800 border-l border-white">
                해결 아이디어 (Idea)<br/>
                <span className="font-normal text-xs text-purple-600">◆ 구체적으로 무엇을 할까?</span>
            </div>
            </div>

            {renderRow('환경 (E)', 'environment', 'text-green-700 bg-green-50/30')}
            {renderRow('사회 (S)', 'social', 'text-blue-700 bg-blue-50/30')}
            {renderRow('지배구조 (G)', 'governance', 'text-orange-700 bg-orange-50/30')}
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
          다음: 로드맵 작성하기
        </button>
      </div>
    </div>
  );
};

export default StepActionIdeas;