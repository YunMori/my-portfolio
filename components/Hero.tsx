import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

export default function Hero() {
    const { t } = useLanguage();

    return (
        <section className="relative min-h-[90vh] flex items-center pt-24 pb-12 px-6 overflow-hidden bg-main">
            {/* Background Gradient Mesh */}
            <div className="absolute inset-0" style={{
                background: `
                    radial-gradient(ellipse at 20% 50%, rgba(74,124,89,0.08) 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 20%, rgba(141,110,99,0.06) 0%, transparent 40%),
                    radial-gradient(ellipse at 50% 100%, rgba(74,124,89,0.04) 0%, transparent 60%),
                    radial-gradient(ellipse at 90% 80%, rgba(93,64,55,0.05) 0%, transparent 45%)
                `
            }}></div>

            <div className="max-w-7xl mx-auto w-full grid md:grid-cols-[1.2fr_0.8fr] gap-12 items-center relative z-10">

                {/* Left Column: Text */}
                <div className="hero-stagger order-2 md:order-1">
                    <span className="inline-block py-1 px-3 border border-green-500/30 bg-green-500/10 text-green-400 text-[11px] font-bold tracking-[0.2em] uppercase mb-6 rounded-full">
                        Project Exhibition Hall
                    </span>
                    <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 text-stone-100 leading-[1.1]">
                        {t('hero.greeting')}<br />
                        <span className="text-green-500">Jong Seo Yun.</span>
                    </h1>
                    <h2 className="text-xl md:text-2xl text-stone-400 font-medium mb-8">
                        You can call me &ldquo;Mori&rdquo;
                    </h2>
                    <p className="text-stone-500 text-base md:text-lg leading-relaxed max-w-xl mb-10 whitespace-pre-wrap">
                        나도 내가 뭐 하고 싶은지 모릅니다. 재밌어 보이는거 만듭니다.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <a href="#projects" className="btn-shimmer px-8 py-3 bg-green-500 text-black font-bold text-sm rounded-full hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(74,124,89,0.3)] hover:shadow-[0_0_30px_rgba(74,124,89,0.5)]">
                            View Work
                        </a>
                        <a href="mailto:sbok10422@gmail.com" className="px-8 py-3 bg-transparent border border-stone-700 text-stone-300 font-bold text-sm rounded-full hover:border-green-500 hover:text-green-500 transition-all flex items-center gap-2">
                            <i className="fa-regular fa-envelope"></i> {t('hero.contact')}
                        </a>
                    </div>
                </div>

                {/* Right Column: Image */}
                <div className="relative order-1 md:order-2 flex justify-center md:justify-end hero-image-reveal">
                    <div className="relative w-72 h-72 md:w-96 md:h-96">
                        {/* Image Frame Effect */}
                        <div className="absolute inset-0 border-2 border-green-500/30 rounded-[2rem] rotate-3 scale-105"></div>
                        <div className="absolute inset-0 bg-stone-800 rounded-[2rem] -rotate-3 hover:rotate-0 transition-transform duration-500 overflow-hidden shadow-2xl group cursor-pointer">
                            <Image
                                src="/hero-profile.jpg"
                                alt="Jong Seo Yun"
                                fill
                                className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority
                            />
                        </div>

                        {/* Decorative Floating Element */}
                        <div className="absolute -bottom-6 -left-6 bg-surface border border-stone-800 p-4 rounded-xl shadow-xl animate-bounce duration-[3000ms]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                    <i className="fa-solid fa-code"></i>
                                </div>
                                <div>
                                    <div className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">Experience</div>
                                    <div className="text-sm font-bold text-stone-200">Junior</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
