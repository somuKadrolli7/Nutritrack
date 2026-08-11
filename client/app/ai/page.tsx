'use client';

import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { LANGUAGES } from '@/lib/i18n';
import { 
  Mic, MicOff, Volume2, VolumeX, Send, Sparkles, 
  Bot, RefreshCw, ShieldAlert, Award, MessageSquare 
} from 'lucide-react';

gsap.registerPlugin(useGSAP);

const LANG_LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  es: 'es-ES',
  zh: 'zh-CN',
  kn: 'kn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  ml: 'ml-IN'
};

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

export default function AIPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 'welcome', 
      role: 'assistant', 
      content: 'Hello! I am your AI health coach. Ask me for a meal plan, workout routine, or general fitness advice!' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Voice Input (Speech-to-Text) states
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  
  // Voice Output (Text-to-Speech) states
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null); // holds message id being spoken
  const [autoVoice, setAutoVoice] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [selectedLang, setSelectedLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nt_ai_lang') || 'en';
    }
    return 'en';
  });
  const setLang = (lang: string) => {
    setSelectedLang(lang);
    if (typeof window !== 'undefined') localStorage.setItem('nt_ai_lang', lang);
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  
  useEffect(() => { 
    scrollToBottom(); 
  }, [messages, loading]);

  useGSAP(() => {
    gsap.fromTo('.anim-element',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
    );
  }, { scope: containerRef });

  // 1. Initial configuration load from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAutoVoice = localStorage.getItem('nt_ai_autovoice');
      if (storedAutoVoice) {
        setAutoVoice(storedAutoVoice === 'true');
      }
    }
  }, []);

  // 🔊 Pre-load voices (Chrome loads voices async via onvoiceschanged)
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setVoicesLoaded(true);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoices();
    };
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // 🎙️ SPEECH-TO-TEXT INITIALIZATION
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = LANG_LOCALE_MAP[selectedLang] || 'en-US';
        
        rec.onstart = () => {
          setIsListening(true);
        };
        
        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
        };
        
        rec.onerror = (e: any) => {
          console.error('Speech recognition error', e);
          setIsListening(false);
        };
        
        rec.onend = () => {
          setIsListening(false);
        };
        
        setRecognition(rec);

        return () => {
          try {
            rec.stop();
          } catch (e) {
            // ignore
          }
        };
      }
    }
  }, [selectedLang]);

  const toggleListening = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in this browser. Please use a modern browser like Google Chrome.');
      return;
    }
    // Web Speech API unlock hack on user click
    unlockSpeechSynthesis();

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.lang = LANG_LOCALE_MAP[selectedLang] || 'en-US';
      } catch (e) {
        console.warn('Failed to dynamically set recognition language:', e);
      }
      recognition.start();
    }
  };

  // 🔊 WEB SPEECH ACTIVATION UNLOCK HACK
  // Speak a silent empty utterance synchronously on user gesture to unlock synthesis for async use
  const unlockSpeechSynthesis = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      u.rate = 10;
      window.speechSynthesis.speak(u);
    }
  };

  const handleToggleAutoVoice = () => {
    const nextVal = !autoVoice;
    setAutoVoice(nextVal);
    localStorage.setItem('nt_ai_autovoice', nextVal.toString());
    if (!nextVal) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
    } else {
      unlockSpeechSynthesis();
    }
  };

  // 🔊 TEXT-TO-SPEECH ACTION
  const speakText = (text: string, msgId: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }

    // Cancel active synthesis first
    window.speechSynthesis.cancel();

    // Strip markdown tags and linebreaks for cleaner reading
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/\n/g, ' ')
      .slice(0, 4000); // limit to avoid hanging on very long responses

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    const targetLang = LANG_LOCALE_MAP[selectedLang] || 'en-US';
    utterance.lang = targetLang;
    
    utterance.onend = () => {
      setIsSpeaking(null);
    };
    
    utterance.onerror = (e) => {
      console.warn('TTS error:', e.error);
      setIsSpeaking(null);
    };

    // Pick a high-quality voice for the respective language
    const voices = window.speechSynthesis.getVoices();
    let chosenVoice = voices.find(v => v.lang.toLowerCase() === targetLang.toLowerCase());
    
    if (!chosenVoice) {
      chosenVoice = voices.find(v => v.lang.toLowerCase().startsWith(selectedLang.toLowerCase()));
    }
    
    if (selectedLang === 'en') {
      const preferred = [
        'Google US English',
        'Microsoft Zira Desktop',
        'Microsoft David Desktop',
        'Samantha',
      ];
      const preferredVoice = voices.find(v => preferred.some(p => v.name.includes(p)));
      if (preferredVoice) chosenVoice = preferredVoice;
    }
    
    if (chosenVoice) utterance.voice = chosenVoice;

    setIsSpeaking(msgId);
    window.speechSynthesis.speak(utterance);

    // Chrome bug workaround: speechSynthesis pauses after ~15s on some versions
    const resumeTimer = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(resumeTimer);
        return;
      }
      window.speechSynthesis.resume();
    }, 10000);
    utterance.onend = () => {
      clearInterval(resumeTimer);
      setIsSpeaking(null);
    };
    utterance.onerror = () => {
      clearInterval(resumeTimer);
      setIsSpeaking(null);
    };
  };

  // ✉️ SEND MESSAGE TO API
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    // Unlock Speech Synthesis in user click thread
    unlockSpeechSynthesis();

    const userMsgId = Math.random().toString(36).substring(2, 9);
    const userMsg: ChatMessage = { id: userMsgId, role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Stop active listening or speaking immediately
    if (isListening) recognition?.stop();
    window.speechSynthesis.cancel();
    setIsSpeaking(null);

    // Animate user message insertion
    setTimeout(() => {
      if (chatAreaRef.current?.lastElementChild) {
        gsap.fromTo(chatAreaRef.current.lastElementChild, 
          { opacity: 0, y: 15, scale: 0.95 }, 
          { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power2.out' }
        );
      }
    }, 10);

    try {
      const payload = { message: input, language: selectedLang };
      const { data } = await api.post('/ai/chat', payload);
      const aiReply = data.reply;
      const aiMsgId = Math.random().toString(36).substring(2, 9);
      
      setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: aiReply }]);
      
      // Auto-Read Aloud if toggle is on
      // Small delay ensures React state is updated and voices are available
      if (localStorage.getItem('nt_ai_autovoice') === 'true') {
        setTimeout(() => speakText(aiReply, aiMsgId), 300);
      }

      setTimeout(() => {
        if (chatAreaRef.current?.lastElementChild) {
          gsap.fromTo(chatAreaRef.current.lastElementChild, 
            { opacity: 0, x: -15 }, 
            { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
          );
        }
      }, 10);
    } catch (err) {
      const errorMsgId = Math.random().toString(36).substring(2, 9);
      setMessages(prev => [...prev, { 
        id: errorMsgId, 
        role: 'assistant', 
        content: 'Sorry, I am having trouble connecting to the Gemini server right now. Please check your API configuration.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // 🍽️ SHORTCUT PLAN GENERATION
  const getShortcut = async (type: 'meal' | 'workout') => {
    // Unlock Speech Synthesis in user click thread
    unlockSpeechSynthesis();

    const msg = type === 'meal' ? 'Can you generate a daily meal plan for me?' : 'Can you generate a quick workout routine for me?';
    const userMsgId = Math.random().toString(36).substring(2, 9);
    
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: msg }]);
    setLoading(true);
    window.speechSynthesis.cancel();
    setIsSpeaking(null);

    try {
      const { data } = await api.get(`/ai/${type}-plan?language=${selectedLang}`);
      const planReply = data.plan;
      const aiMsgId = Math.random().toString(36).substring(2, 9);
      
      setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: planReply }]);
      
      if (localStorage.getItem('nt_ai_autovoice') === 'true') {
        setTimeout(() => speakText(planReply, aiMsgId), 300);
      }
    } catch {
      const errorMsgId = Math.random().toString(36).substring(2, 9);
      setMessages(prev => [...prev, { 
        id: errorMsgId, 
        role: 'assistant', 
        content: 'Failed to generate plan. Please verify that your Gemini API key is configured correctly.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // 📍 LOCAL DIET PLAN GENERATION
  const getLocalDietPlan = async () => {
    unlockSpeechSynthesis();
    const userMsgId = Math.random().toString(36).substring(2, 9);
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: 'Can you generate a diet plan based on local cuisine in my area?' }]);
    setLoading(true);
    window.speechSynthesis.cancel();
    setIsSpeaking(null);

    const fetchPlan = async (locationStr: string) => {
      try {
        const { data } = await api.get(`/ai/local-diet-plan?language=${selectedLang}&location=${encodeURIComponent(locationStr)}`);
        const planReply = data.plan;
        const aiMsgId = Math.random().toString(36).substring(2, 9);
        setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: planReply }]);
        if (localStorage.getItem('nt_ai_autovoice') === 'true') {
          setTimeout(() => speakText(planReply, aiMsgId), 300);
        }
      } catch {
        const errorMsgId = Math.random().toString(36).substring(2, 9);
        setMessages(prev => [...prev, { id: errorMsgId, role: 'assistant', content: 'Failed to generate local plan. Please verify that your Gemini API key is configured correctly.' }]);
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            const locationStr = data.city ? `${data.city}, ${data.country_name}` : `${latitude}, ${longitude}`;
            await fetchPlan(locationStr);
          } catch {
            await fetchPlan(`${latitude}, ${longitude}`);
          }
        },
        async () => {
          try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            const locationStr = data.city ? `${data.city}, ${data.country_name}` : 'your local region';
            await fetchPlan(locationStr);
          } catch {
            await fetchPlan('your local region');
          }
        }
      );
    } else {
      fetchPlan('your local region');
    }
  };


  if (!user) return null;

  return (
    <div ref={containerRef} className="min-h-[600px] h-[calc(100vh-140px)] flex flex-col space-y-5 pb-8 relative w-full max-w-[1550px] mx-auto px-4 font-['Inter']">
      
      {/* 🌌 Ambient Gradients background depth */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#8b5cf6]/5 blur-[120px] pointer-events-none -z-10 animate-glow-pulse" />
      <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#ec4899]/5 blur-[120px] pointer-events-none -z-10 animate-glow-pulse [animation-delay:3s]" />

      {/* ✨ Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-20">
        <div className="absolute w-2 h-2 rounded-full bg-[#8b5cf6]/30 top-[20%] left-[5%] animate-float-slow" />
        <div className="absolute w-3 h-3 rounded-full bg-[#ec4899]/20 top-[60%] left-[8%] animate-float-medium" />
        <div className="absolute w-2 h-2 rounded-full bg-white/20 top-[10%] right-[10%] animate-float-fast" />
        <div className="absolute w-3 h-3 rounded-full bg-[#8b5cf6]/20 top-[80%] right-[5%] animate-float-slow" />
      </div>

      {/* Language Selector */}
      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm text-[#94a3b8]">{LANGUAGES[selectedLang as keyof typeof LANGUAGES].languageLabel || 'Language'}:</label>
        <select
          value={selectedLang}
          onChange={(e) => setLang(e.target.value)}
          className="bg-[#252542] border border-[#2d2d44] text-white rounded-none p-1"
        >
          {Object.entries(LANGUAGES).map(([code, dict]) => (
            <option key={code} value={code}>
              {dict.languageName || code}
            </option>
          ))}
        </select>
      </div>

      {/* Header Panel */}
      <div className="anim-element p-6 rounded-2xl bg-[#1a1a2e] border border-[#2d2d44] flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xl hover-lift relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#8b5cf6]/5 to-[#ec4899]/5 pointer-events-none -z-10" />
        
        <div className="flex items-center gap-3.5">
          <span className="p-3.5 bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] rounded-2xl block text-white shadow-lg shadow-[#8b5cf6]/20 relative">
            <Bot size={28} className="animate-pulse" />
          </span>
          <div>
            <h1 className="font-['Outfit'] font-black text-3xl text-white tracking-wide flex items-center gap-2">
              {LANGUAGES[selectedLang as keyof typeof LANGUAGES].title || 'AI Health Assistant'}
            </h1>
            <p className="text-xs text-[#94a3b8] font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#ec4899] animate-pulse" />
              <span>{LANGUAGES[selectedLang as keyof typeof LANGUAGES].subtitle || 'Powered by Google Gemini 1.5 Flash'}</span>
            </p>
          </div>
        </div>

        {/* Voice Synthesis settings switch */}
        <div className="flex items-center gap-3 bg-[#252542] border border-[#2d2d44] px-4 py-3 rounded-xl self-start md:self-auto hover-lift transition-all">
          <span className="text-xs font-bold text-[#94a3b8] flex items-center gap-1.5">
            {autoVoice ? <Volume2 size={15} className="text-[#8b5cf6] animate-bounce" /> : <VolumeX size={15} />}
            <span>Auto-Read Answers</span>
            {!voicesLoaded && <span className="text-yellow-500 text-[10px]">(loading voices...)</span>}
          </span>
          <button
            onClick={handleToggleAutoVoice}
            className={`w-10 h-5 rounded-full p-0.5 transition-all ${
              autoVoice ? 'bg-gradient-to-r from-[#8b5cf6] to-[#ec4899]' : 'bg-[#1a1a2e] border border-[#2d2d44]'
            } flex items-center`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoVoice ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Interactive plan shortcut keys */}
      <div className="anim-element flex flex-wrap gap-4 flex-shrink-0">
        <button 
          onClick={() => getShortcut('meal')} 
          disabled={loading}
          className="px-6 py-4.5 rounded-none text-white font-bold text-xs bg-[#1a1a2e] border border-[#2d2d44] hover:bg-[#252542] hover:border-[#8b5cf6]/40 transition-all disabled:opacity-50 flex items-center gap-2 hover-lift shadow-md"
        >
          🍽️ Generate Meal Plan
        </button>
        <button 
          onClick={getLocalDietPlan} 
          disabled={loading}
          className="px-6 py-4.5 rounded-none text-white font-bold text-xs bg-gradient-to-r from-[#8b5cf6]/20 to-[#ec4899]/20 border border-[#8b5cf6]/40 hover:bg-[#252542] hover:border-[#8b5cf6] transition-all disabled:opacity-50 flex items-center gap-2 hover-lift shadow-md"
        >
          📍 Local Diet Plan
        </button>
        <button 
          onClick={() => getShortcut('workout')} 
          disabled={loading}
          className="px-6 py-4.5 rounded-none text-white font-bold text-xs bg-[#1a1a2e] border border-[#2d2d44] hover:bg-[#252542] hover:border-[#8b5cf6]/40 transition-all disabled:opacity-50 flex items-center gap-2 hover-lift shadow-md"
        >
          💪 Generate Workout
        </button>
      </div>

      {/* Main chat interface block */}
      <div className="anim-element flex-1 bg-[#1a1a2e] border border-[#2d2d44] rounded-none flex flex-col overflow-hidden shadow-2xl relative min-h-[300px]">
        <div className="absolute inset-0 bg-[#8b5cf6]/2 pointer-events-none -z-10" />
        
        {/* Chat message body list */}
        <div ref={chatAreaRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 relative z-10 scrollbar-thin">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} group/msg`}>
              <div className="flex items-end gap-3 max-w-[85%] sm:max-w-[75%]">
                
                {m.role === 'assistant' && (
                  <span className="p-2 bg-[#252542] border border-[#2d2d44] text-[#8b5cf6] rounded-xl block flex-shrink-0 mb-1">
                    <Bot size={16} />
                  </span>
                )}

                <div className={`p-5 rounded-none text-sm md:text-base leading-relaxed relative ${
                  m.role === 'user' 
                    ? 'bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] text-white shadow-lg shadow-[#8b5cf6]/10' 
                    : 'bg-[#252542]/50 border border-[#2d2d44] text-[#e2e8f0] shadow-md'
                }`}>
                  {/* Basic markdown parsing block */}
                  <div dangerouslySetInnerHTML={{ 
                    __html: m.content
                      .replace(/\*\*(.*?)\*\*/g, '<b class="text-white font-extrabold">$1</b>')
                      .replace(/\n/g, '<br/>') 
                  }} />

                  {/* Micro voice synthesis button next to assistant replies */}
                  {m.role === 'assistant' && m.id !== 'welcome' && (
                    <div className="absolute right-3.5 bottom-2.5 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                      <button
                        onClick={() => speakText(m.content, m.id)}
                        className={`p-1.5 rounded-lg border transition-all hover:scale-105 active:scale-95 flex items-center ${
                          isSpeaking === m.id
                            ? 'bg-[#ec4899]/15 border-[#ec4899] text-[#ec4899]'
                            : 'bg-[#1a1a2e] border-[#2d2d44] text-[#94a3b8] hover:text-white'
                        }`}
                        title={isSpeaking === m.id ? 'Stop Speaking' : 'Read Aloud'}
                      >
                        {isSpeaking === m.id ? <VolumeX size={13} className="animate-pulse" /> : <Volume2 size={13} />}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))}

          {/* Fully visible glowing custom loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-end gap-3">
                <span className="p-2 bg-[#252542] border border-[#2d2d44] text-[#8b5cf6] rounded-xl block flex-shrink-0 animate-pulse">
                  <Bot size={16} />
                </span>
                <div className="p-5 rounded-none bg-[#252542]/50 border border-[#2d2d44] flex gap-2 items-center shadow-md">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] animate-bounce" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] animate-bounce [animation-delay:0.15s]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input box section */}
        <div className="p-6 bg-[#1a1a2e] border-t border-[#2d2d44] relative z-10">
          <form onSubmit={sendMessage} className="flex gap-4">
            
            {/* Input field wrapper */}
            <div className="flex-1 relative flex items-center">
              <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening... Speak now!" : "Ask anything about nutrition, fitness, or your goals..."}
                className={`w-full pl-6 pr-14 py-4.5 rounded-none text-sm md:text-base bg-[#252542] border text-white outline-none focus:border-[#8b5cf6] transition-all placeholder:text-[#94a3b8]/40 ${
                  isListening 
                    ? 'border-[#ec4899] ring-1 ring-[#ec4899]/35 bg-[#ec4899]/5 animate-pulse-subtle' 
                    : 'border-[#2d2d44] focus:ring-1 focus:ring-[#8b5cf6]/35'
                }`}
                disabled={loading}
              />
              
              {/* 🎙️ Premium Microphone Voice Recognition Action */}
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-3.5 p-2.5 rounded-none border transition-all flex items-center justify-center hover:scale-105 active:scale-95 ${
                  isListening 
                    ? 'bg-[#ec4899] border-[#ec4899] text-white shadow-lg shadow-[#ec4899]/30 animate-pulse' 
                    : 'bg-[#1a1a2e] border-[#2d2d44] text-[#94a3b8] hover:text-white hover:border-[#8b5cf6]/40'
                }`}
                title={isListening ? 'Stop Listening' : 'Speak into Microphone'}
                disabled={loading}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            </div>

            <button 
              type="submit" 
              disabled={!input.trim() || loading}
              className="px-6 md:px-8 py-4.5 rounded-none text-white font-bold text-sm bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-[#ec4899]/20"
            >
              <Send size={15} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        /* 🌌 Float slow */
        @keyframes floatSlow {
          0% { transform: translateY(0px) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-30px) rotate(180deg); opacity: 0.5; }
          100% { transform: translateY(0px) rotate(360deg); opacity: 0.2; }
        }
        @keyframes floatMedium {
          0% { transform: translateY(0px) scale(0.9); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 0.6; }
          100% { transform: translateY(0px) scale(0.9); opacity: 0.3; }
        }
        @keyframes floatFast {
          0% { transform: translateY(0px) translateX(0px); opacity: 0.4; }
          50% { transform: translateY(-10px) translateX(8px); opacity: 0.7; }
          100% { transform: translateY(0px) translateX(0px); opacity: 0.4; }
        }
        .animate-float-slow { animation: floatSlow 9s ease-in-out infinite; }
        .animate-float-medium { animation: floatMedium 6s ease-in-out infinite; }
        .animate-float-fast { animation: floatFast 4s ease-in-out infinite; }

        /* 🌟 Pulsing glows */
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .animate-glow-pulse {
          animation: pulseGlow 5s ease-in-out infinite;
        }

        @keyframes pulseSubtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.99); }
        }
        .animate-pulse-subtle {
          animation: pulseSubtle 2.5s ease-in-out infinite;
        }

        .hover-lift {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease;
        }
        .hover-lift:hover {
          transform: translateY(-5px) scale(1.008);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(139, 92, 246, 0.06);
          border-color: rgba(139, 92, 246, 0.3);
        }

        /* Custom scrollbar */
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #2d2d44;
          border-radius: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #8b5cf6;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
