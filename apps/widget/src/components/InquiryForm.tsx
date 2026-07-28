import React, { useState } from 'react';
import { useWidgetStore } from '../store/chatStore';
import { getMessage, isValidEmail, isValidPhone } from '@nestchat/shared';
import { createApiClient } from '../services/api';

const INQUIRY_STEPS = [
  { field: 'name', key: 'inquiryName', required: true },
  { field: 'email', key: 'inquiryEmail', required: true, validate: isValidEmail },
  { field: 'phone', key: 'inquiryPhone', required: true, validate: isValidPhone },
  { field: 'country', key: 'inquiryCountry', required: true },
  { field: 'state', key: 'inquiryState', required: true },
  { field: 'service', key: 'inquiryService', required: true },
  { field: 'details', key: 'inquiryDetails', required: true },
  { field: 'company', key: 'inquiryCompany', required: false },
];

export function InquiryForm() {
  const { language, clientConfig, setInquiryStep, setInquiryData, inquiryStep, inquiryData, setCurrentView, addMessage, sessionId, chatId } = useWidgetStore();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = INQUIRY_STEPS[currentStepIndex];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!input.trim() && currentStep.required) {
      setError(getMessage(language, 'requiredField'));
      return;
    }

    if (currentStep.validate && input.trim()) {
      const isValid = currentStep.validate(input.trim());
      if (!isValid) {
        setError(
          currentStep.field === 'email'
            ? getMessage(language, 'invalidEmail')
            : getMessage(language, 'invalidPhone')
        );
        return;
      }
    }

    const newData = { ...inquiryData, [currentStep.field]: input.trim() };
    setInquiryData(newData);
    setInput('');

    if (currentStepIndex < INQUIRY_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      const nextStep = INQUIRY_STEPS[currentStepIndex + 1];
      setInquiryStep(nextStep.field);
    } else {
      submitInquiry(newData);
    }
  };

  const submitInquiry = async (data: Record<string, string>) => {
    if (!clientConfig) return;
    
    setIsSubmitting(true);
    try {
      addMessage({
        id: `inq_${Date.now()}`,
        sender: 'user',
        content: language === 'hi' ? 'Inquiry submit ho rahi hai...' : 'Submitting your inquiry...',
        timestamp: new Date(),
      });

      const api = createApiClient(clientConfig.client.clientId);
      await api.submitInquiry({
        clientId: clientConfig.client.clientId,
        sessionId,
        chatId: chatId || '',
        ...data,
        language,
      });

      addMessage({
        id: `inq_complete_${Date.now()}`,
        sender: 'bot',
        content: getMessage(language, 'inquiryComplete'),
        timestamp: new Date(),
      });

      setCurrentView('chat');
    } catch (error) {
      console.error('Failed to submit inquiry:', error);
      addMessage({
        id: `inq_error_${Date.now()}`,
        sender: 'bot',
        content: language === 'hi' 
          ? 'Submission mein error aaya. Kripya baad mein try karein.'
          : 'There was an error submitting. Please try again later.',
        timestamp: new Date(),
      });
      setCurrentView('chat');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-100">
        <p className="text-xs sm:text-sm font-medium text-blue-900">
          {getMessage(language, 'inquiryPrompt')}
        </p>
        <p className="text-[11px] text-blue-600 font-semibold mt-1">
          Step {currentStepIndex + 1} of {INQUIRY_STEPS.length}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
            {getMessage(language, currentStep.key as any)}
            {currentStep.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type={currentStep.field === 'email' ? 'email' : 'text'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={(e) => {
              setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 150);
            }}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[44px]"
            autoFocus
            disabled={isSubmitting}
          />
          {error && <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>}
        </div>

        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              addMessage({
                id: `cancel_${Date.now()}`,
                sender: 'user',
                content: language === 'hi' ? 'Cancel' : 'Cancel',
                timestamp: new Date(),
              });
              addMessage({
                id: `cancel_bot_${Date.now()}`,
                sender: 'bot',
                content: getMessage(language, 'inquiryCancelled'),
                timestamp: new Date(),
              });
              setCurrentView('chat');
            }}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all text-xs sm:text-sm font-medium min-h-[44px]"
            disabled={isSubmitting}
          >
            {language === 'hi' ? 'Cancel' : 'Cancel'}
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 text-white rounded-xl active:scale-95 transition-all text-xs sm:text-sm font-medium disabled:opacity-50 min-h-[44px] shadow-sm"
            style={{ backgroundColor: clientConfig?.theme?.primaryColor || '#3B82F6' }}
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (language === 'hi' ? 'Submit ho raha hai...' : 'Submitting...')
              : currentStepIndex < INQUIRY_STEPS.length - 1
                ? language === 'hi' ? 'Aage Badhein' : 'Next'
                : language === 'hi' ? 'Submit Karein' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}

