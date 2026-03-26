'use client';

import { useLanguage } from '@/context/LanguageContext';

const marqueeItems = ['Next.js', 'React', 'TypeScript', 'Tailwind', 'Node.js', 'Supabase', 'Python', 'Vue', 'Firebase', 'Git'];

export default function Footer() {
    const { t } = useLanguage();

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer id="contact" className="bg-stone-950 border-t border-stone-900 pt-16 pb-8 overflow-hidden">
            {/* Marquee */}
            <div className="mb-12 opacity-10 overflow-hidden">
                <div className="marquee-track whitespace-nowrap">
                    {[...marqueeItems, ...marqueeItems].map((item, i) => (
                        <span key={i} className="text-4xl md:text-6xl font-display font-bold text-stone-300 mx-8">
                            {item}
                        </span>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12">
                    <div className="mb-8 md:mb-0 text-center md:text-left">
                        <h2 className="text-4xl md:text-6xl font-display font-bold text-stone-100 mb-3">
                            Let&apos;s Build<br />
                            <span className="text-green-500">Something.</span>
                        </h2>
                        <p className="text-stone-400 text-sm">If you want</p>
                    </div>

                    <div className="flex gap-5">
                        <a href="https://github.com/YunMori" target="_blank" rel="noopener noreferrer" aria-label="GitHub 프로필 방문" className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center text-stone-400 hover:bg-green-500 hover:text-black hover:scale-110 transition-all duration-300">
                            <i className="fa-brands fa-github text-xl"></i>
                        </a>
                        <a href="https://www.linkedin.com/in/종서1042" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn 프로필 방문" className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center text-stone-400 hover:bg-green-500 hover:text-black hover:scale-110 transition-all duration-300">
                            <i className="fa-brands fa-linkedin text-xl"></i>
                        </a>
                        <a href="mailto:sbok10422@gmail.com" aria-label="이메일 보내기" className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center text-stone-400 hover:bg-green-500 hover:text-black hover:scale-110 transition-all duration-300">
                            <i className="fa-solid fa-envelope text-xl"></i>
                        </a>
                    </div>
                </div>

                <div className="border-t border-stone-900 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-stone-600">
                    <p className="text-stone-400">&copy; {new Date().getFullYear()} Yun Jong Seo. {t('footer.rights')}</p>
                    <button
                        onClick={scrollToTop}
                        className="mt-4 md:mt-0 flex items-center text-stone-400 hover:text-green-500 transition-colors"
                    >
                        {t('footer.backToTop')} <i className="fa-solid fa-arrow-up ml-2"></i>
                    </button>
                </div>
            </div>
        </footer>
    );
}
