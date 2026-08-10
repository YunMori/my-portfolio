/**
 * Reads an optional text field, normalising a blank input to null.
 *
 * The translation columns (`title_en`, `content_en`, …) rely on this: `pick()` in
 * i18n/localize.ts falls back to the Korean original when the translation is
 * empty, and an empty string stored instead of null would render as blank text.
 */
export function optionalText(formData: FormData, key: string): string | null {
    const value = formData.get(key)
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
}
