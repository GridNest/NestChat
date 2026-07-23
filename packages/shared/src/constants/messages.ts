export const MESSAGES = {
  en: {
    welcome: 'Hello! Welcome to {botName}. How can I help you today?',
    greeting: 'Hello! 👋\nWelcome to NestChat\nWelcome to {clientName}\n\nPlease choose your preferred language.',
    unknownResponse: "I couldn't find the exact information. Would you like to submit your requirement?",
    inquiryPrompt: "Sure! I'll help you with that. Let me collect some details.",
    inquiryName: "What's your name?",
    inquiryEmail: "What's your email address?",
    inquiryPhone: "What's your phone number?",
    inquiryCountry: "Which country are you from?",
    inquiryState: "Which state are you in?",
    inquiryService: "Which service are you interested in?",
    inquiryDetails: "Please describe your project requirements.",
    inquiryCompany: "What's your company name? (Optional)",
    inquiryComplete: "Thank you! Our team will contact you within 24 hours.",
    inquiryCancelled: "No problem! Feel free to ask if you have any other questions.",
    invalidEmail: "Please enter a valid email address.",
    invalidPhone: "Please enter a valid phone number.",
    requiredField: "This field is required.",
    tryAgain: "Please try again.",
    endChat: "Chat ended. Thank you for visiting!",
    typeMessage: "Type your message...",
    send: "Send",
    end: "End Chat",
  },
  hi: {
    welcome: 'Namaste! {botName} mein aapka swagat hai. Main aapki kaise madad kar sakta hu?',
    greeting: 'Namaste! 👋\nNestChat mein aapka swagat hai\n{clientName} mein aapka swagat hai\n\nKripya apni bhasha chunein.',
    unknownResponse: "Mujhe iski exact information nahi mili. Main aapki requirement register kar sakta hu.",
    inquiryPrompt: "Zaroor! Main aapki isme madad karunga. Mujhe kuch details chahiye.",
    inquiryName: "Aapka naam kya hai?",
    inquiryEmail: "Aapka email address kya hai?",
    inquiryPhone: "Aapka phone number kya hai?",
    inquiryCountry: "Aap kis country se hain?",
    inquiryState: "Aap kis state mein hain?",
    inquiryService: "Aap kis service mein interested hain?",
    inquiryDetails: "Kripya apni project requirements batayein.",
    inquiryCompany: "Aapki company ka naam kya hai? (Optional hai)",
    inquiryComplete: "Dhanyavaad! Hamari team 24 ghante mein aapse contact karegi.",
    inquiryCancelled: "Koi baat nahi! Agar aapki koi aur sawal hai toh puch sakte hain.",
    invalidEmail: "Kripya sahi email address daalein.",
    invalidPhone: "Kripya sahi phone number daalein.",
    requiredField: "Ye field zaroori hai.",
    tryAgain: "Kripya dubara try karein.",
    endChat: "Chat khatam. Visit karne ke liye dhanyavaad!",
    typeMessage: "Apna message likhein...",
    send: "Bhejein",
    end: "Chat Khatam",
  },
} as const;

export type MessageLanguage = keyof typeof MESSAGES;

export function getMessage(lang: MessageLanguage, key: keyof typeof MESSAGES.en, vars?: Record<string, string>): string {
  let message: string = MESSAGES[lang][key];
  if (vars) {
    Object.entries(vars).forEach(([varKey, value]) => {
      message = message.replace(`{${varKey}}`, value);
    });
  }
  return message;
}
