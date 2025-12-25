import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const currentLng = i18n.language;
        const newLng = currentLng === 'vi' ? 'en' : 'vi';
        i18n.changeLanguage(newLng);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-600 hover:border-primary-500 hover:bg-slate-700 transition-all duration-300 group"
            title="Switch Language"
        >
            <span className="text-slate-300 font-medium group-hover:text-white transition-colors">
                {i18n.language === 'vi' ? 'Tiếng Việt' : 'English'}
            </span>
            <div className="bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                {i18n.language === 'vi' ? 'VN' : 'EN'}
            </div>
        </button>
    );
};

export default LanguageSwitcher;
