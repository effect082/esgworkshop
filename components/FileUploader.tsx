import React, { useRef, useState } from 'react';
import { FileUp, Download, Loader2, FileType } from 'lucide-react';
import { Step } from '../types';
import { parseUploadedFile } from '../services/gemini';

interface Props {
  step: Step;
  onDataParsed: (data: any) => void;
  customLabel?: string; // New prop for custom button text
  hideTemplate?: boolean; // New prop to hide template download
  parseMode?: 'DEFAULT' | 'TEXT_ONLY'; // New prop to control parsing behavior
}

const FileUploader: React.FC<Props> = ({ step, onDataParsed, customLabel, hideTemplate = false, parseMode = 'DEFAULT' }) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getTemplateContent = () => {
    switch (step) {
      case Step.DIAGNOSIS:
        return `Code,Score(0.0-4.0)
E1-1,0.0
E2-1,0.0
E3-1,0.0
E4-1,0.0
E5-1,0.0
S1-1,0.0
S1-2,0.0
S1-3,0.0
S1-4,0.0
S2-1,0.0
S2-2,0.0
S2-3,0.0
S3-1,0.0
S3-2,0.0
S3-3,0.0
S3-4,0.0
S3-5,0.0
S4-1,0.0
S4-2,0.0
S4-3,0.0
S4-4,0.0
S4-5,0.0
S5-1,0.0
S5-2,0.0
S5-3,0.0
G1-1,0.0
G1-2,0.0
G2-1,0.0
G2-2,0.0
G3-1,0.0
G3-2,0.0
G3-3,0.0
G3-4,0.0
G4-1,0.0
G4-2,0.0
G4-3,0.0
G4-4,0.0
G4-5,0.0`;
      case Step.SWOT:
        return "Type,Content\nStrength,Internal strength example\nWeakness,Internal weakness example\nOpportunity,External opportunity example\nThreat,External threat example";
      case Step.STRATEGY:
        // Updated to Matrix format as requested, removing Mission/Vision
        return "구분,환경 (Environment),사회 (Social),지배구조 (Governance)\n추진 전략,환경 추진전략 입력,사회 추진전략 입력,지배구조 추진전략 입력\n추진 과제 1,환경 과제 1,사회 과제 1,지배구조 과제 1\n추진 과제 2,환경 과제 2,사회 과제 2,지배구조 과제 2\n추진 과제 3,환경 과제 3,사회 과제 3,지배구조 과제 3\n추진 과제 4,환경 과제 4,사회 과제 4,지배구조 과제 4\n추진 과제 5,환경 과제 5,사회 과제 5,지배구조 과제 5";
      case Step.ACTION_IDEAS:
        return "Category,As-Is (Current),To-Be (Future),Idea\nEnvironment,Current status...,Future goal...,Action idea...\nSocial,Current status...,Future goal...,Action idea...\nGovernance,Current status...,Future goal...,Action idea...";
      case Step.ROADMAP:
        return "Year,Category (E/S/G),Task\n도입기 (2026년),E,Paperless System\n확산기 (2027년 ~ 2028년),S,Community Partnership\n정착기 (2029년 ~ 2030년),G,Ethics Committee";
      default:
        return "";
    }
  };

  const handleDownloadTemplate = () => {
    const content = getTemplateContent();
    // Add BOM (\ufeff) to support Korean characters in Excel
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `template_${step.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        // Pass parseMode to the service if needed, or handle differently based on step
        const result = await parseUploadedFile(base64String, file.type, step, parseMode as 'DEFAULT' | 'TEXT_ONLY');
        onDataParsed(result);
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      alert("파일 분석 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 items-center mb-4">
      {!hideTemplate && (
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-200 border border-gray-300 transition-colors"
        >
          <Download size={14} />
          템플릿 다운로드 (.csv)
        </button>
      )}

      <div className="relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.pdf,.doc,.docx,application/pdf,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-100 border border-indigo-200 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={14} /> : <FileUp size={14} />}
          {loading ? "분석 중..." : (customLabel || "파일 업로드 및 자동입력 (PDF/CSV)")}
        </button>
      </div>
    </div>
  );
};

export default FileUploader;