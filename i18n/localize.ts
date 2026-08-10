import { Language } from '@/i18n/ContentLanguage';

/**
 * The base columns (`title`, `description`, `content`, `name`) hold the Korean
 * original; the `_en` siblings hold an optional English translation. Anything
 * without a translation yet falls back to the original, so the site reads the
 * same as it did before a single `_en` value was filled in.
 *
 * Empty strings fall back too — the admin forms normalise blanks to null, but a
 * row saved before that normalisation existed should not render as blank.
 */
export function pick<K extends string>(
    row: Partial<Record<K | `${K}_en`, string | null | undefined>>,
    field: K,
    language: Language
): string {
    if (language === 'en') {
        const translated = row[`${field}_en` as keyof typeof row];
        if (translated) return translated;
    }
    return row[field as keyof typeof row] ?? '';
}

/**
 * Which language `pick()` actually returned for the same arguments — for the `lang`
 * attribute on the element wrapping it. Asking for English does not guarantee
 * getting it: an untranslated post falls back to the Korean original, and tagging
 * that as `lang="en"` would have a screen reader read Korean in an English voice.
 *
 * Assumes the base column is the Korean original, which is the contract the
 * schema sets up — see supabase/migrations/20260809_04_i18n_content.sql.
 */
export function pickLang<K extends string>(
    row: Partial<Record<K | `${K}_en`, string | null | undefined>>,
    field: K,
    language: Language
): Language {
    return language === 'en' && row[`${field}_en` as keyof typeof row] ? 'en' : 'ko';
}
