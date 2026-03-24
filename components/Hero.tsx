import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

export default function Hero() {
    const { t } = useLanguage();

    return (
        <section className="relative min-h-[90vh] flex items-center pt-24 pb-12 px-6 overflow-hidden bg-main">
            {/* Background: Topographic Contour Lines */}
            <div className="absolute inset-0 overflow-hidden">
                <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 1440 800"
                    preserveAspectRatio="xMidYMid slice"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <radialGradient id="heroGlow" cx="18%" cy="52%" r="45%">
                            <stop offset="0%" stopColor="#4a7c59" stopOpacity="0.07"/>
                            <stop offset="100%" stopColor="#4a7c59" stopOpacity="0"/>
                        </radialGradient>
                        <radialGradient id="peakGlow" cx="78%" cy="48%" r="30%">
                            <stop offset="0%" stopColor="#8d6e63" stopOpacity="0.05"/>
                            <stop offset="100%" stopColor="#8d6e63" stopOpacity="0"/>
                        </radialGradient>
                    </defs>

                    {/* Soft glow underlays */}
                    <rect width="1440" height="800" fill="url(#heroGlow)"/>
                    <rect width="1440" height="800" fill="url(#peakGlow)"/>

                    {/* Full-width flowing contour lines */}
                    <g fill="none" strokeWidth="0.8">
                        <path stroke="rgba(74,124,89,0.09)" d="M-20,75 C220,52 440,90 680,68 S1020,48 1260,74 L1460,66"/>
                        <path stroke="rgba(74,124,89,0.11)" d="M-20,135 C190,116 400,148 620,130 S940,110 1160,138 L1460,124"/>
                        <path stroke="rgba(74,124,89,0.13)" d="M-20,196 C170,178 370,212 590,193 S900,170 1120,200 L1460,185"/>
                        <path stroke="rgba(74,124,89,0.15)" d="M-20,260 C200,240 390,274 610,256 S892,232 1110,262 L1460,248"/>
                        <path stroke="rgba(74,124,89,0.16)" d="M-20,326 C185,308 378,342 598,323 S880,298 1100,328 L1460,314"/>
                        <path stroke="rgba(74,124,89,0.15)" d="M-20,392 C205,373 395,408 614,390 S882,364 1100,394 L1460,380"/>
                        <path stroke="rgba(74,124,89,0.13)" d="M-20,458 C215,440 408,474 625,456 S888,430 1108,460 L1460,446"/>
                        <path stroke="rgba(74,124,89,0.11)" d="M-20,522 C208,505 400,538 618,522 S882,496 1100,526 L1460,512"/>
                        <path stroke="rgba(74,124,89,0.09)" d="M-20,585 C195,570 392,600 608,586 S876,562 1094,590 L1460,578"/>
                        <path stroke="rgba(74,124,89,0.07)" d="M-20,645 C200,632 395,658 610,646 S876,624 1092,650 L1460,640"/>
                        <path stroke="rgba(74,124,89,0.05)" d="M-20,702 C210,692 405,714 618,704 S878,684 1092,708 L1460,700"/>
                    </g>

                    {/* Concentrated peak contours — right side (frames the profile photo) */}
                    <g fill="none" strokeWidth="0.7">
                        <path stroke="rgba(74,124,89,0.08)" d="M760,130 C870,88 1040,82 1160,132 S1340,248 1360,388 S1290,528 1160,568 S940,584 800,542 S640,440 622,300 S660,190 760,130 Z"/>
                        <path stroke="rgba(74,124,89,0.11)" d="M800,162 C898,124 1048,118 1154,164 S1312,268 1328,392 S1264,518 1148,554 S944,568 816,528 S666,432 650,306 S684,216 800,162 Z"/>
                        <path stroke="rgba(74,124,89,0.14)" d="M838,198 C924,163 1054,158 1148,198 S1284,290 1296,396 S1238,506 1136,540 S948,552 832,516 S692,424 678,312 S706,242 838,198 Z"/>
                        <path stroke="rgba(74,124,89,0.17)" d="M874,238 C950,206 1060,200 1142,238 S1258,316 1268,400 S1214,496 1124,526 S950,536 848,502 S718,416 706,318 S730,268 874,238 Z"/>
                        <path stroke="rgba(74,124,89,0.20)" d="M908,280 C974,252 1066,246 1138,280 S1232,344 1240,406 S1190,485 1112,512 S952,520 862,488 S742,406 732,324 S754,296 908,280 Z"/>
                        <path stroke="rgba(74,124,89,0.22)" d="M942,324 C998,300 1072,294 1134,324 S1206,374 1212,412 S1166,474 1100,498 S954,504 876,474 S766,398 758,330 S778,326 942,324 Z"/>
                    </g>
                </svg>
            </div>

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
