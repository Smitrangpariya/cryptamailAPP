import React, { useState } from 'react';
import CryptaMailLogo from './ui/CryptaMailLogo';
import CryptaMailLoader from './ui/CryptaMailLoader';
import CryptaMailIcon from './ui/CryptaMailIcon';
import CryptaMailFavicon from './ui/CryptaMailFavicon';

export default function AnimationShowcase() {
  const [activeDemo, setActiveDemo] = useState('logo');

  return (
    <div className="min-h-screen bg-slate-950 dark:bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">CryptaMail Animation Showcase</h1>
        
        {/* Navigation tabs */}
        <div className="flex justify-center gap-4 mb-12">
          {[
            { id: 'logo', name: 'Main Logo' },
            { id: 'loader', name: 'Loading' },
            { id: 'icon', name: 'App Icon' },
            { id: 'favicon', name: 'Favicon' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDemo(tab.id)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeDemo === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Demo content */}
        <div className="bg-slate-900 dark:bg-black rounded-2xl p-12 min-h-[600px] flex items-center justify-center">
          {activeDemo === 'logo' && (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-6">Main Logo Animation</h2>
              <p className="text-slate-400 mb-8 max-w-md">
                The complete CryptaMail logo with encrypted symbols, envelope formation, lock animation, and particle effects. 
                Duration: ~4.5 seconds
              </p>
              <CryptaMailLogo width={400} height={400} />
            </div>
          )}

          {activeDemo === 'loader' && (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-6">Loading Animation</h2>
              <p className="text-slate-400 mb-8 max-w-md">
                Seamless looping animation for app loading states with rotating envelope, flowing particles, and brief lock appearance.
              </p>
              <CryptaMailLoader size={120} />
            </div>
          )}

          {activeDemo === 'icon' && (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-6">Interactive App Icon</h2>
              <p className="text-slate-400 mb-8 max-w-md">
                Click the icon to see the micro-interaction animation. Lock opens, particles flow inside, then closes again.
                Duration: 1.5 seconds
              </p>
              <div className="inline-block">
                <CryptaMailIcon size={96} animated={true} />
              </div>
              <p className="text-sm text-slate-500 mt-4">Click the icon above to see the animation</p>
            </div>
          )}

          {activeDemo === 'favicon' && (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-6">Favicon</h2>
              <p className="text-slate-400 mb-8 max-w-md">
                Minimal design for browser tabs and shortcuts. Clean envelope with lock symbol.
              </p>
              <div className="inline-block p-8 bg-white dark:bg-slate-900 rounded-lg">
                <CryptaMailFavicon size={64} />
              </div>
            </div>
          )}
        </div>

        {/* Technical specifications */}
        <div className="mt-12 bg-slate-900 dark:bg-black rounded-xl p-8">
          <h3 className="text-lg font-semibold text-white mb-4">Animation Specifications</h3>
          <div className="grid md:grid-cols-2 gap-8 text-slate-300">
            <div>
              <h4 className="font-medium text-blue-400 mb-2">🎨 Design Principles</h4>
              <ul className="space-y-1 text-sm">
                <li>• Minimal and clean aesthetics</li>
                <li>• Cybersecurity-focused visuals</li>
                <li>• No red/green colors (avoid Gmail/ProtonMail similarity)</li>
                <li>• Privacy and trust themes</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-purple-400 mb-2">🎭 Color Palette</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  <span>Deep Blue (#3B82F6)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-400 rounded"></div>
                  <span>Sky Blue (#60A5FA)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-cyan-400 rounded"></div>
                  <span>Cyan (#06B6D4)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span>Violet (#8B5CF6)</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-cyan-400 mb-2">⚡ Performance</h4>
              <ul className="space-y-1 text-sm">
                <li>• Optimized for web and mobile</li>
                <li>• Pure CSS animations (no external libraries)</li>
                <li>• 60fps smooth transitions</li>
                <li>• GPU-accelerated transforms</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-green-400 mb-2">🔒 Security Theme</h4>
              <ul className="space-y-1 text-sm">
                <li>• Encryption symbolism</li>
                <li>• Lock and key metaphors</li>
                <li>• Particle data flow</li>
                <li>• Protected envelope imagery</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}