
export default function Footer() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer id="contact" className="bg-stone-950 border-t border-stone-900 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12">
                    <div className="mb-8 md:mb-0 text-center md:text-left">
                        <h2 className="text-2xl font-display font-bold text-stone-100 mb-2">Let's Work Together.</h2>
                        <p className="text-stone-500 text-sm">데이터 기반의 의사결정과 크리에이티브한 구현.</p>
                    </div>

                    <div className="flex gap-4">
                        <a href="#" className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center text-stone-500 hover:bg-khaki-500 hover:text-black transition-all duration-300">
                            <i className="fa-brands fa-github text-lg"></i>
                        </a>
                        <a href="#" className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center text-stone-500 hover:bg-khaki-500 hover:text-black transition-all duration-300">
                            <i className="fa-brands fa-linkedin text-lg"></i>
                        </a>
                        <a href="mailto:contact@example.com" className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center text-stone-500 hover:bg-khaki-500 hover:text-black transition-all duration-300">
                            <i className="fa-solid fa-envelope text-lg"></i>
                        </a>
                    </div>
                </div>

                <div className="border-t border-stone-900 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-stone-600">
                    <p>&copy; {new Date().getFullYear()} Yun Jong Seo. All rights reserved.</p>
                    <button
                        onClick={scrollToTop}
                        className="mt-4 md:mt-0 flex items-center hover:text-khaki-500 transition-colors"
                    >
                        Back to Top <i className="fa-solid fa-arrow-up ml-2"></i>
                    </button>
                </div>
            </div>
        </footer>
    );
}
