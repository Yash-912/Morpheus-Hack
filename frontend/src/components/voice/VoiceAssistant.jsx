import { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../../store/ui.store';
import { useVoiceChat } from '../../hooks/useVoiceChat';
import { Mic, MicOff, X, Send, Volume2, Loader2, MessageCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const QUICK_REPLIES = {
    mr: ['माझा बॅलन्स किती?', 'माझी कमाई किती आहे?', 'पैसे कसे काढायचे?', 'कर्जाची स्थिती सांगा'],
    hi: ['मेरा बैलेंस कितना है?', 'आज की कमाई बताओ', 'कैशआउट कैसे करें?', 'लोन स्टेटस बताओ'],
    en: ['What is my balance?', 'How much did I earn today?', 'How to cashout?', 'Show my loan status'],
};

const VoiceAssistant = () => {
    const { t, lang } = useLanguage();
    const isOpen = useUIStore(state => state.isVoiceAssistantOpen);
    const setIsOpen = useUIStore(state => state.setVoiceAssistantOpen);
    const [textInput, setTextInput] = useState('');
    const chatEndRef = useRef(null);


    const {
        status, transcript, reply, error, conversation,

        startListening, stopListening, sendText, stopSpeaking, reset,
    } = useVoiceChat();

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation, transcript, reply]);

    const handleToggle = () => {
        if (isOpen) { stopSpeaking(); reset(); }
        setIsOpen(!isOpen);
    };

    const handleMicPress = () => {
        if (status === 'listening') stopListening();
        else if (status === 'idle' || status === 'error') startListening();
        else if (status === 'speaking') stopSpeaking();
    };

    const handleSendText = () => {
        if (textInput.trim()) { sendText(textInput); setTextInput(''); }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); }
    };

    const getMicButtonStyle = () => {
        switch (status) {
            case 'listening': return 'bg-red-500 shadow-lg shadow-red-500/30 scale-110';
            case 'processing': return 'bg-amber-500 shadow-lg shadow-amber-500/30';
            case 'speaking': return 'bg-green-500 shadow-lg shadow-green-500/30';
            default: return 'bg-gigpay-navy shadow-lg shadow-gigpay-navy/30 hover:scale-105';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'listening': return `🎤 ${t('listening')}`;
            case 'processing': return `🤔 ${t('thinking')}`;
            case 'speaking': return `🔊 ${t('speaking')}`;
            case 'error': return `❌ ${t('tapToRetry')}`;
            default: return `🎤 ${t('tapMicOrType')}`;
        }
    };

    const quickReplies = QUICK_REPLIES[lang] || QUICK_REPLIES.en;

    return (
        <>

            {/* Chat Overlay — constrained to phone frame */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex justify-center bg-black/20">
                    <div className="w-full max-w-[420px] flex flex-col bg-white animate-fade-in">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gigpay-navy text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gigpay-lime rounded-full flex items-center justify-center">
                                    <MessageCircle size={18} className="text-gigpay-navy" />
                                </div>
                                <div>
                                    <h3 className="text-body-md font-bold" style={{ color: '#FFFFFF' }}>GigPay Assistant</h3>
                                    <p className="text-xs text-white/70">Hindi · Marathi · English</p>
                                </div>
                            </div>
                            <button onClick={handleToggle} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Chat Body */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gigpay-surface">
                            {/* Welcome screen */}
                            {conversation.length === 0 && status === 'idle' && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-gigpay-lime/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Mic size={28} className="text-gigpay-navy" />
                                    </div>
                                    <h4 className="text-heading-md text-gigpay-navy mb-2">{t('voiceGreeting')}</h4>
                                    <p className="text-body-md text-gigpay-text-secondary mb-1">{t('voiceSubtitle')}</p>
                                    <p className="text-body-sm text-gigpay-text-muted">{t('voiceHint')}</p>

                                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                                        {quickReplies.map((q) => (
                                            <button
                                                key={q}
                                                onClick={() => sendText(q)}
                                                className="px-3 py-2 bg-white rounded-full border border-gigpay-border text-body-sm text-gigpay-navy hover:bg-gigpay-lime/20 transition-colors"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Conversation Messages */}
                            {conversation.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                        ? 'bg-gigpay-navy text-white rounded-br-md'
                                        : 'bg-white border border-gigpay-border text-gigpay-navy rounded-bl-md shadow-sm'
                                        }`}>
                                        <p className="text-body-md" style={msg.role === 'user' ? { color: '#FFFFFF' } : {}}>{msg.text}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Live status indicators */}
                            {status === 'listening' && (
                                <div className="flex justify-end">
                                    <div className="bg-red-50 border border-red-200 rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                                            </div>
                                            <span className="text-body-sm text-red-600">{t('listening')}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {status === 'processing' && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-gigpay-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <Loader2 size={16} className="animate-spin text-gigpay-navy" />
                                            <span className="text-body-sm text-gigpay-text-secondary">{t('thinking')}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {status === 'speaking' && (
                                <div className="flex justify-start">
                                    <div className="bg-green-50 border border-green-200 rounded-2xl rounded-bl-md px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Volume2 size={16} className="text-green-600 animate-pulse" />
                                            <span className="text-body-sm text-green-700">{t('speaking')}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                                    <p className="text-body-sm text-red-600">{error}</p>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Bottom Controls */}
                        <div className="border-t border-gigpay-border bg-white p-3 safe-bottom">
                            <p className="text-center text-caption text-gigpay-text-muted mb-2">{getStatusText()}</p>

                            <div className="flex items-center gap-3">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={t('typeMessage')}
                                        className="w-full bg-gigpay-surface border border-gigpay-border rounded-full px-4 py-2.5 text-body-md focus:outline-none focus:border-gigpay-navy pr-10"
                                        disabled={status === 'listening' || status === 'processing'}
                                    />
                                    {textInput.trim() && (
                                        <button
                                            onClick={handleSendText}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-gigpay-navy rounded-full flex items-center justify-center text-white"
                                            disabled={status === 'processing'}
                                        >
                                            <Send size={14} />
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={handleMicPress}
                                    disabled={status === 'processing'}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-200 ${getMicButtonStyle()} ${status === 'processing' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    aria-label={status === 'listening' ? 'Stop recording' : 'Start recording'}
                                >
                                    {status === 'listening' ? (
                                        <MicOff size={20} />
                                    ) : status === 'processing' ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : status === 'speaking' ? (
                                        <Volume2 size={20} />
                                    ) : (
                                        <Mic size={20} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default VoiceAssistant;
