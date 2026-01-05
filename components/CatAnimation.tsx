'use client';

export default function CatAnimation() {
    return (
        <>
            <style jsx>{`
                @keyframes catWalk {
                    0% { transform: translateX(-100px) scaleX(1); }
                    45% { transform: translateX(calc(100vw + 100px)) scaleX(1); }
                    50% { transform: translateX(calc(100vw + 100px)) scaleX(-1); }
                    95% { transform: translateX(-100px) scaleX(-1); }
                    100% { transform: translateX(-100px) scaleX(1); }
                }
                @keyframes catHop {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .cat-walk {
                    animation: catWalk 20s linear infinite;
                }
                .cat-hop {
                    animation: catHop 0.5s ease-in-out infinite;
                }
            `}</style>
            <div className="absolute bottom-0 w-full h-12 overflow-hidden pointer-events-none z-30">
                <div className="absolute bottom-0 cat-walk">
                    <div className="cat-hop text-stone-600">
                        <i className="fa-solid fa-cat text-3xl"></i>
                    </div>
                </div>
            </div>
        </>
    );
}
