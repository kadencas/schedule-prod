"use client"
import React, { useState } from 'react';

// --- SVG Icon Components ---
const Sparkles = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m12 3-1.9 4.8-4.8 1.9 4.8 1.9 1.9 4.8 1.9-4.8 4.8-1.9-4.8-1.9Z"/><path d="M5 22v-5"/><path d="M19 22v-5"/><path d="M22 17h-5"/><path d="M7 17H2"/>
    </svg>
);

const AlertTriangle = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
    </svg>
);

export default function App() {
  // --- STATE MANAGEMENT ---
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'processing', 'success', 'error'
  const [generatedShift, setGeneratedShift] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // --- HANDLER FUNCTIONS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setStatus('error');
      setErrorMessage('Please describe the shift.');
      return;
    }

    setStatus('processing');
    setGeneratedShift(null);
    setErrorMessage('');

    try {
      // This is the actual fetch call to our new API route
      const response = await fetch('/api/upload-schedeule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'An error occurred during processing.');
      }
      
      setStatus('success');
      setGeneratedShift(result);

    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message);
      console.error("Generation failed:", error);
    }
  };

  const isButtonDisabled = !prompt || status === 'processing';

  // --- RENDER ---
  return (
    <div className="bg-slate-50 font-sans flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-800">Smart Scheduler</h1>
            <p className="text-slate-500 mt-2">Describe a shift using natural language, and the AI will create it.</p>
          </div>

          <div className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Text Input */}
              <div>
                <label htmlFor="shift-description" className="block text-sm font-medium text-slate-700 mb-1">
                  Shift Description
                </label>
                <textarea
                  id="shift-description"
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Roberta B. from 9am to 5pm next Monday"
                  className="block w-full px-4 py-2 text-slate-900 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  disabled={status === 'processing'}
                />
                <p className="text-xs text-slate-400 mt-2">Try things like "tomorrow", "August 1st", "every Tuesday until September", etc.</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isButtonDisabled}
                className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all"
              >
                {status === 'processing' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                    <>
                        <Sparkles className="-ml-1 mr-2 h-5 w-5" />
                        Generate Shift
                    </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Error Message */}
        {status === 'error' && errorMessage && (
          <div className="mt-4 p-4 rounded-md flex items-start space-x-3 bg-red-50 border border-red-300">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800">{errorMessage}</p>
          </div>
        )}
        
        {/* API Response Display */}
        {generatedShift && (
            <div className="mt-6">
                <div className="bg-slate-800 text-white rounded-lg">
                    <div className="bg-slate-900/50 rounded-t-lg p-4">
                        <h3 className="text-lg font-medium text-slate-100">Generated Shift JSON</h3>
                    </div>
                    <div className="p-4">
                        <pre className="text-sm whitespace-pre-wrap break-all">
                            {JSON.stringify(generatedShift, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}