'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Check } from 'lucide-react';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  filename: string;
}

export function PdfPreviewModal({ isOpen, onClose, pdfUrl, filename }: PdfPreviewModalProps) {
  if (!isOpen || !pdfUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = filename;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[11000] flex items-center justify-center p-4 sm:p-8">
        <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-4xl h-[85vh] rounded-[24px] shadow-2xl border border-white/50 overflow-hidden flex flex-col"
        >
            {/* HEADER */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                        <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Document Preview</h3>
                        <p className="text-xs text-gray-500 font-medium">{filename}</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border-none outline-none cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* PDF VIEWER (IFRAME) */}
            <div className="flex-1 bg-gray-100 relative">
                <iframe 
                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                    className="w-full h-full border-none"
                    title="PDF Preview"
                />
            </div>

            {/* FOOTER */}
            <div className="p-5 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
                <button 
                    onClick={onClose}
                    className="px-6 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors bg-transparent border-none outline-none cursor-pointer"
                >
                    Close Preview
                </button>
                <button 
                    onClick={handleDownload}
                    className="px-8 py-2.5 text-xs font-bold text-white bg-gray-900 hover:bg-black rounded-xl shadow-lg shadow-gray-200 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 border-none outline-none cursor-pointer"
                >
                    <Download className="w-4 h-4" /> Download PDF
                </button>
            </div>
        </motion.div>
    </div>
  );
}