import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface ExploreSectionProps {
  onSubmit: (data: any) => void;
}

export const ExploreSection: React.FC<ExploreSectionProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    enjoyedSubjects: '',
    dislikedSubjects: '',
    hobbies: '',
    workEnvironment: '',
    lifestyle: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const getLabel = (key: string): string => {
    switch (key) {
      case 'enjoyedSubjects':
        return 'Subjects Enjoyed at School';
      case 'dislikedSubjects':
        return 'Subjects Disliked at School';
      case 'workEnvironment':
        return 'Preferred Work Environment';
      case 'lifestyle':
        return 'Lifestyle (Optional)';
      default:
        return key.charAt(0).toUpperCase() + key.slice(1);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {Object.entries(formData).map(([key, value]) => (
          <div key={key}>
            <label className="block text-sm font-medium dark:text-gray-200 text-gray-700 mb-1">
              {getLabel(key)}
            </label>
            <textarea
              name={key}
              value={value}
              onChange={handleChange}
              required={key !== 'lifestyle'}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              rows={3}
              placeholder={`Enter your ${key.toLowerCase()}...`}
            />
          </div>
        ))}
      </div>
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <Send size={20} />
        <span>Submit</span>
      </button>
    </form>
  );
};