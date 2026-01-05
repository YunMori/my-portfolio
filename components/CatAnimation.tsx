'use client';

export default function CatAnimation() {
    return (
        <>
            <style jsx>{`
                .cat-container {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 100px;
                    overflow: hidden;
                    pointer-events: none;
                    z-index: 30;
                }

                .cat {
                    position: absolute;
                    bottom: 0;
                    left: -150px;
                    width: 290px;
                    height: 150px;
                    background: url('https://raw.githubusercontent.com/ashleykleynhans/cat-walking-css-animation/master/cat.png') no-repeat;
                    animation: walk-across 20s linear infinite, walk-legs 0.8s steps(12) infinite;
                    transform-origin: center;
                }

                @keyframes walk-across {
                    0% { transform: translateX(-200px) scaleX(1); }
                    49.9% { transform: translateX(calc(100vw + 200px)) scaleX(1); }
                    50% { transform: translateX(calc(100vw + 200px)) scaleX(-1); }
                    99.9% { transform: translateX(-200px) scaleX(-1); }
                    100% { transform: translateX(-200px) scaleX(1); }
                }

                @keyframes walk-legs {
                    0% { background-position: 0 0; }
                    100% { background-position: 0 -2391px; } /* 12 frames * 199.25px or similar. The image height is 2392px. */
                    /* The sprite used here is a vertical strip. Total height ~2392px. 12 frames. */
                }
            `}</style>
            <div className="cat-container">
                <div className="cat"></div>
            </div>
        </>
    );
}
