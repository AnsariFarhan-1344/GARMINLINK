import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  X, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { useGaadiSahayak } from '../../context/GaadiSahayakContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLogistics } from '../../context/LogisticsContext';
import { useUserLocation } from '../../context/LocationContext';
import { SupportedLanguage } from '../../types';
import { 
  AssistantLanguage, 
  ExtractedCargoRequest, 
  RecommendationResult, 
  RecommendedVehicleCard, 
  AssistantChatMessage 
} from '../../types/assistant';
import { 
  extractCargoRequestWithAssistant, 
  getFollowUpKeyAndParams 
} from '../../services/voiceAssistantService';
import { 
  recommendVehiclesForRequest, 
  VEHICLE_TYPE_LABELS, 
  DRIVER_NAMES_LOCALIZED 
} from '../../services/assistantMatcher';

interface GaadiSahayakModalProps {
  onNavigateTab?: (tab: any) => void;
}

export const GaadiSahayakModal: React.FC<GaadiSahayakModalProps> = ({ onNavigateTab }) => {
  const { isOpen, closeAssistant, initialPromptText, triggerBookingWithVehicle } = useGaadiSahayak();
  const { language, setLanguage, t, formatNumber } = useLanguage();
  const { vehicles, returnTrips } = useLogistics();
  const { userLocation, locationName } = useUserLocation();

  // Speech Recognition support check
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  });
  const [isListening, setIsListening] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOfflineFallbackActive, setIsOfflineFallbackActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Conversation history: stores message KEYS and PARAMETERS, not static text
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  // Partial ongoing state for multi-turn follow-ups
  const [ongoingCargoState, setOngoingCargoState] = useState<Partial<ExtractedCargoRequest> | null>(null);
  // Current pending recommendation waiting for voice confirmation
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    request: ExtractedCargoRequest;
    card: RecommendedVehicleCard;
  } | null>(null);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveTranscript, isLoading]);

  // Voice lookup helper with fallback hierarchy: mr -> hi -> en
  const getVoiceForLanguage = useCallback((targetLang: SupportedLanguage) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return { voice: null, langCode: 'en-IN', needsNotice: false };
    }

    const voices = window.speechSynthesis.getVoices();
    const primaryCode = targetLang === 'mr' ? 'mr-IN' : targetLang === 'hi' ? 'hi-IN' : 'en-IN';

    // 1. Direct or prefix match for target language
    const directVoice = voices.find(v => {
      const l = v.lang.toLowerCase().replace('_', '-');
      return l.startsWith(targetLang) || l.startsWith(primaryCode.toLowerCase());
    });

    if (directVoice) {
      return { voice: directVoice, langCode: primaryCode, needsNotice: false };
    }

    // 2. If Marathi is selected but no mr voice, fallback to Hindi (hi-IN)
    if (targetLang === 'mr') {
      const hiVoice = voices.find(v => {
        const l = v.lang.toLowerCase().replace('_', '-');
        return l.startsWith('hi');
      });
      if (hiVoice) {
        return { voice: hiVoice, langCode: 'hi-IN', needsNotice: true };
      }
    }

    // 3. Fallback to English (en-IN or en)
    const enVoice = voices.find(v => {
      const l = v.lang.toLowerCase().replace('_', '-');
      return l.startsWith('en');
    });

    return {
      voice: enVoice || null,
      langCode: enVoice ? 'en-IN' : primaryCode,
      needsNotice: targetLang !== 'en'
    };
  }, []);

  // Listen to voiceschanged event for late-loading browser voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const handleVoicesChanged = () => {
      const { needsNotice } = getVoiceForLanguage(language);
      if (needsNotice) {
        setVoiceNotice(t('assistant_voice_not_available'));
      } else {
        setVoiceNotice(null);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, [language, getVoiceForLanguage, t]);

  // Resolve localized message parameters dynamically at display time
  const resolveParams = useCallback((params?: Record<string, string | number>) => {
    if (!params) return {};
    const resolved: Record<string, string | number> = { ...params };

    // Localize town name
    const townVal = params.town_key || params.town;
    if (townVal && typeof townVal === 'string') {
      const townKey = `town_${townVal}`;
      resolved.town = t(townKey, townVal);
    }

    // Localize product name
    const prodVal = params.product_key || params.product;
    if (prodVal && typeof prodVal === 'string') {
      const prodKey = `prod_${prodVal.toLowerCase()}`;
      resolved.product = t(prodKey, prodVal);
    }

    // Localize vehicle type
    if (params.vehicle_key && typeof params.vehicle_key === 'string') {
      resolved.vehicle = VEHICLE_TYPE_LABELS[params.vehicle_key]?.[language] || params.vehicle || params.vehicle_key;
    }

    // Localize driver name
    if (params.driver && typeof params.driver === 'string') {
      resolved.driver = DRIVER_NAMES_LOCALIZED[params.driver]?.[language] || params.driver;
    }

    return resolved;
  }, [language, t]);

  // Render chat message text dynamically from keys using current language
  const renderMessageText = useCallback((msg: AssistantChatMessage): string => {
    if (msg.sender === 'user') {
      return msg.userText || msg.text || '';
    }
    if (msg.key) {
      return t(msg.key, resolveParams(msg.params));
    }
    return msg.text || '';
  }, [t, resolveParams]);

  // Spoken reply: speaks message in the currently selected language
  const speakMessage = useCallback((msg: AssistantChatMessage, targetLang?: SupportedLanguage) => {
    if (isVoiceMuted || typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    const lang = targetLang || language;
    const textToSpeak = msg.sender === 'user' 
      ? (msg.userText || msg.text || '') 
      : t(msg.key || '', resolveParams(msg.params));

    if (!textToSpeak) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const { voice, langCode, needsNotice } = getVoiceForLanguage(lang);

      utterance.lang = langCode;
      utterance.rate = 0.95;
      if (voice) {
        utterance.voice = voice;
      }

      if (needsNotice) {
        setVoiceNotice(t('assistant_voice_not_available'));
      } else {
        setVoiceNotice(null);
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[SpeechSynthesis error]:', e);
    }
  }, [isVoiceMuted, language, t, resolveParams, getVoiceForLanguage]);

  // Language switch handler: updates app and assistant language in sync, re-reads latest assistant message
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);

    const { needsNotice } = getVoiceForLanguage(newLang);
    if (needsNotice) {
      setVoiceNotice(t('assistant_voice_not_available'));
    } else {
      setVoiceNotice(null);
    }

    // Re-speak latest assistant message in the newly selected language
    const lastAssistantMsg = [...messages].reverse().find(m => m.sender === 'assistant');
    if (lastAssistantMsg) {
      speakMessage(lastAssistantMsg, newLang);
    }
  };

  // Handle Initial Prompt or Greeting on open
  useEffect(() => {
    if (isOpen && initialPromptText !== undefined && initialPromptText.trim().length > 0) {
      handleProcessUserText(initialPromptText.trim());
    } else if (isOpen && messages.length === 0) {
      const greetingMsg: AssistantChatMessage = {
        id: `msg-greeting-${Date.now()}`,
        sender: 'assistant',
        key: 'assistant_greeting',
        params: {},
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([greetingMsg]);
      speakMessage(greetingMsg, language);
    }
  }, [isOpen, initialPromptText]);

  // Keyboard shortcut: Escape to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeAssistant();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeAssistant]);

  // Cancel speech synthesis on modal close or unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Voice confirmation detection (haan / ho / yes / book kar do / करा / confirm)
  const isPositiveConfirmation = (text: string): boolean => {
    const lower = text.toLowerCase().trim();
    const positiveTokens = [
      'haan', 'han', 'ha', 'हाँ', 'हां', 'ho', 'हो', 'होय', 'yes', 'yeah', 
      'kar do', 'karo', 'kara', 'करा', 'book kar do', 'book karo', 'confirm', 
      'booking karun', 'chale ga', 'theek hai', 'thik hai', 'chalel', 'booking kara'
    ];
    return positiveTokens.some(tok => lower.includes(tok));
  };

  const isNegativeConfirmation = (text: string): boolean => {
    const lower = text.toLowerCase().trim();
    const negativeTokens = ['nahi', 'नहीं', 'नको', 'no', 'cancel', 'radd', 'रद्द', 'wait', 'थांबा'];
    return negativeTokens.some(tok => lower.includes(tok));
  };

  // Main processing pipeline for user input (voice or text)
  const handleProcessUserText = async (userInput: string) => {
    const trimmed = userInput.trim();
    if (!trimmed) return;

    setErrorMessage(null);
    setLiveTranscript('');

    // Store user message text
    const userMsg: AssistantChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      userText: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setTextInput('');

    // Check if user is responding to a pending booking confirmation question
    if (pendingConfirmation) {
      if (isPositiveConfirmation(trimmed)) {
        const confirmMsg: AssistantChatMessage = {
          id: `msg-asst-${Date.now()}`,
          sender: 'assistant',
          key: 'assistant_booking_confirmed',
          params: {},
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          confirmedVehicle: pendingConfirmation.card
        };

        setMessages(prev => [...prev, confirmMsg]);
        speakMessage(confirmMsg);

        const cardToBook = pendingConfirmation.card;
        const reqToBook = pendingConfirmation.request;
        setPendingConfirmation(null);

        setTimeout(() => {
          triggerBookingWithVehicle(cardToBook, reqToBook, onNavigateTab);
        }, 600);
        return;
      } else if (isNegativeConfirmation(trimmed)) {
        const cancelMsg: AssistantChatMessage = {
          id: `msg-asst-${Date.now()}`,
          sender: 'assistant',
          key: 'assistant_booking_cancelled',
          params: {},
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, cancelMsg]);
        speakMessage(cancelMsg);
        setPendingConfirmation(null);
        return;
      }
    }

    setIsLoading(true);

    try {
      // 1. Call Assistant Understanding Pipeline with selected language
      const extracted = await extractCargoRequestWithAssistant(
        trimmed, 
        language as AssistantLanguage, 
        locationName || 'Dapoli'
      );

      if (extracted.is_fallback) {
        setIsOfflineFallbackActive(true);
      }

      // 2. Merge with ongoing multi-turn state if answering a follow-up
      let combinedRequest: ExtractedCargoRequest = { ...extracted };
      if (ongoingCargoState) {
        combinedRequest = {
          ...ongoingCargoState,
          ...extracted,
          product: extracted.product || ongoingCargoState.product || null,
          category: extracted.category || ongoingCargoState.category,
          shelf_life_hours: extracted.shelf_life_hours !== undefined ? extracted.shelf_life_hours : ongoingCargoState.shelf_life_hours,
          urgency: extracted.urgency || ongoingCargoState.urgency || null,
          weight_kg: extracted.weight_kg !== null ? extracted.weight_kg : (ongoingCargoState.weight_kg ?? null),
          destination: extracted.destination || ongoingCargoState.destination || null
        };
      }

      // Re-evaluate missing fields
      const missingFields: ('product' | 'weight_kg' | 'destination')[] = [];
      if (!combinedRequest.product) missingFields.push('product');
      if (combinedRequest.weight_kg === null) missingFields.push('weight_kg');
      if (!combinedRequest.destination) missingFields.push('destination');
      combinedRequest.missing_fields = missingFields;

      // 3. Check for unrelated sentence
      if (extracted.is_unrelated && !ongoingCargoState) {
        const unrelatedMsg: AssistantChatMessage = {
          id: `msg-asst-${Date.now()}`,
          sender: 'assistant',
          key: 'assistant_unrelated',
          params: {},
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFallback: extracted.is_fallback
        };

        setMessages(prev => [...prev, unrelatedMsg]);
        speakMessage(unrelatedMsg);
        setIsLoading(false);
        return;
      }

      // 4. If essential fields are missing: Ask ONE short follow-up using translation keys
      if (missingFields.length > 0) {
        setOngoingCargoState(combinedRequest);

        const keyAndParams = extracted.follow_up_key
          ? { key: extracted.follow_up_key, params: extracted.follow_up_params || {} }
          : getFollowUpKeyAndParams(
              missingFields, 
              combinedRequest.product, 
              combinedRequest.destination, 
              combinedRequest.weight_kg
            );

        const followUpMsg: AssistantChatMessage = {
          id: `msg-asst-${Date.now()}`,
          sender: 'assistant',
          key: keyAndParams.key,
          params: keyAndParams.params,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          extractedData: combinedRequest,
          isFallback: extracted.is_fallback
        };

        setMessages(prev => [...prev, followUpMsg]);
        speakMessage(followUpMsg);
        setIsLoading(false);
        return;
      }

      // 5. All fields present: Run Recommendation Engine (using app data only)
      setOngoingCargoState(null);

      const recommendation: RecommendationResult = recommendVehiclesForRequest(
        combinedRequest,
        vehicles,
        returnTrips,
        userLocation,
        locationName || 'Dapoli',
        language as AssistantLanguage
      );

      if (recommendation.topCheapest) {
        setPendingConfirmation({
          request: combinedRequest,
          card: recommendation.topCheapest
        });
      }

      const recMsg: AssistantChatMessage = {
        id: `msg-asst-${Date.now()}`,
        sender: 'assistant',
        key: recommendation.spokenKey,
        params: recommendation.spokenParams,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        extractedData: combinedRequest,
        recommendation,
        isFallback: extracted.is_fallback,
        awaitingConfirmation: !!recommendation.topCheapest
      };

      setMessages(prev => [...prev, recMsg]);
      speakMessage(recMsg);
    } catch (err: any) {
      console.error('[Assistant processing error]:', err);
      setIsOfflineFallbackActive(true);

      const errReplyMsg: AssistantChatMessage = {
        id: `msg-asst-${Date.now()}`,
        sender: 'assistant',
        key: 'assistant_offline_mode_note',
        params: {},
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFallback: true
      };

      setMessages(prev => [...prev, errReplyMsg]);
      speakMessage(errReplyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Start Web Speech API Recognition
  const handleStartListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      setErrorMessage(t('assistant_err_unsupported'));
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      const speechLangCode = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.lang = speechLangCode;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      setIsListening(true);
      setErrorMessage(null);
      setLiveTranscript('');

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentText = final || interim;
        setLiveTranscript(currentText);

        if (final) {
          setIsListening(false);
          handleProcessUserText(final);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage(t('assistant_err_mic_denied'));
        } else if (event.error === 'no-speech') {
          setErrorMessage(t('assistant_err_no_speech'));
        } else {
          setErrorMessage(t('assistant_err_generic'));
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.warn('[Microphone initialization failed]:', err);
      setIsListening(false);
      setErrorMessage(t('assistant_err_generic'));
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleChipClick = (sentence: string) => {
    setTextInput(sentence);
    handleProcessUserText(sentence);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleProcessUserText(textInput.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-end md:justify-end md:p-6 bg-black/40 backdrop-blur-xs transition-opacity duration-200">
      {/* Bottom Sheet Modal Panel */}
      <div 
        className="relative w-full md:w-[480px] max-h-[90vh] md:max-h-[85vh] flex flex-col bg-[#FAF8F2] text-[#263238] rounded-t-3xl md:rounded-3xl shadow-2xl border border-[#DCD8C8] overflow-hidden animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-label={t('assistant_tooltip')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-[#E7E3D4]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#556B2F] flex items-center justify-center text-white shadow-xs">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-bold text-base text-[#263238]">
                  {t('assistant_name')}
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#E7EBD9] text-[#556B2F]">
                  {t('assistant_badge_ai')}
                </span>
              </div>
              <p className="text-[11px] text-[#5A6A64]">
                {t('assistant_subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language Selector: Marathi / Hindi / English (App-wide synced & persistent) */}
            <div className="flex items-center bg-[#F5F2E9] rounded-xl p-0.5 border border-[#DCD8C8]">
              {(['mr', 'hi', 'en'] as SupportedLanguage[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`px-2 py-1 text-xs font-semibold rounded-lg min-h-[36px] transition-all cursor-pointer ${
                    language === lang 
                      ? 'bg-[#556B2F] text-white shadow-xs' 
                      : 'text-[#5A6A64] hover:text-[#263238]'
                  }`}
                  aria-label={`Change language to ${lang === 'mr' ? 'Marathi' : lang === 'hi' ? 'Hindi' : 'English'}`}
                >
                  {lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिंदी' : 'EN'}
                </button>
              ))}
            </div>

            {/* Speech Mute Toggle */}
            <button
              onClick={() => {
                if (!isVoiceMuted && typeof window !== 'undefined' && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                }
                setIsVoiceMuted(!isVoiceMuted);
              }}
              title={isVoiceMuted ? t('assistant_unmute_voice') : t('assistant_mute_voice')}
              aria-label={isVoiceMuted ? t('assistant_unmute_voice') : t('assistant_mute_voice')}
              className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center text-[#5A6A64] hover:text-[#263238] rounded-xl hover:bg-[#F5F2E9] transition-colors cursor-pointer"
            >
              {isVoiceMuted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5 text-[#556B2F]" />}
            </button>

            {/* Close Button */}
            <button
              onClick={closeAssistant}
              aria-label={t('assistant_close')}
              className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center text-[#5A6A64] hover:text-[#263238] rounded-xl hover:bg-[#F5F2E9] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voice Unavailable Notice */}
        {voiceNotice && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center justify-between text-xs font-medium text-amber-800">
            <div className="flex items-center gap-1.5">
              <VolumeX className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{voiceNotice}</span>
            </div>
            <button 
              onClick={() => setVoiceNotice(null)} 
              className="text-amber-600 hover:text-amber-800 p-0.5 cursor-pointer"
              aria-label={t('assistant_close')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Offline Fallback Badge */}
        {isOfflineFallbackActive && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center justify-between text-xs font-medium text-amber-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{t('assistant_offline_badge')}</span>
            </div>
            <span className="text-[10px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
              {t('assistant_local_rules_active')}
            </span>
          </div>
        )}

        {/* Messages and Conversation Scroll Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[300px]">
          {messages.map((msg) => {
            const displayContent = renderMessageText(msg);

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 shadow-xs text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#556B2F] text-white rounded-br-xs'
                      : 'bg-white text-[#263238] border border-[#E7E3D4] rounded-bl-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-normal whitespace-pre-wrap">{displayContent}</p>
                    {msg.sender === 'assistant' && (
                      <button
                        onClick={() => speakMessage(msg)}
                        title={t('assistant_replay_audio')}
                        aria-label={t('assistant_replay_audio')}
                        className="text-[#556B2F] hover:text-[#38481e] p-1 -mt-1 -mr-1 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Extracted Request Summary Pills (if any) */}
                  {msg.extractedData && (msg.extractedData.product || msg.extractedData.destination) && (
                    <div className="mt-3 pt-2.5 border-t border-black/5 flex flex-wrap gap-1.5 text-xs">
                      {msg.extractedData.product && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F0EFEB] text-[#263238] font-medium">
                          📦 {t(`prod_${msg.extractedData.product.toLowerCase()}`, msg.extractedData.product_original || msg.extractedData.product)}
                        </span>
                      )}
                      {msg.extractedData.weight_kg !== null && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F0EFEB] text-[#263238] font-medium">
                          ⚖️ {formatNumber(msg.extractedData.weight_kg)} kg
                        </span>
                      )}
                      {msg.extractedData.destination && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F0EFEB] text-[#263238] font-medium">
                          📍 {t(`town_${msg.extractedData.destination}`, msg.extractedData.destination)}
                        </span>
                      )}
                      {msg.extractedData.urgency === 'URGENT' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-semibold">
                          ⏱️ {t('assistant_freshness_limit')}: 4h
                        </span>
                      )}
                      {msg.extractedData.urgency === 'TODAY' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold">
                          ⏱️ {t('assistant_freshness_limit')}: 12h
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Recommendation Cards (Top 3 vehicles) */}
                {msg.recommendation && msg.recommendation.matchedVehicles.length > 0 && (
                  <div className="w-full mt-3 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-[#5A6A64] px-1">
                      <span>{t('assistant_top_matches')}</span>
                      {msg.recommendation.isPerishable && (
                        <span className="text-red-700 font-semibold bg-red-50 border border-red-200 px-2 py-0.5 rounded-full text-[11px]">
                          🚨 {msg.recommendation.freshnessDeadlineText} {t('assistant_freshness_limit')}
                        </span>
                      )}
                    </div>

                    {msg.recommendation.matchedVehicles.map((card, idx) => {
                      const localizedDriver = DRIVER_NAMES_LOCALIZED[card.driverName]?.[language] || card.driverName;
                      const localizedVehicleType = VEHICLE_TYPE_LABELS[card.vehicle.category]?.[language] || card.vehicleType;
                      const distKm = card.distanceKm <= 2.5 ? 2 : Math.round(card.distanceKm);

                      return (
                        <div
                          key={card.vehicle.id}
                          className={`relative bg-white rounded-2xl p-3.5 border transition-all shadow-xs hover:shadow-md ${
                            idx === 0 
                              ? 'border-[#556B2F] ring-1 ring-[#556B2F]/20' 
                              : 'border-[#E7E3D4]'
                          }`}
                        >
                          {/* Return Trip / Best Match Badge */}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-[#263238]">{localizedDriver}</span>
                              <span className="text-xs text-[#5A6A64]">({localizedVehicleType})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {card.isReturnTrip && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E65100]/10 text-[#E65100] border border-[#E65100]/20">
                                  {t('assistant_return_trip_badge')}
                                </span>
                              )}
                              {idx === 0 && !card.isReturnTrip && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#556B2F]/10 text-[#556B2F] border border-[#556B2F]/20">
                                  {t('assistant_best_match')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Vehicle Stats Grid */}
                          <div className="grid grid-cols-3 gap-2 my-2 py-2 border-y border-[#F0EFEB] text-xs">
                            <div>
                              <span className="block text-[10px] text-[#5A6A64]">{t('assistant_free_capacity')}</span>
                              <span className="font-bold text-[#263238]">
                                {formatNumber(card.freeKg)} kg {t('assistant_free')}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-[#5A6A64]">{t('assistant_distance')}</span>
                              <span className="font-bold text-[#263238]">
                                {formatNumber(distKm)} km {t('assistant_away')}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-[#5A6A64]">{t('assistant_est_eta')}</span>
                              <span className="font-bold text-[#263238]">
                                {formatNumber(card.etaMin)} {t('assistant_mins')}
                              </span>
                            </div>
                          </div>

                          {/* Pricing: Pooled vs Solo */}
                          <div className="flex items-center justify-between mb-3 text-xs">
                            <div>
                              <span className="text-[10px] text-[#5A6A64] block">{t('assistant_pooled_price')}</span>
                              <span className="text-base font-extrabold text-[#556B2F]">₹{formatNumber(card.estimatedCostRs)}</span>
                              <span className="text-[11px] text-[#5A6A64] line-through ml-2">₹{formatNumber(card.soloCostRs)} {t('assistant_solo')}</span>
                            </div>
                            <div className="text-right">
                              <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                <TrendingDown className="w-3 h-3 mr-0.5" />
                                {formatNumber(card.savingsPercent)}% {t('assistant_saved')}
                              </span>
                            </div>
                          </div>

                          {/* Select Vehicle CTA Button (min 48px tap target) */}
                          <button
                            onClick={() => {
                              if (msg.recommendation && msg.extractedData) {
                                triggerBookingWithVehicle(card, msg.extractedData, onNavigateTab);
                              }
                            }}
                            className="w-full min-h-[48px] py-2.5 px-4 rounded-xl font-bold text-sm bg-[#556B2F] text-white hover:bg-[#435525] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs focus:ring-2 focus:ring-[#556B2F]"
                            aria-label={`${t('assistant_select_vehicle')} ${localizedVehicleType} ${localizedDriver}`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{t('assistant_select_vehicle')}</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Zero-match Alternative Suggestions */}
                {msg.recommendation && msg.recommendation.hasAlternativeSuggestions && (
                  <div className="w-full mt-3 space-y-2">
                    <p className="text-xs font-bold text-[#5A6A64] px-1">
                      {t('assistant_alt_header')}
                    </p>
                    <div className="bg-white rounded-xl p-3 border border-[#E7E3D4] text-xs space-y-1 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#263238]">{t('assistant_alt_solo_title')}</span>
                        {msg.params?.cost && (
                          <span className="font-bold text-[#556B2F]">₹{formatNumber(msg.params.cost)}</span>
                        )}
                      </div>
                      <p className="text-[#5A6A64] text-[11px]">{t('assistant_alt_solo_desc')}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-[#E7E3D4] text-xs space-y-1 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#263238]">{t('assistant_alt_return_title')}</span>
                      </div>
                      <p className="text-[#5A6A64] text-[11px]">{t('assistant_alt_return_desc')}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-[#E7E3D4] text-xs space-y-1 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#263238]">{t('assistant_alt_hub_title')}</span>
                      </div>
                      <p className="text-[#5A6A64] text-[11px]">{t('assistant_alt_hub_desc')}</p>
                    </div>
                  </div>
                )}

                {/* Voice Confirmation Bar */}
                {msg.awaitingConfirmation && pendingConfirmation && (
                  <div className="w-full mt-2.5 p-3 rounded-2xl bg-[#E7EBD9] border border-[#D9DED0] flex flex-col gap-2">
                    <p className="text-xs font-bold text-[#263238] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#556B2F]" />
                      <span>{t('assistant_confirm_prompt')}</span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          handleProcessUserText('haan');
                        }}
                        className="flex-1 min-h-[48px] py-2.5 px-3 rounded-xl bg-[#556B2F] text-white font-bold text-xs hover:bg-[#435525] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t('assistant_btn_confirm')}</span>
                      </button>
                      <button
                        onClick={() => {
                          handleProcessUserText('nahi');
                        }}
                        className="min-h-[48px] py-2.5 px-4 rounded-xl bg-white text-[#5A6A64] hover:text-[#263238] border border-[#DCD8C8] font-bold text-xs active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                      >
                        <span>{t('assistant_btn_cancel')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-[#E7E3D4] w-fit shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#556B2F] animate-bounce" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#556B2F] animate-bounce [animation-delay:0.2s]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#556B2F] animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-[#5A6A64] font-medium ml-1">
                {t('assistant_searching')}
              </span>
            </div>
          )}

          {/* Live Transcript Banner while Listening */}
          {isListening && (
            <div className="p-3.5 rounded-2xl bg-white border-2 border-[#556B2F] shadow-md animate-pulse">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <span className="text-xs font-bold text-[#556B2F]">
                  {t('assistant_listening')}
                </span>
              </div>
              <p className="text-sm font-semibold text-[#263238] min-h-[24px]">
                {liveTranscript || (
                  <span className="text-[#5A6A64] italic">
                    ({t('assistant_example_chip_1')})
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Error Message Notice */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">{errorMessage}</p>
                <button
                  onClick={handleStartListening}
                  className="mt-1.5 text-[11px] font-bold text-red-700 underline cursor-pointer"
                >
                  {t('assistant_try_again')}
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Big "Tap and speak" Mic Section (min 48px tap target) */}
        {isSpeechSupported && (
          <div className="px-4 py-3 bg-[#F5F2E9] border-t border-[#E7E3D4] flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              {isListening && (
                <>
                  <span className="absolute w-24 h-24 rounded-full bg-[#556B2F]/20 animate-ping" />
                  <span className="absolute w-28 h-28 rounded-full bg-[#556B2F]/10 animate-pulse" />
                </>
              )}

              <button
                onClick={isListening ? handleStopListening : handleStartListening}
                aria-label={isListening ? t('assistant_listening_tap_stop') : t('assistant_tap_and_speak')}
                className={`relative w-20 h-20 min-w-[48px] min-h-[48px] rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#556B2F]/40 active:scale-95 ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse shadow-red-500/30 ring-4 ring-red-300'
                    : 'bg-[#556B2F] text-white hover:bg-[#435525] hover:scale-105'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>

            <p className="mt-2 text-xs font-bold text-[#263238]">
              {isListening ? t('assistant_listening_tap_stop') : t('assistant_tap_and_speak')}
            </p>
          </div>
        )}

        {/* Example Prompt Chips */}
        <div className="px-4 py-2.5 bg-[#F5F2E9] border-t border-[#E7E3D4] flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[10px] uppercase font-bold text-[#5A6A64] shrink-0">
            {t('assistant_example_prefix')}
          </span>
          <button
            onClick={() => handleChipClick(t('assistant_example_chip_1'))}
            className="px-2.5 py-1.5 rounded-full bg-white text-[#263238] border border-[#DCD8C8] hover:border-[#556B2F] shrink-0 cursor-pointer font-medium hover:bg-[#FAF8F2] transition-colors min-h-[36px]"
          >
            "{t('assistant_example_chip_1')}"
          </button>
          <button
            onClick={() => handleChipClick(t('assistant_example_chip_2'))}
            className="px-2.5 py-1.5 rounded-full bg-white text-[#263238] border border-[#DCD8C8] hover:border-[#556B2F] shrink-0 cursor-pointer font-medium hover:bg-[#FAF8F2] transition-colors min-h-[36px]"
          >
            "{t('assistant_example_chip_2')}"
          </button>
          <button
            onClick={() => handleChipClick(t('assistant_example_chip_3'))}
            className="px-2.5 py-1.5 rounded-full bg-white text-[#263238] border border-[#DCD8C8] hover:border-[#556B2F] shrink-0 cursor-pointer font-medium hover:bg-[#FAF8F2] transition-colors min-h-[36px]"
          >
            "{t('assistant_example_chip_3')}"
          </button>
        </div>

        {/* Text Input Fallback Bar (Footer) */}
        <form onSubmit={handleTextSubmit} className="p-3 bg-white border-t border-[#E7E3D4] flex items-center gap-2">
          <input
            ref={textInputRef}
            type="text"
            value={textInput}
            maxLength={200}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={t('assistant_input_placeholder')}
            className="flex-1 px-3.5 py-2.5 min-h-[48px] rounded-xl bg-[#F5F2E9] border border-[#DCD8C8] text-sm text-[#263238] placeholder-[#5A6A64] focus:outline-none focus:ring-2 focus:ring-[#556B2F] focus:bg-white transition-all"
            aria-label={t('assistant_type_to_search')}
          />

          <button
            type="submit"
            disabled={!textInput.trim() || isLoading}
            aria-label={t('assistant_type_to_search')}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl bg-[#556B2F] text-white flex items-center justify-center hover:bg-[#435525] disabled:opacity-50 disabled:hover:bg-[#556B2F] transition-all cursor-pointer shadow-xs"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
