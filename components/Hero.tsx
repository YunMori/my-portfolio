'use client';

import { Profile } from '@/types/database.types';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

interface HeroProps {
    profile: Profile | null;
}

export default function Hero({ profile }: HeroProps) {
    const { t } = useLanguage();

    return (
        <section className="relative min-h-[90vh] flex items-center pt-24 pb-12 px-6 overflow-hidden bg-main">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-khaki-900/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-brown-600/5 rounded-full blur-[80px] translate-y-1/4 -translate-x-1/4"></div>

            <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center relative z-10">

                {/* Left Column: Text */}
                <div className="fade-in-section opacity-0 translate-y-5 transition-all duration-1000 order-2 md:order-1">
                    <span className="inline-block py-1 px-3 border border-khaki-500/30 bg-khaki-500/10 text-khaki-400 text-[11px] font-bold tracking-[0.2em] uppercase mb-6 rounded-full">
                        Project Exhibition Hall
                    </span>
                    <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 text-stone-100 leading-[1.1]">
                        {t('hero.greeting')}<br />
                        <span className="text-khaki-500">{profile?.name || "Jong Seo Yun."}</span>
                    </h1>
                    <h2 className="text-xl md:text-2xl text-stone-400 font-medium mb-8">
                        {profile?.role || "Full Stack Developer"} <span className="text-stone-600 mx-2">|</span> You can call me Mori
                    </h2>
                    <p className="text-stone-500 text-base md:text-lg leading-relaxed max-w-xl mb-10 whitespace-pre-wrap">
                        {profile?.bio || `데이터가 이끄는 정확한 설계와 감각적인 인터페이스의 조화를 추구합니다. 
                        단순히 기능을 구현하는 것을 넘어, 사용자의 경험을 깊이 있게 고민하고 
                        비즈니스 가치를 창출하는 웹 애플리케이션을 만듭니다.`}
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <a href="#projects" className="px-8 py-3 bg-khaki-500 text-black font-bold text-sm rounded-full hover:bg-khaki-400 transition-all shadow-[0_0_20px_rgba(163,169,72,0.3)] hover:shadow-[0_0_30px_rgba(163,169,72,0.5)]">
                            View Work
                        </a>
                        <a href="mailto:sbok10422@gmail.com" className="px-8 py-3 bg-transparent border border-stone-700 text-stone-300 font-bold text-sm rounded-full hover:border-khaki-500 hover:text-khaki-500 transition-all flex items-center gap-2">
                            <i className="fa-regular fa-envelope"></i> {t('hero.contact')}
                        </a>
                    </div>
                </div>

                {/* Right Column: Image Placeholder */}
                <div className="relative order-1 md:order-2 flex justify-center md:justify-end fade-in-section opacity-0 translate-y-5 transition-all duration-1000 delay-300">
                    <div className="relative w-72 h-72 md:w-96 md:h-96">
                        {/* Image Frame Effect */}
                        <div className="absolute inset-0 border-2 border-khaki-500/30 rounded-[2rem] rotate-3 scale-105"></div>
                        <div className="absolute inset-0 bg-stone-800 rounded-[2rem] -rotate-3 hover:rotate-0 transition-transform duration-500 overflow-hidden shadow-2xl group cursor-pointer">
                            {/* Placeholder Content OR Actual Image */}
                            <Image
                                src={profile?.avatar_url || "/hero-profile.jpg"}
                                alt={profile?.name || "Profile Image"}
                                fill
                                className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority
                            />
                        </div>

                        {/* Decorative Floating Element */}
                        <div className="absolute -bottom-6 -left-6 bg-surface border border-stone-800 p-4 rounded-xl shadow-xl animate-bounce duration-[3000ms]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-khaki-500/20 flex items-center justify-center text-khaki-500">
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
