import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, FileText, Route, Sun, Moon } from 'lucide-react';
import { ExploreSection } from './components/ExploreSection';
import { PathwaySection } from './components/PathwaySection';
import { ResumeSection } from './components/ResumeSection';
import { supabase } from './lib/supabase';
import type { Section as SectionType } from './types';

function App() {
  const [activeSection, setActiveSection] = useState<SectionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [hasEnteredName, setHasEnteredName] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [results, setResults] = useState<Record<SectionType, string | null>>({
    explore: null,
    pathway: null,
    resume: null
  });

  const activeSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('users')
            .select('nickname')
            .eq('id', user.id)
            .maybeSingle();
          
          if (error) {
            console.warn('Error fetching user data:', error.message);
            setHasEnteredName(false);
            return;
          }
          
          if (data?.nickname) {
            setUserName(data.nickname);
            setHasEnteredName(true);
          } else {
            console.warn('No user data found for the current user ID.');
            setHasEnteredName(false);
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setHasEnteredName(false);
      }
    };
    
    checkSession();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    if (activeSection && activeSectionRef.current) {
      activeSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [activeSection]);

  const getPromptForSection = (section: SectionType, data: any): string => {
    switch (section) {
      case 'explore':
        return `You are a career advisor. Based on the answers below, suggest 3 career paths. Start with: "Hello ${userName}! " followed by a kind compliment.
          
          Subjects enjoyed at school: ${data.enjoyedSubjects}
          Subjects disliked at school: ${data.dislikedSubjects}
          Hobbies and interests: ${data.hobbies}
          Preferred work environment: ${data.workEnvironment}
          Lifestyle: ${data.lifestyle || 'Not specified'}
          
          For each career, include:
          - Title and short description
          - Estimated U.S. starting salary
          - Required education
          - Recommended study field
          - Where to start learning (platforms/certifications)
          
          Format your response with proper spacing and line breaks. Use bold text for headers.
          If the input is vague or silly, respond with a friendly joke related to careers.`;

      case 'pathway':
        return `You are a career path planner. Based on the user's goal and background, provide practical steps to reach their target career. Start with: "Hello ${userName}! "
          
          Dream Career: ${data.dreamCareer}
          Current Education/Experience: ${data.educationLevel}
          Preferred Learning Format: ${data.learningFormat}
          Self Description: ${data.selfDescription || 'Not specified'}
          
          Include: certifications, education, skills, timeline, and job posting examples.
          Format your response with proper spacing and line breaks. Use bold text for headers.
          Start with a professional compliment. If the response is unclear, respond with a career joke.If response is very vague or incorrect or user trying to be funny=Make their response even funnier`;

      case 'resume':
        return `You are a resume analysis expert. Compare the resume to the job description. Start with: "Hello ${userName}! " followed by a compliment about the experience. Then explain:
          
          Resume Content:
          ${data.resumeText}
          
          Job Description:
          ${data.jobDescription}
          
          Please analyze and format your response with proper spacing and line breaks:
          
          1. What parts match the job
          2. What is missing or weak
          3. Rewrite the full resume to better match the job
          
          Use bold text for section headers. If input is empty or off-topic, respond with a professional career joke.`;

      default:
        throw new Error(`Unknown section: ${section}`);
    }
  };

  const formatResponse = (text: string): string => {
    return text
      .replace(/#{1,6}\s*(.*?)$/gm, '<b>$1</b>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>');
  };

  const handleSubmit = async (section: SectionType, data: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: getPromptForSection(section, data)
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      const formattedResponse = formatResponse(result.choices[0].message.content);

      setResults(prev => ({
        ...prev,
        [section]: formattedResponse
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing your request');
      console.error('API Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSection = (section: SectionType) => {
    switch (section) {
      case 'explore':
        return <ExploreSection onSubmit={(data) => handleSubmit('explore', data)} />;
      case 'pathway':
        return <PathwaySection onSubmit={(data) => handleSubmit('pathway', data)} />;
      case 'resume':
        return <ResumeSection onSubmit={(data) => handleSubmit('resume', data)} />;
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      try {
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email: `${userName.toLowerCase()}@temp.com`,
          password: 'temporary-password-123',
        });

        if (signUpError) throw signUpError;

        if (user) {
          const { error: insertError } = await supabase
            .from('users')
            .insert([{ id: user.id, nickname: userName }]);

          if (insertError) throw insertError;
        }

        setHasEnteredName(true);
      } catch (error) {
        console.error('Error saving user:', error);
        // Continue anyway to not block the user
        setHasEnteredName(true);
      }
    }
  };

  if (!hasEnteredName) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-b from-blue-50 to-white'} flex items-center justify-center px-4`}>
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Welcome to Career Assistant AI</h1>
            <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Let's start by getting to know you</p>
          </div>
          <form onSubmit={handleNameSubmit} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <div className="mb-4">
              <label htmlFor="name" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                What should we call you?
              </label>
              <input
                type="text"
                id="name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="Enter your name or nickname"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-b from-blue-50 to-white'} py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-800'} shadow-lg`}
          >
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>

        <div className="text-center mb-12">
          <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Career Assistant AI</h1>
          <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Welcome, {userName}! Let's explore your career journey together.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div 
            className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1 duration-200`}
            onClick={() => setActiveSection('explore')}
          >
            <div className={`w-16 h-16 ${isDarkMode ? 'bg-gray-700' : 'bg-blue-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Briefcase className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Explore Where You Belong</h3>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Discover career paths that match your interests and skills</p>
          </div>

          <div 
            className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1 duration-200`}
            onClick={() => setActiveSection('pathway')}
          >
            <div className={`w-16 h-16 ${isDarkMode ? 'bg-gray-700' : 'bg-blue-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Route className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Explore My Career Path</h3>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Get a detailed roadmap for your chosen career</p>
          </div>

          <div 
            className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1 duration-200`}
            onClick={() => setActiveSection('resume')}
          >
            <div className={`w-16 h-16 ${isDarkMode ? 'bg-gray-700' : 'bg-blue-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <FileText className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Resume Tailor</h3>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Optimize your resume with AI-powered suggestions</p>
          </div>
        </div>

        {error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {activeSection && (
          <div 
            ref={activeSectionRef}
            className={`mt-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 transition-all duration-500 opacity-100 transform translate-y-0`}
          >
            <div className="mb-6">
              <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {activeSection === 'explore' && 'Explore Where You Belong'}
                {activeSection === 'pathway' && 'Explore My Career Path'}
                {activeSection === 'resume' && 'Resume Tailor'}
              </h2>
            </div>
            
            {renderSection(activeSection)}
            
            {isLoading && (
              <div className="mt-6 text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1533669955142-6a73332af4db?auto=format&fit=crop&w=96&h=96&q=80"
                    alt="Reading animation"
                    className="w-full h-full object-cover rounded-full animate-bounce"
                  />
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping"></div>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Reading and analyzing...
                </p>
              </div>
            )}
            
            {results[activeSection] && (
              <div className={`mt-6 p-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg shadow-sm prose max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
                <div dangerouslySetInnerHTML={{ __html: results[activeSection] || '' }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;