import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGES, translateText } from '../i18n/translations';

const LANGUAGE_STORAGE_KEY = 'appLanguage';
const TRANSLATABLE_ATTRIBUTES = ['alt', 'aria-label', 'placeholder', 'title'];
const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA']);

const LanguageContext = createContext();

const getInitialLanguage = () => {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (LANGUAGES[storedLanguage]) return storedLanguage;

    const browserLanguage = navigator.language?.slice(0, 2).toLowerCase();
    return LANGUAGES[browserLanguage] ? browserLanguage : 'es';
};

const getTranslatedTextNodeValue = (node, language) => {
    const nodeWasUpdatedByReact = node.__i18nLastTranslatedValue
        && node.nodeValue !== node.__i18nLastTranslatedValue;
    const originalValue = nodeWasUpdatedByReact
        ? node.nodeValue
        : node.__i18nOriginalValue ?? node.nodeValue;
    node.__i18nOriginalValue = originalValue;

    const match = originalValue.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!match || !match[2].trim()) return originalValue;

    const translatedValue = `${match[1]}${translateText(match[2], language)}${match[3]}`;
    node.__i18nLastTranslatedValue = translatedValue;
    return translatedValue;
};

const translateElementAttributes = (element, language) => {
    TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
        if (!element.hasAttribute(attribute)) return;

        const cacheKey = `i18nOriginal${attribute.replace(/(^|-)([a-z])/g, (_, __, letter) => letter.toUpperCase())}`;
        const originalValue = element.dataset[cacheKey] ?? element.getAttribute(attribute);
        const translatedValue = translateText(originalValue, language);

        element.dataset[cacheKey] = originalValue;
        if (element.getAttribute(attribute) !== translatedValue) {
            element.setAttribute(attribute, translatedValue);
        }
    });
};

const translateNodeTree = (node, language) => {
    if (!node) return;

    if (node.nodeType === Node.TEXT_NODE) {
        const translatedValue = getTranslatedTextNodeValue(node, language);
        if (node.nodeValue !== translatedValue) {
            node.nodeValue = translatedValue;
        }
        return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE || SKIPPED_TAGS.has(node.tagName)) {
        return;
    }

    translateElementAttributes(node, language);
    node.childNodes.forEach((child) => translateNodeTree(child, language));
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState(getInitialLanguage);

    const setLanguage = useCallback((nextLanguage) => {
        if (!LANGUAGES[nextLanguage]) return;
        setLanguageState(nextLanguage);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    }, []);

    const toggleLanguage = useCallback(() => {
        setLanguage(language === 'es' ? 'en' : 'es');
    }, [language, setLanguage]);

    const t = useCallback((value) => translateText(value, language), [language]);

    useEffect(() => {
        document.documentElement.lang = language;
        translateNodeTree(document.body, language);

        const observer = new MutationObserver((mutations) => {
            observer.disconnect();

            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => translateNodeTree(node, language));
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        return () => observer.disconnect();
    }, [language]);

    const value = useMemo(() => ({
        language,
        languages: LANGUAGES,
        setLanguage,
        toggleLanguage,
        t,
    }), [language, setLanguage, toggleLanguage, t]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage debe usarse dentro de un LanguageProvider');
    }
    return context;
};
