export default function Navbar() {
  return (
    <nav className="fixed w-full z-50 bg-main/85 backdrop-blur-md border-b border-khaki-500/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
        <a href="#" className="text-xl font-display font-bold tracking-tighter text-stone-100 group">
          MORI<span className="text-khaki-500 group-hover:text-khaki-400 transition-colors">.</span>
        </a>
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-stone-400">
          <a href="#about" className="hover:text-khaki-400 transition-colors">소개</a>
          <a href="#skills" className="hover:text-khaki-400 transition-colors">기술 스택</a>
          <a href="#projects" className="hover:text-khaki-400 transition-colors">프로젝트</a>
          <a href="#contact" className="px-6 py-2 bg-khaki-500 text-black font-bold text-xs uppercase tracking-wider rounded-full hover:bg-khaki-400 transition-colors shadow-lg shadow-khaki-900/50">Contact</a>
        </div>
      </div>
    </nav>
  );
}
