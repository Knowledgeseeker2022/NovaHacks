import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Send } from 'lucide-react';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js`;

interface ResumeSectionProps {
  onSubmit: (data: any) => void;
}

export const ResumeSection: React.FC<ResumeSectionProps> = ({ onSubmit }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      let text = '';
      
      if (file.type === 'application/pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const textContent = [];
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map((item: any) => item.str).join(' ');
            textContent.push(pageText);
          }
          
          text = textContent.join('\n');
        } catch (err) {
          setError(`Error processing PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setIsProcessing(false);
          return;
        }
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        text = result.value;
      } else if (file.type.startsWith('image/')) {
        const worker = await createWorker();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const { data: { text: ocrText } } = await worker.recognize(file);
        await worker.terminate();
        text = ocrText;
      } else if (file.type === 'text/plain') {
        text = await file.text();
      }

      setFileContent(text);
    } catch (err) {
      setError(`Error processing file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFileName(file.name);
      await processFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      resumeText: fileContent,
      jobDescription
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        {...getRootProps()}
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors dark:border-gray-600 dark:hover:border-blue-400"
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {isDragActive
            ? "Drop the file here..."
            : "Drag 'n' drop your resume, or click to select"}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Supports PDF, DOCX, JPG, PNG, and TXT
        </p>
        {fileName && (
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-medium">{fileName}</p>
        )}
        {isProcessing && (
          <div className="mt-4">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"></div>
            <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">Processing file...</p>
          </div>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Job Description
        </label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          rows={6}
          placeholder="Paste the job description here..."
          required
        />
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!fileContent || !jobDescription || isProcessing}
      >
        <Send size={20} />
        <span>Analyze Resume</span>
      </button>
    </form>
  );
};