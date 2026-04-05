
/**
 * Cute & Friendly Loading Screen
 * Designed to feel warm, personal and "dễ thương".
 */
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md transition-opacity duration-500">
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500&display=swap');
        .font-cursive { font-family: 'Quicksand', sans-serif; }
        
        @keyframes bounce-cute {
          0%, 100% { transform: translateY(0) scaleX(1); }
          50% { transform: translateY(-20px) scaleX(0.9); }
          95% { transform: translateY(5px) scaleX(1.1); }
        }
        @keyframes shadow {
          0%, 100% { transform: translateX(-50%) scaleX(1); opacity: 0.5; }
          50% { transform: translateX(-50%) scaleX(0.7); opacity: 0.2; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 1; }
          50% { transform: translateY(-15px) rotate(15deg); opacity: 0.6; }
        }
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes jump {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .animate-bounce-cute { animation: bounce-cute 1.2s ease-in-out infinite; }
        .animate-shadow { animation: shadow 1.2s ease-in-out infinite; }
        .animate-float { animation: float 2s ease-in-out infinite; }
        .animate-float-delayed { animation: float 2.5s ease-in-out infinite 0.5s; }
        .animate-blink { animation: blink 3s infinite; }
        .animate-jump { animation: jump 1s ease-in-out infinite; }
      `}} />

      <div className="relative flex flex-col items-center gap-6">
        {/* Cute Bouncing Pill Character */}
        <div className="relative h-20 w-20">
          {/* Shadow below */}
          <div className="absolute bottom-[-10px] left-1/2 h-2 w-12 -translate-x-1/2 rounded-full bg-gray-200/50 dark:bg-neutral-800/50 blur-sm animate-shadow"></div>

          {/* The Pill Body */}
          <div className="relative h-full w-full animate-bounce-cute">
            <div className="absolute inset-0 h-1/2 w-full rounded-t-full bg-pink-400 dark:bg-pink-500"></div>
            <div className="absolute bottom-0 h-1/2 w-full rounded-b-full bg-emerald-400 dark:bg-emerald-500"></div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex gap-2 mb-1">
                <div className="h-1.5 w-1.5 rounded-full bg-white animate-blink"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-white animate-blink"></div>
              </div>
              <div className="absolute top-[55%] h-2 w-4 rounded-b-full border-b-2 border-white/80"></div>
            </div>

            <div className="absolute top-[45%] left-2 h-2 w-3 rounded-full bg-pink-300/30 blur-[2px]"></div>
            <div className="absolute top-[45%] right-2 h-2 w-3 rounded-full bg-pink-300/30 blur-[2px]"></div>
          </div>

          <div className="absolute -top-4 -right-4 text-pink-400 animate-float-delayed">
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          </div>
          <div className="absolute top-0 -left-6 text-emerald-400 animate-float">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-lg font-medium text-gray-700 dark:text-neutral-200 font-cursive animate-pulse">
            Bé chờ một xíu nhé...
          </span>
          <div className="flex gap-1.5">
            <div className="h-2 w-2 rounded-full bg-pink-400 animate-jump"></div>
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-jump [animation-delay:0.2s]"></div>
            <div className="h-2 w-2 rounded-full bg-sky-400 animate-jump [animation-delay:0.4s]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
