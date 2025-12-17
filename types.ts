
export enum Step {
  DIAGNOSIS = 'DIAGNOSIS',
  SWOT = 'SWOT',
  STRATEGY = 'STRATEGY',
  ACTION_IDEAS = 'ACTION_IDEAS',
  ROADMAP = 'ROADMAP',
  REPORT = 'REPORT'
}

// 38 Indicators
export interface DiagnosisDetail {
  // Environment (5)
  e1_1: number; e2_1: number; e3_1: number; e4_1: number; e5_1: number;
  // Social (20)
  s1_1: number; s1_2: number; s1_3: number; s1_4: number;
  s2_1: number; s2_2: number; s2_3: number;
  s3_1: number; s3_2: number; s3_3: number; s3_4: number; s3_5: number;
  s4_1: number; s4_2: number; s4_3: number; s4_4: number; s4_5: number;
  s5_1: number; s5_2: number; s5_3: number;
  // Governance (13)
  g1_1: number; g1_2: number;
  g2_1: number; g2_2: number;
  g3_1: number; g3_2: number; g3_3: number; g3_4: number;
  g4_1: number; g4_2: number; g4_3: number; g4_4: number; g4_5: number;
}

export interface DiagnosisScore {
  environment: number;
  social: number;
  governance: number;
  details: DiagnosisDetail;
}

export interface SwotItem {
  id: string;
  text: string;
}

export interface SwotAnalysisResult {
  summarized: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  matrix: {
    so: string[]; // 강점+기회 (우선사업)
    wo: string[]; // 약점+기회 (RISK 포함)
    st: string[]; // 강점+위협 (우선보완)
    wt: string[]; // 약점+위협 (장기보완)
  };
}

export interface SwotData {
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
  analysis?: SwotAnalysisResult;
}

// Updated Strategy Structure
export interface StrategyItem {
  strategy: string; // 추진 전략
  tasks: string[];  // 추진 과제 (Fixed size: 5)
}

export interface StrategyGroup {
  environment: StrategyItem;
  social: StrategyItem;
  governance: StrategyItem;
}

export interface StrategyCandidate {
    versionName: string;
    environment: StrategyItem;
    social: StrategyItem;
    governance: StrategyItem;
}

export interface StrategyData {
  mission: string;
  vision: string;
  strategies: StrategyGroup;
  candidates?: StrategyCandidate[];
}

export interface ActionIdeaRow {
  asIs: string;
  toBe: string;
  idea: string;
}

export interface ActionIdeaData {
  environment: ActionIdeaRow;
  social: ActionIdeaRow;
  governance: ActionIdeaRow;
}

export type RoadmapPhase = '도입기 (2026년)' | '확산기 (2027년 ~ 2028년)' | '정착기 (2029년 ~ 2030년)';

export const ROADMAP_PHASES: RoadmapPhase[] = [
  '도입기 (2026년)',
  '확산기 (2027년 ~ 2028년)',
  '정착기 (2029년 ~ 2030년)'
];

export interface RoadmapGoal {
  category: 'E' | 'S' | 'G';
  year: RoadmapPhase | string;
  goal: string;
}

export interface RoadmapItem {
  id: string;
  category: 'E' | 'S' | 'G';
  task: string;
  year: RoadmapPhase | string; // Allow string for flexibility during migration/updates
}

export interface WorkshopData {
  teamName: string;
  diagnosis: DiagnosisScore;
  diagnosisAnalysis: string; // New field for AI analysis text
  swot: SwotData;
  strategy: StrategyData;
  actionIdeas: ActionIdeaData;
  roadmapGoals: RoadmapGoal[]; // New field for goals
  roadmap: RoadmapItem[];
}

export const INITIAL_DETAILS: DiagnosisDetail = {
  e1_1: 0, e2_1: 0, e3_1: 0, e4_1: 0, e5_1: 0,
  s1_1: 0, s1_2: 0, s1_3: 0, s1_4: 0,
  s2_1: 0, s2_2: 0, s2_3: 0,
  s3_1: 0, s3_2: 0, s3_3: 0, s3_4: 0, s3_5: 0,
  s4_1: 0, s4_2: 0, s4_3: 0, s4_4: 0, s4_5: 0,
  s5_1: 0, s5_2: 0, s5_3: 0,
  g1_1: 0, g1_2: 0,
  g2_1: 0, g2_2: 0,
  g3_1: 0, g3_2: 0, g3_3: 0, g3_4: 0,
  g4_1: 0, g4_2: 0, g4_3: 0, g4_4: 0, g4_5: 0
};

export const INITIAL_DATA: WorkshopData = {
  teamName: '',
  diagnosis: { environment: 0, social: 0, governance: 0, details: INITIAL_DETAILS },
  diagnosisAnalysis: '',
  swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
  strategy: {
    mission: '',
    vision: '',
    strategies: { 
      environment: { strategy: '', tasks: ['', '', '', '', ''] }, 
      social: { strategy: '', tasks: ['', '', '', '', ''] }, 
      governance: { strategy: '', tasks: ['', '', '', '', ''] } 
    }
  },
  actionIdeas: {
    environment: { asIs: '', toBe: '', idea: '' },
    social: { asIs: '', toBe: '', idea: '' },
    governance: { asIs: '', toBe: '', idea: '' }
  },
  roadmapGoals: [],
  roadmap: []
};

// Metadata for the 38 Indicators
export const INDICATORS_META = [
    // Environment
    { key: 'e1_1', code: 'E1-1', group: '친환경 경영', label: '지역사회가 공감하는 목표수립 과정' },
    { key: 'e2_1', code: 'E2-1', group: '복지관의 역할 및 대응', label: '복지관의 가치 실현' },
    { key: 'e3_1', code: 'E3-1', group: '탄소배출감소', label: '효율적 에너지 사용 시스템 구축' },
    { key: 'e4_1', code: 'E4-1', group: '자원재순환', label: '자원재순환 시스템 구축 및 실천' },
    { key: 'e5_1', code: 'E5-1', group: '환경 인식강화', label: '지역사회 인식, 행동변화' },
    // Social
    { key: 's1_1', code: 'S1-1', group: '노동관행', label: '노동관행 체계구축' },
    { key: 's1_2', code: 'S1-2', group: '노동관행', label: '공정한 채용' },
    { key: 's1_3', code: 'S1-3', group: '노동관행', label: '직원역량강화' },
    { key: 's1_4', code: 'S1-4', group: '노동관행', label: '직원복지' },
    { key: 's2_1', code: 'S2-1', group: '안전보건', label: '안전관리체계구축' },
    { key: 's2_2', code: 'S2-2', group: '안전보건', label: '안전사고 대응 체계' },
    { key: 's2_3', code: 'S2-3', group: '안전보건', label: '중대재해 예방' },
    { key: 's3_1', code: 'S3-1', group: '인권존중 및 보호', label: '인권 경영체계 구축' },
    { key: 's3_2', code: 'S3-2', group: '인권존중 및 보호', label: '학대예방 및 인권보장' },
    { key: 's3_3', code: 'S3-3', group: '인권존중 및 보호', label: '종사자 감정노동 보호' },
    { key: 's3_4', code: 'S3-4', group: '인권존중 및 보호', label: '인권 모니터링 및 평가' },
    { key: 's3_5', code: 'S3-5', group: '인권존중 및 보호', label: '사회적 불평등 계층 권리증진 및 보호실천' },
    { key: 's4_1', code: 'S4-1', group: '이용자 만족 및 권리', label: '이용자 만족경영 체계구축' },
    { key: 's4_2', code: 'S4-2', group: '이용자 만족 및 권리', label: '편의시설의 적절성' },
    { key: 's4_3', code: 'S4-3', group: '이용자 만족 및 권리', label: '고충처리 대응체계 구축' },
    { key: 's4_4', code: 'S4-4', group: '이용자 만족 및 권리', label: '개인정보 보호 및 비밀보장' },
    { key: 's4_5', code: 'S4-5', group: '이용자 만족 및 권리', label: '사회서비스 사전 고지 및 동의' },
    { key: 's5_1', code: 'S5-1', group: '동반성장 및 지역상생', label: '지역사회 민관협력 파트너쉽' },
    { key: 's5_2', code: 'S5-2', group: '동반성장 및 지역상생', label: '기업 및 지역 단체와의 사회공헌활동' },
    { key: 's5_3', code: 'S5-3', group: '동반성장 및 지역상생', label: '책임감 있는 공급망 관리' },
    // Governance
    { key: 'g1_1', code: 'G1-1', group: 'ESG 관리체계 구축', label: 'ESG 가이드라인 및 정책' },
    { key: 'g1_2', code: 'G1-2', group: 'ESG 관리체계 구축', label: 'ESG 활동의 효율적 관리' },
    { key: 'g2_1', code: 'G2-1', group: '위원회 구성 및 활동', label: '운영위원회의 독립성 및 구성, 활동' },
    { key: 'g2_2', code: 'G2-2', group: '위원회 구성 및 활동', label: '위원회 구성 현황' },
    { key: 'g3_1', code: 'G3-1', group: '이해관계자 참여 및 소통', label: 'ESG 정보 공시' },
    { key: 'g3_2', code: 'G3-2', group: '이해관계자 참여 및 소통', label: '이해관계자 식별 및 소통' },
    { key: 'g3_3', code: 'G3-3', group: '이해관계자 참여 및 소통', label: '자원봉사자 관리' },
    { key: 'g3_4', code: 'G3-4', group: '이해관계자 참여 및 소통', label: '후원자 관리' },
    { key: 'g4_1', code: 'G4-1', group: '청렴윤리', label: '윤리경영 체계구축' },
    { key: 'g4_2', code: 'G4-2', group: '청렴윤리', label: '반부패 예방 및 청렴강화' },
    { key: 'g4_3', code: 'G4-3', group: '청렴윤리', label: '청렴윤리 모니터링 및 평가' },
    { key: 'g4_4', code: 'G4-4', group: '청렴윤리', label: '회계의 투명한 관리' },
    { key: 'g4_5', code: 'G4-5', group: '청렴윤리', label: '법/규제 미준수 및 위반' },
];
