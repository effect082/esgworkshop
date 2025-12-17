import React from 'react';
import { Download, Printer } from 'lucide-react';

interface Props {
  targetId: string; // The ID of the HTML element to export
  fileName: string;
}

const ExportButtons: React.FC<Props> = ({ targetId, fileName }) => {
  
  const handlePrint = () => {
    const element = document.getElementById(targetId);
    if (!element) return;
    
    // Open a new window for printing specific content
    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) {
      alert("팝업 차단을 해제해주세요.");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>${fileName}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
          <style>
            body { 
              font-family: 'Noto Sans KR', sans-serif; 
              padding: 40px; 
              background-color: white;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="max-w-4xl mx-auto">
            ${element.innerHTML}
          </div>
          <script>
            // Wait for CDN to load slightly
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleWordExport = () => {
    const element = document.getElementById(targetId);
    if (!element) return;

    // HTML header for Word compatibility
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${fileName}</title>
        <style>
          body { font-family: 'Malgun Gothic', sans-serif; font-size: 11pt; } 
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; } 
          td, th { border: 1px solid #000; padding: 5px; }
          h3 { color: #2563EB; font-size: 14pt; margin-top: 20px; }
          h4 { color: #1E40AF; font-size: 12pt; margin-top: 15px; }
          .bg-green-50 { background-color: #f0fdf4; }
          .bg-blue-50 { background-color: #eff6ff; }
          .bg-orange-50 { background-color: #fff7ed; }
        </style>
      </head>
      <body>
    `;
    const footer = "</body></html>";
    
    // Get HTML content - we strip some Tailwind classes that might look messy in raw Word but simple styling works
    const html = header + element.innerHTML + footer;

    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
    });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex gap-2 print:hidden">
      <button 
        onClick={handlePrint}
        className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200 transition-colors border border-gray-300"
      >
        <Printer size={14} />
        PDF(PAD) 다운로드
      </button>
      <button 
        onClick={handleWordExport}
        className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors border border-blue-200"
      >
        <Download size={14} />
        Word 다운로드
      </button>
    </div>
  );
};

export default ExportButtons;