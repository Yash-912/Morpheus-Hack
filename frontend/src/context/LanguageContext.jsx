import { createContext, useContext, useState, useCallback } from 'react';
import translations from '../translations';

const LanguageContext = createContext();

const LANG_KEY = 'gigpay_lang';

export const LanguageProvider = ({ children }) => {
    const [lang, setLangState] = useState(() => {
        return localStorage.getItem(LANG_KEY) || 'en';
    });

    const setLang = useCallback((code) => {
        setLangState(code);
        localStorage.setItem(LANG_KEY, code);
    }, []);

    // Translation function — returns key as fallback
    const t = useCallback(
        (key) => translations[lang]?.[key] || translations.en?.[key] || key,
        [lang]
    );

    // Cycle language: en → hi → mr → en
    const cycleLang = useCallback(() => {
        const order = ['en', 'hi', 'mr'];
        const next = order[(order.indexOf(lang) + 1) % order.length];
        setLang(next);
    }, [lang, setLang]);

    // Display label for current language
    const langLabel = { en: 'EN', hi: 'हि', mr: 'मर' }[lang] || 'EN';

    return (
        <LanguageContext.Provider value={{ lang, setLang, t, cycleLang, langLabel }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
    return ctx;
};
