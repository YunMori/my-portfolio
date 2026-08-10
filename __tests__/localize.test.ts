import { pick, pickLang } from '@/i18n/localize';

describe('pick', () => {
    const row = {
        title: '한국어 제목',
        title_en: 'English title',
        description: '설명',
        description_en: null,
        content: '본문',
        content_en: '',
    };

    it('returns the original for Korean regardless of the translation', () => {
        expect(pick(row, 'title', 'ko')).toBe('한국어 제목');
        expect(pick(row, 'description', 'ko')).toBe('설명');
    });

    it('returns the translation for English when one exists', () => {
        expect(pick(row, 'title', 'en')).toBe('English title');
    });

    it('falls back to the original when the translation is null', () => {
        expect(pick(row, 'description', 'en')).toBe('설명');
    });

    // Rows written before the admin form normalised blanks to null can hold ''.
    // Rendering that would blank the card out, so it has to fall back too.
    it('falls back to the original when the translation is an empty string', () => {
        expect(pick(row, 'content', 'en')).toBe('본문');
    });

    it('returns an empty string when the field itself is missing', () => {
        expect(pick({}, 'title', 'en')).toBe('');
        expect(pick({ title: null }, 'title', 'ko')).toBe('');
    });
});

describe('pickLang', () => {
    const row = { title: '한국어 제목', title_en: 'English title', description: '설명', description_en: null };

    it('reports English only when the translation was actually used', () => {
        expect(pickLang(row, 'title', 'en')).toBe('en');
    });

    // Tagging a Korean fallback as lang="en" would have a screen reader read
    // Korean in an English voice — the whole reason the attribute is there.
    it('reports Korean when English fell back to the original', () => {
        expect(pickLang(row, 'description', 'en')).toBe('ko');
    });

    it('reports Korean whenever Korean was requested', () => {
        expect(pickLang(row, 'title', 'ko')).toBe('ko');
    });
});
