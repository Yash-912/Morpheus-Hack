import React, { useState, useEffect } from 'react';
import { Sparkles, Play, Loader2, VolumeX } from 'lucide-react';
import api from '../../services/api.service';
import { Card } from '../ui/Card';
import { useLanguage } from '../../context/LanguageContext';
import { useVoiceChat } from '../../hooks/useVoiceChat';

const InsightExplanation = ({ insightData }) => {
    const { language } = useLanguage();
    const { speak } = useVoiceChat(); // Gives us access to TTS playing logic if we want to pipe audio directly, but we get base64 from the endpoint

    const [summary, setSummary] = useState('');
    const [audioBase64, setAudioBase64] = useState('');
    const [loading, setLoading] = useState(true);
    const [playing, setPlaying] = useState(false);
    const [audioElement, setAudioElement] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchExplanation = async () => {
            if (!insightData || Object.keys(insightData).length === 0) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const res = await api.post('/ai/explain-insights', {
                    insightData,
                    languagePref: language
                });

                if (isMounted && res.data?.success) {
                    setSummary(res.data.data.summary);
                    setAudioBase64(res.data.data.audioBase64);
                }
            } catch (err) {
                console.error('Failed to fetch insight explanation:', err);
                if (isMounted) {
                    setSummary('Could not generate AI summary at this time.');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchExplanation();

        return () => {
            isMounted = false;
            if (audioElement) {
                audioElement.pause();
                audioElement.src = '';
            }
        };
    }, [insightData, language]);

    const handlePlayAudio = () => {
        if (!audioBase64) return;

        if (playing && audioElement) {
            audioElement.pause();
            setPlaying(false);
            return;
        }

        const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
        setAudioElement(audio);

        audio.onended = () => setPlaying(false);
        audio.onerror = () => {
            console.error('Audio playback failed');
            setPlaying(false);
        };

        setPlaying(true);
        audio.play().catch(e => {
            console.error('Play intercepted:', e);
            setPlaying(false);
        });
    };

    if (loading) {
        return (
            <Card className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200 mb-6 flex items-center justify-center min-h-[100px]">
                <div className="flex items-center gap-2 text-teal-600 font-medium text-sm">
                    <Loader2 size={18} className="animate-spin" />
                    AI is analyzing your week...
                </div>
            </Card>
        );
    }

    if (!summary) return null;

    return (
        <Card className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200 mb-6 flex flex-col gap-3 transition-all relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
                <Sparkles size={80} className="text-teal-600" />
            </div>

            <div className="flex items-start justify-between z-10">
                <div className="flex items-center gap-2 text-teal-700 font-bold font-syne text-sm mb-1">
                    <Sparkles size={16} />
                    AI Weekly Review
                </div>

                {audioBase64 && (
                    <button
                        onClick={handlePlayAudio}
                        className={`p-2 rounded-full transition-all flex items-center justify-center ${playing
                                ? 'bg-teal-600 text-white shadow-md animate-pulse'
                                : 'bg-white text-teal-600 border border-teal-200 hover:bg-teal-100'
                            }`}
                        title="Listen to summary"
                    >
                        {playing ? <VolumeX size={16} /> : <Play size={16} className="ml-0.5" />}
                    </button>
                )}
            </div>

            <p className="text-gigpay-navy text-sm font-medium leading-relaxed pr-6 z-10">
                {summary}
            </p>
        </Card>
    );
};

export default InsightExplanation;
