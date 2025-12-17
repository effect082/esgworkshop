import { GoogleGenAI } from "@google/genai";
import { SwotData, Step, DiagnosisDetail, INDICATORS_META, SwotAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper function to robustly clean and parse JSON from AI responses
const cleanAndParseJSON = (text: string): any => {
    if (!text) return null;
    
    // 1. Remove Markdown code blocks (case insensitive)
    let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    // 2. Find start of JSON
    const firstOpenBrace = clean.indexOf('{');
    const firstOpenBracket = clean.indexOf('[');
    
    let startIndex = -1;
    let isObject = false;

    if (firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)) {
        startIndex = firstOpenBrace;
        isObject = true;
    } else if (firstOpenBracket !== -1) {
        startIndex = firstOpenBracket;
        isObject = false;
    } else {
        // No JSON found
        return null;
    }

    // 3. Find matching closing character using stack to handle nested structures
    // This ignores trailing text/garbage which often causes "Unexpected non-whitespace character" errors
    let balance = 0;
    let endIndex = -1;
    
    for (let i = startIndex; i < clean.length; i++) {
        const char = clean[i];
        if (isObject) {
            if (char === '{') balance++;
            else if (char === '}') balance--;
        } else {
            if (char === '[') balance++;
            else if (char === ']') balance--;
        }

        if (balance === 0) {
            endIndex = i;
            break;
        }
    }
    
    if (endIndex !== -1) {
        const jsonStr = clean.substring(startIndex, endIndex + 1);
        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error("JSON Parse Error (Stack Method):", e);
            // If strict parsing fails, we fall through to try parsing the whole cleaned string
            // as a backup (though unlikely to succeed if stack failed)
        }
    }
    
    // Fallback: Try parsing the whole cleaned string
    try {
        return JSON.parse(clean);
    } catch (e) {
        console.error("JSON Parse Error (Fallback): on text:", clean);
        throw e;
    }
};

export const generateSwotAnalysis = async (swotData: SwotData, diagnosisAnalysis: string = ''): Promise<SwotAnalysisResult | null> => {
    if (!process.env.API_KEY) return null;

    const context = `
    Strengths: ${swotData.strengths.map(i => i.text).join(', ')}
    Weaknesses: ${swotData.weaknesses.map(i => i.text).join(', ')}
    Opportunities: ${swotData.opportunities.map(i => i.text).join(', ')}
    Threats: ${swotData.threats.map(i => i.text).join(', ')}

    [ESG Self-Diagnosis Results & Suggestions]
    ${diagnosisAnalysis || "No specific diagnosis analysis provided. Proceed based on SWOT items."}
    `;

    const prompt = `
    Act as an ESG strategy consultant for a Social Welfare Center in Korea.
    Analyze the provided SWOT data and the ESG Self-Diagnosis Results.

    Task 1: Summarize and Consolidate (S, W, O, T)
    - Summarize the Strengths, Weaknesses, Opportunities, and Threats into exactly 5 key representative points for each category.
    - **CRITICAL REQUIREMENT:** Each point must be written in "개조식" (concise noun-ending phrase).
    - **CRITICAL REQUIREMENT:** Each point must contain strictly ONE clear meaning. Do not use conjunctions to combine unrelated ideas.

    Task 2: Generate SWOT Matrix Strategies (SO, WO, ST, WT)
    - Derive specific strategies based on the summarized factors AND the provided 'ESG Self-Diagnosis Results & Suggestions'.
    - **INTEGRATION INSTRUCTION:** The strategies MUST explicitly reflect the suggestions and insights from the diagnosis (e.g., if the diagnosis suggests improving Governance transparency, include a strategy for it in the appropriate quadrant).
    
    - SO (Strength-Opportunity): "우선사업 전략"
    - WO (Weakness-Opportunity): "우선보완 전략"
    - ST (Strength-Threat): "RISK 포함 전략"
    - WT (Weakness-Threat): "장기보완 전략"
    
    - **CRITICAL FORMATTING:** Each strategy string must be in the format: "KEYWORD: EXPLANATION".
      - **KEYWORD:** A short, representative noun phrase (개조식) summarizing the strategy (e.g., "특성화 프로그램 운영").
      - **EXPLANATION:** A single, clear, action-oriented sentence explaining the detail. (e.g., "직원 전문성을 활용하여...").

    - **LANGUAGE:** MUST BE KOREAN (한국어). Do not output English.

    Return ONLY a valid JSON object with the following structure:
    {
      "summarized": {
        "strengths": ["...", ...],
        "weaknesses": ["...", ...],
        "opportunities": ["...", ...],
        "threats": ["...", ...]
      },
      "matrix": {
        "so": ["Strategy 1", ...],
        "wo": ["Strategy 1", ...],
        "st": ["Strategy 1", ...],
        "wt": ["Strategy 1", ...]
      }
    }
    
    Context:
    ${context}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json" }
        });

        const text = response.text;
        if (!text) return null;
        return cleanAndParseJSON(text) as SwotAnalysisResult;
    } catch (error) {
        console.error("SWOT Analysis Error:", error);
        return null;
    }
};

export const generateDiagnosisAnalysis = async (details: DiagnosisDetail): Promise<string> => {
  if (!process.env.API_KEY) return "API Key not configured.";

  // Format the indicators and scores for the prompt
  const scoresText = INDICATORS_META.map(ind => 
    `${ind.code} (${ind.label}): ${details[ind.key as keyof DiagnosisDetail]}`
  ).join('\n');

  const prompt = `
    Act as a professional ESG consultant for a social welfare center in Korea.
    Analyze the following self-diagnosis results (Scores are on a 4.0 scale).

    Diagnosis Data (Max Score: 4.0):
    ${scoresText}

    Please provide a comprehensive evaluation and strategic suggestions for their Mid-to-Long Term Development Plan.
    
    **OUTPUT FORMAT INSTRUCTION:**
    - Provide the response in valid **HTML** format (HTML Fragment only).
    - **DO NOT** include \`<html>\`, \`<head>\`, \`<body>\`, or markdown code block markers (like \`\`\`html).
    - Start directly with tags like \`<h3>\`, \`<h4>\`, \`<p>\`.
    - Style the content to be clean and professional for a report.
    - **LANGUAGE:** MUST BE KOREAN (한국어).

    Structure:
    
    <h3>1. 종합 평가 (Comprehensive Evaluation)</h3>
    <p>Summarize the current ESG maturity level based on the scores (4.0 basis). Identify the strongest and weakest areas.</p>

    <h3>2. 분야별 제언 (Strategic Suggestions by Category)</h3>
    <h4>환경 (Environment)</h4>
    <p>Analysis and practical actions for low scoring indicators in E.</p>
    
    <h4>사회 (Social)</h4>
    <p>Analysis and practical actions for low scoring indicators in S.</p>
    
    <h4>지배구조 (Governance)</h4>
    <p>Analysis and practical actions for low scoring indicators in G.</p>

    <h3>3. 중장기 발전계획 수립 가이드 (Roadmap Guide)</h3>
    <ul>
      <li><strong>1차년도 중점:</strong> Suggest 1 core priority task.</li>
      <li><strong>장기 목표:</strong> Suggest 1 strategic goal.</li>
    </ul>

    Keep the tone professional, encouraging, and specific to a social welfare center context.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    let cleanText = response.text || "Analysis could not be generated.";
    // Aggressively strip Markdown code blocks and common artifacts
    cleanText = cleanText
        .replace(/```html/gi, '')
        .replace(/```/g, '')
        .replace(/<!DOCTYPE html>/gi, '')
        .replace(/<html>/gi, '')
        .replace(/<\/html>/gi, '')
        .replace(/<body>/gi, '')
        .replace(/<\/body>/gi, '')
        .trim();
        
    return cleanText;
  } catch (error) {
    console.error("AI Error:", error);
    return "<p>분석을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.</p>";
  }
};

export const generateAiSuggestions = async (context: string, type: 'SWOT' | 'IDEA' | 'VISION'): Promise<string> => {
  if (!process.env.API_KEY) return "API Key not configured.";

  let prompt = "";
  
  if (type === 'SWOT') {
    prompt = `
      Act as an ESG consultant for a social welfare center.
      Based on the following context about the center, suggest 2 key Strengths, 2 Weaknesses, 2 Opportunities, and 2 Threats related to ESG management.
      Context: ${context}
      
      **LANGUAGE:** KOREAN (한국어).
      Return the answer as a bulleted list.
    `;
  } else if (type === 'IDEA') {
    prompt = `
      Act as an ESG consultant. Suggest 3 creative and practical ESG action ideas for a social welfare center based on this context: ${context}.
      **LANGUAGE:** KOREAN (한국어).
    `;
  } else if (type === 'VISION') {
    prompt = `
      Act as an ESG consultant. Suggest a catchy and inspiring ESG Vision Statement for a social welfare center that focuses on: ${context}.
      Keep it under 20 words.
      **LANGUAGE:** KOREAN (한국어).
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No suggestion generated.";
  } catch (error) {
    console.error("AI Error:", error);
    return "제안을 생성하는 데 실패했습니다.";
  }
};

export const analyzeSwotToStrategy = async (
    swot: SwotData, 
    mission: string, 
    vision: string, 
    diagnosisAnalysis: string,
    swotTextOverride: string = ''
): Promise<any> => {
    if (!process.env.API_KEY) return null;

    // Consolidate all available context
    // If swotTextOverride is provided (via upload), use it. Otherwise use the structured swot data.
    const swotAnalysisContext = swotTextOverride 
        ? swotTextOverride 
        : (swot.analysis ? JSON.stringify(swot.analysis.matrix) : "SWOT Matrix not fully generated yet.");
    
    const context = `
      [Institution Mission]: ${mission}
      [Institution Vision]: ${vision}
      
      [ESG Self-Diagnosis Results & AI Suggestions (HTML Removed for Context)]:
      ${diagnosisAnalysis.replace(/<[^>]*>?/gm, '')} 

      [SWOT Analysis Results (Matrix Strategies)]:
      ${swotAnalysisContext}
    `;

    const prompt = `
      Act as a Chief Strategy Officer for a social welfare center.
      Create comprehensive "Strategic Directions" based on the provided integrated analysis data.

      Data Source to Integrate:
      1. Institution Mission & Vision
      2. ESG Self-Diagnosis Results (Weaknesses/Strengths)
      3. SWOT Matrix Strategies (SO, ST, WO, WT)

      Task:
      Generate **3 Distinct Strategic Options** (Version 1, Version 2, Version 3).
      For EACH option, derive 1 key Strategic Direction (Strategy) and 5 Specific Tasks (Tasks) for each category: Environment (E), Social (S), and Governance (G).

      **CRITICAL WRITING RULES (Strict "Gae-jo-sik"):**
      1. **ABSOLUTELY NO CONJUNCTIONS:** Do NOT use '및', '그리고', '와/과', or commas to combine multiple ideas in one sentence.
      2. **Single Meaning Per Task:** Each task must be a short, single action item.
         - BAD: "환경경영 체계 구축 및 에너지 절감 실천" (Contains '및')
         - GOOD: "환경경영 체계 구축"
         - GOOD: "에너지 절감 실천"
      3. **Style:** Short, punchy, noun-ending phrases. Professional and attractive.
      4. **Task Count:** Exactly 5 tasks per category per version.

      **RETURN JSON ONLY:**
      {
        "candidates": [
          {
            "versionName": "Version 1 (Keyword)",
            "environment": { "strategy": "...", "tasks": ["...", "...", "...", "...", "..."] },
            "social": { "strategy": "...", "tasks": ["...", "...", "...", "...", "..."] },
            "governance": { "strategy": "...", "tasks": ["...", "...", "...", "...", "..."] }
          },
          {
            "versionName": "Version 2 (Keyword)",
             ...
          },
          {
            "versionName": "Version 3 (Keyword)",
             ...
          }
        ]
      }

      **LANGUAGE:** KOREAN (한국어).

      Context Data:
      ${context}
    `;

    try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [{ text: prompt }] },
          config: { responseMimeType: "application/json" }
        });
        
        let text = response.text;
        if (!text) return null;
        
        return cleanAndParseJSON(text);
      } catch (error) {
        console.error("AI Strategy Generation Error:", error);
        return null;
      }
}

export const generateRoadmap = async (strategyText: string, swotText: string): Promise<any> => {
    if (!process.env.API_KEY) return null;

    const prompt = `
      Act as an ESG Strategy Specialist for a Social Welfare Center.
      
      Based on the provided "ESG Strategy & Tasks" and "SWOT Analysis" contexts, generate a detailed mid-to-long term roadmap.

      **Input Context:**
      1. **ESG Strategy & Tasks:** \n${strategyText}\n
      2. **SWOT Analysis:** \n${swotText}\n

      **Task:**
      Create a roadmap for 3 Categories (E, S, G) across 3 Phases:
      - Phase 1: '도입기 (2026년)'
      - Phase 2: '확산기 (2027년 ~ 2028년)'
      - Phase 3: '정착기 (2029년 ~ 2030년)'

      For EACH Category and EACH Phase, provide:
      1. **Goal (추진 목표):** One clear, strategic goal statement.
      2. **Tasks (세부 실천과제):** 2~3 specific, actionable tasks.

      **Language:** Korean (한국어)
      
      **Return JSON ONLY:**
      [
        {
           "category": "E",
           "year": "도입기 (2026년)",
           "goal": "Goal text here...",
           "tasks": ["Task 1...", "Task 2..."]
        },
        ... (Repeat for E-Phase2, E-Phase3, S-Phase1... G-Phase3)
      ]
      
      Total 9 objects in the array (3 categories * 3 phases).
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json" }
        });
        
        let text = response.text;
        if (!text) return null;
        
        return cleanAndParseJSON(text);
    } catch (error) {
        console.error("Roadmap Generation Error:", error);
        return null;
    }
};

export const parseUploadedFile = async (
    fileBase64: string, 
    mimeType: string, 
    step: Step,
    parseMode: 'DEFAULT' | 'TEXT_ONLY' = 'DEFAULT'
): Promise<any> => {
    if (!process.env.API_KEY) throw new Error("API Key missing");

    let prompt = "";
    let jsonSchema = "";

    // If parseMode is TEXT_ONLY, we just want the AI to extract relevant text content
    if (parseMode === 'TEXT_ONLY') {
        prompt = `
            Analyze this uploaded document.
            Extract all the relevant text content clearly.
            Ignore visual artifacts, headers, or footers that are not part of the main content.
            Return the content as a plain text string field 'text'.
            **LANGUAGE:** Content language should be preserved, but instructions are English.
        `;
        jsonSchema = `JSON Schema: { text: string }`;
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType, data: fileBase64 } },
                        { text: `${prompt} \n ${jsonSchema} \n Respond with VALID JSON only.` }
                    ]
                },
                config: { responseMimeType: "application/json" }
            });
            const text = response.text;
            if (!text) throw new Error("No response from AI");
            return cleanAndParseJSON(text);
        } catch (error) {
             console.error("File Parse Error:", error);
             throw error;
        }
    }

    // Default Structured Parsing logic
    switch (step) {
        case Step.DIAGNOSIS:
            prompt = `
              Analyze this ESG diagnosis document.
              Extract scores (scale 0.0 to 4.0) for the 38 specific ESG indicators.
              If exact scores are missing, infer them from the status (e.g., '양호'=3.5, '보통'=2.5, '미흡'=1.5) or text content.
              
              Indicators to extract:
              Environment (5): E1-1, E2-1, E3-1, E4-1, E5-1
              Social (20): S1-1 to S1-4, S2-1 to S2-3, S3-1 to S3-5, S4-1 to S4-5, S5-1 to S5-3
              Governance (13): G1-1 to G1-2, G2-1 to G2-2, G3-1 to G3-4, G4-1 to G4-5

              Also calculate the average scores for main categories: environment, social, governance (convert to 100-point scale for main category averages).
            `;
            jsonSchema = `
              JSON Schema: { 
                environment: number, 
                social: number, 
                governance: number,
                details: {
                  e1_1: number, e2_1: number, e3_1: number, e4_1: number, e5_1: number,
                  s1_1: number, s1_2: number, s1_3: number, s1_4: number,
                  s2_1: number, s2_2: number, s2_3: number,
                  s3_1: number, s3_2: number, s3_3: number, s3_4: number, s3_5: number,
                  s4_1: number, s4_2: number, s4_3: number, s4_4: number, s4_5: number,
                  s5_1: number, s5_2: number, s5_3: number,
                  g1_1: number, g1_2: number,
                  g2_1: number, g2_2: number,
                  g3_1: number, g3_2: number, g3_3: number, g3_4: number,
                  g4_1: number, g4_2: number, g4_3: number, g4_4: number, g4_5: number
                }
              }
            `;
            break;
        case Step.SWOT:
            prompt = "Analyze this document. Extract SWOT items. Return JSON.";
            jsonSchema = "JSON Schema: { strengths: string[], weaknesses: string[], opportunities: string[], threats: string[] }";
            break;
        case Step.STRATEGY:
            prompt = `
              Analyze this uploaded document (CSV or Table Image).
              Structure:
              - Columns: Category (Row Header), Environment, Social, Governance.
              - Rows: Strategy, Task 1, Task 2, Task 3, Task 4, Task 5.
              
              Extract the content for:
              - Environment Strategy and 5 Tasks
              - Social Strategy and 5 Tasks
              - Governance Strategy and 5 Tasks
              
              **IGNORE Mission and Vision.**
              
              The input content is in Korean. Preserve the Korean text exactly.
            `;
            jsonSchema = "JSON Schema: { strategies: { environment: { strategy: string, tasks: string[] }, social: { strategy: string, tasks: string[] }, governance: { strategy: string, tasks: string[] } } }";
            break;
        case Step.ACTION_IDEAS:
            prompt = "Analyze this document. Extract the 'As-Is' (Current Status), 'To-Be' (Future Image), and 'Idea' (Solution) for Environment, Social, and Governance categories. Return JSON.";
            jsonSchema = "JSON Schema: { environment: { asIs: string, toBe: string, idea: string }, social: { asIs: string, toBe: string, idea: string }, governance: { asIs: string, toBe: string, idea: string } }";
            break;
        case Step.ROADMAP:
            prompt = "Analyze this document. Extract roadmap tasks. Map them to phases: '도입기 (2026년)', '확산기 (2027년 ~ 2028년)', '정착기 (2029년 ~ 2030년)'. Return JSON array of objects.";
            jsonSchema = "JSON Schema: [{ category: 'E'|'S'|'G', task: string, year: '도입기 (2026년)'|'확산기 (2027년 ~ 2028년)'|'정착기 (2029년 ~ 2030년)' }]";
            break;
        default:
            return null;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: fileBase64 } },
                    { text: `${prompt} \n ${jsonSchema} \n Respond with VALID JSON only. Do not use Markdown code blocks.` }
                ]
            },
             config: {
                responseMimeType: "application/json",
             }
        });
        
        const text = response.text;
        if (!text) throw new Error("No response from AI");
        return cleanAndParseJSON(text);
    } catch (error) {
        console.error("File Parse Error:", error);
        throw error;
    }
}