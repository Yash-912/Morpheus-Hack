import { useState, useRef, useEffect } from 'react';
import { useVoiceChat } from '../../hooks/useVoiceChat';
import { Mic, MicOff, X, Send, Volume2, Loader2, MessageCircle } from 'lucide-react';

/**
 * VoiceAssistant — Floating mic button + chat overlay
 * Supports voice (Sarvam STT/TTS) and text input
 */
const VoiceAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [textInput, setTextInput] = useState('');
    const chatEndRef = useRef(null);

    const {
        status,
        transcript,
        reply,
        error,
        conversation,
        startListening,
        stopListening,
        sendText,
        stopSpeaking,
        reset,
    } = useVoiceChat();

    // Auto-scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation, transcript, reply]);

    const handleToggle = () => {
        if (isOpen) {
            stopSpeaking();
            reset();
        }
        setIsOpen(!isOpen);
    };

    const handleMicPress = () => {
        if (status === 'listening') {
            stopListening();
        } else if (status === 'idle' || status === 'error') {
            startListening();
        } else if (status === 'speaking') {
            stopSpeaking();
        }
    };

    const handleSendText = () => {
        if (textInput.trim()) {
            sendText(textInput);
            setTextInput('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
        }
    };

    // Mic button color based on status
    const getMicButtonStyle = () => {
        switch (status) {
            case 'listening':
                return 'bg-red-500 shadow-lg shadow-red-500/30 scale-110';
            case 'processing':
                return 'bg-amber-500 shadow-lg shadow-amber-500/30';
            case 'speaking':
                return 'bg-green-500 shadow-lg shadow-green-500/30';
            default:
                return 'bg-gigpay-navy shadow-lg shadow-gigpay-navy/30 hover:scale-105';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'listening':
                return '🎤 Listening... tap to stop';
            case 'processing':
                return '🤔 Thinking...';
            case 'speaking':
                return '🔊 Speaking... tap to stop';
            case 'error':
                return '❌ Tap mic to try again';
            default:
                return '🎤 Tap mic or type a message';
        }
    };

    return (
        <>
            {/* ── Floating Mic Button (always visible) ── */}
            {!isOpen && (
                <button
                    onClick={handleToggle}
                    className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-gigpay-navy text-white shadow-brutal-sm flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                    aria-label="Open voice assistant"
                    id="voice-assistant-fab"
                >
                    <div className="relative">
                        <MessageCircle size={24} />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gigpay-lime rounded-full border-2 border-gigpay-navy" />
                    </div>
                </button>
            )}

            {/* ── Chat Overlay ── */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white animate-fade-in">
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
                        <button
                            onClick={handleToggle}
                            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Chat Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gigpay-surface">
                        {/* Welcome message */}
                        {conversation.length === 0 && status === 'idle' && (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gigpay-lime/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Mic size={28} className="text-gigpay-navy" />
                                </div>
                                <h4 className="text-heading-md text-gigpay-navy mb-2">नमस्ते! 🙏</h4>
                                <p className="text-body-md text-gigpay-text-secondary mb-1">
                                    मैं आपका GigPay Assistant हूँ
                                </p>
                                <p className="text-body-sm text-gigpay-text-muted">
                                    Ask me anything in Hindi, Marathi or English
                                </p>

                                <div className="flex flex-wrap justify-center gap-2 mt-6">
                                    {[
                                        'Mera balance kitna hai?',
                                        'माझी कमाई किती आहे?',
                                        'Cashout kaise kare?',
                                        'Loan status batao',
                                    ].map((q) => (
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
                            <div
                                key={i}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                            ? 'bg-gigpay-navy text-white rounded-br-md'
                                            : 'bg-white border border-gigpay-border text-gigpay-navy rounded-bl-md shadow-sm'
                                        }`}
                                >
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
                                        <span className="text-body-sm text-red-600">Listening...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {status === 'processing' && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gigpay-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin text-gigpay-navy" />
                                        <span className="text-body-sm text-gigpay-text-secondary">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {status === 'speaking' && (
                            <div className="flex justify-start">
                                <div className="bg-green-50 border border-green-200 rounded-2xl rounded-bl-md px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Volume2 size={16} className="text-green-600 animate-pulse" />
                                        <span className="text-body-sm text-green-700">Speaking...</span>
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
                        <p className="text-center text-caption text-gigpay-text-muted mb-2">
                            {getStatusText()}
                        </p>

                        <div className="flex items-center gap-3">
                            {/* Text Input */}
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message..."
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

                            {/* Mic Button */}
                            <button
                                onClick={handleMicPress}
                                disabled={status === 'processing'}
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-200 ${getMicButtonStyle()} ${status === 'processing' ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
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
            )}
        </>
    );
};

export default VoiceAssistant;
