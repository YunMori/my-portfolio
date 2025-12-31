export default function Hero() {
    return (
        <section className="relative min-h-[85vh] flex items-center justify-center pt-16 px-6 overflow-hidden">
            {/* Abstract Backgrounds */}
            <div className="absolute top-20 right-[10%] w-96 h-96 bg-khaki-900/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-20 left-[10%] w-80 h-80 bg-brown-600/10 rounded-full blur-[80px]"></div>

            <div className="max-w-5xl mx-auto text-center relative z-10 fade-in-section opacity-0 translate-y-5 transition-all duration-700">
                <span className="inline-block py-1.5 px-4 border border-stone-800 bg-surface text-stone-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-8 rounded-full">
                    Data-Driven Portfolio
                </span>
                <h1 className="text-5xl md:text-8xl font-display font-bold mb-8 leading-tight text-stone-100">
                    DATA PROVES<br />
                    <span className="bg-gradient-to-br from-khaki-400 to-khaki-600 bg-clip-text text-transparent">EXPERIENCE.</span>
                </h1>
                <p className="text-lg md:text-xl text-stone-500 max-w-2xl mx-auto mb-12 font-light">
                    블랙과 카키의 조화처럼, <strong className="text-khaki-400">디자인 감각</strong>과 <strong className="text-brown-400">견고한 코드</strong>가<br className="hidden md:block" />
                    어우러진 웹 경험을 만듭니다.
                </p>
                <div className="flex justify-center">
                    <a href="#projects" className="group px-8 py-4 bg-transparent border border-khaki-500 text-khaki-500 font-bold hover:bg-khaki-500 hover:text-black transition-all duration-300 rounded-full flex items-center gap-2">
                        프로젝트 확인하기 <i className="fa-solid fa-arrow-down group-hover:translate-y-1 transition-transform"></i>
                    </a>
                </div>
            </div>
        </section>
    );
}
