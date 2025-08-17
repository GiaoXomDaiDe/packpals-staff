
import { Download, X } from 'lucide-react';
import React, { useEffect } from 'react';

interface PdfViewerProps {
  pdfUrl: string;
  onClose: () => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfUrl, onClose }) => {
  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl max-h-full w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">PDF Viewer</h3>
          <div className="flex items-center space-x-2">
            {/* Download Button */}
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Download PDF"
            >
              <Download className="w-5 h-5" />
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Content with iframe */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          <iframe
            src={`${pdfUrl}#view=FitH&toolbar=1&navpanes=1&scrollbar=1`}
            width="100%"
            height="100%"
            title="PDF Document"
            className="border-0"
            style={{ minHeight: '70vh' }}
            onError={() => {
              console.error('PDF iframe failed to load');
            }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center p-4 border-t bg-gray-50">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>📄 PDF Document Viewer</span>
            <span>•</span>
            <span>Use browser controls to navigate</span>
            <span>•</span>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Open in new tab
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
