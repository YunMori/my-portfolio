import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentLanguageProvider, useContentLanguage } from '@/i18n/ContentLanguage';

function Probe() {
    const { language, toggleLanguage } = useContentLanguage();
    return (
        <div>
            <span data-testid="lang">{language}</span>
            <button onClick={toggleLanguage}>toggle</button>
        </div>
    );
}

function renderProbe() {
    return render(
        <ContentLanguageProvider>
            <Probe />
        </ContentLanguageProvider>
    );
}

/** Replaces navigator.language for one test; jsdom's default is 'en-US'. */
function setBrowserLanguage(value: string) {
    Object.defineProperty(window.navigator, 'language', {
        value,
        configurable: true,
    });
}

beforeEach(() => {
    localStorage.clear();
    setBrowserLanguage('en-US');
});

describe('ContentLanguageProvider', () => {
    it('reads a stored preference', async () => {
        localStorage.setItem('portfolio-lang', 'ko');
        renderProbe();
        expect(await screen.findByText('ko')).toBeInTheDocument();
    });

    it('ignores a stored value that is not a supported language', () => {
        localStorage.setItem('portfolio-lang', 'fr');
        renderProbe();
        expect(screen.getByTestId('lang')).toHaveTextContent('en');
    });

    it('falls back to the browser language on a first visit', async () => {
        setBrowserLanguage('ko-KR');
        renderProbe();
        // A Korean visitor gets Korean content without having to find the toggle.
        expect(await screen.findByText('ko')).toBeInTheDocument();
    });

    it('defaults to English for any other browser language', () => {
        setBrowserLanguage('ja-JP');
        renderProbe();
        expect(screen.getByTestId('lang')).toHaveTextContent('en');
    });

    it('toggles and persists the choice', async () => {
        const user = userEvent.setup();
        renderProbe();
        expect(screen.getByTestId('lang')).toHaveTextContent('en');

        await user.click(screen.getByRole('button', { name: 'toggle' }));

        expect(screen.getByTestId('lang')).toHaveTextContent('ko');
        expect(localStorage.getItem('portfolio-lang')).toBe('ko');
    });

    it('picks the persisted choice back up on a later visit', async () => {
        const user = userEvent.setup();
        const first = renderProbe();
        await user.click(screen.getByRole('button', { name: 'toggle' }));
        first.unmount();

        renderProbe();
        expect(await screen.findByText('ko')).toBeInTheDocument();
    });

    it('follows a write from another tab', async () => {
        renderProbe();
        expect(screen.getByTestId('lang')).toHaveTextContent('en');

        // `storage` only fires in the tabs that did not write.
        act(() => {
            localStorage.setItem('portfolio-lang', 'ko');
            window.dispatchEvent(new StorageEvent('storage', { key: 'portfolio-lang' }));
        });

        expect(screen.getByTestId('lang')).toHaveTextContent('ko');
    });

    describe('when localStorage is blocked', () => {
        // Safari private mode, a third-party iframe, or cookies switched off: the
        // reads and writes throw rather than returning null. An unguarded access
        // happens during render, so it would take the whole app down.
        let getItem: jest.SpyInstance;
        let setItem: jest.SpyInstance;

        beforeEach(() => {
            getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
                throw new DOMException('blocked');
            });
            setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw new DOMException('blocked');
            });
        });

        afterEach(() => {
            getItem.mockRestore();
            setItem.mockRestore();
        });

        it('renders instead of crashing', () => {
            expect(() => renderProbe()).not.toThrow();
            expect(screen.getByTestId('lang')).toHaveTextContent(/^(en|ko)$/);
        });

        // Asserted relative to whatever it started as: with storage unavailable the
        // choice lives in module memory that outlives a single mount, so the exact
        // starting language is not part of the contract — only that toggling works.
        it('still toggles for the current page view', async () => {
            const user = userEvent.setup();
            renderProbe();
            const before = screen.getByTestId('lang').textContent;

            await user.click(screen.getByRole('button', { name: 'toggle' }));

            const after = screen.getByTestId('lang').textContent;
            expect(after).not.toBe(before);
            expect(after).toMatch(/^(en|ko)$/);
        });
    });

    it('throws when used outside the provider', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<Probe />)).toThrow(/must be used within a ContentLanguageProvider/);
        consoleError.mockRestore();
    });
});
