"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const features = [
    { 
      title: "Adaptive Intelligence", 
      description: "Neural pathways that evolve with your learning journey, delivering hyper-personalized experiences.",
      gradient: "from-cyan-400 via-blue-500 to-purple-600"
    },
    { 
      title: "Velocity Mode", 
      description: "Real-time analytics and instant feedback loops. Progress at the speed of thought.",
      gradient: "from-purple-400 via-pink-500 to-red-500"
    },
    { 
      title: "Global Collective", 
      description: "Connect with 3M+ minds across 180 countries. Knowledge without boundaries.",
      gradient: "from-orange-400 via-red-500 to-pink-600"
    },
    { 
      title: "Future-Ready AI", 
      description: "Next-generation machine learning that predicts your needs before you do.",
      gradient: "from-emerald-400 via-cyan-500 to-blue-600"
    },
  ];

  const stats = [
    { number: "3M+", label: "Active Learners", color: "text-blue-500" },
    { number: "500+", label: "Skill Paths", color: "text-purple-500" },
    { number: "98%", label: "Success Rate", color: "text-emerald-500" },
    { number: "60min", label: "Avg. Response", color: "text-orange-500" },
  ];

  return (
    <div className="min-h-screen w-full bg-black text-white overflow-hidden font-sans antialiased">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          letter-spacing: -0.02em;
        }
      `}</style>

      <Navbar />

      {/* Dynamic Gradient Background */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div 
          className="absolute inset-0 transition-all duration-1000"
          style={{
            background: `
              radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
              radial-gradient(circle at ${100 - mousePosition.x}% ${100 - mousePosition.y}%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)
            `
          }}
        />
      </div>

      {/* Mesh Gradient Overlay */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />
      </div>

      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20">
        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />

        {/* Premium Badge */}
        <div className="mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
            </div>
            <span className="text-sm font-medium tracking-wide text-white/90">
              NEXT-GEN AI PLATFORM
            </span>
          </div>
        </div>

        {/* Hero Headline - Ultra Modern */}
        <div 
          className="text-center mb-12 animate-slide-up max-w-6xl"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        >
          <h1 className="text-7xl sm:text-8xl md:text-9xl lg:text-[12rem] font-bold tracking-tightest leading-none mb-6">
            <span className="block bg-gradient-to-r tracking-tightest from-white via-white to-white/80 bg-clip-text text-transparent">
              Research
            </span>
            <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-gradient">
              Reimagined
            </span>
          </h1>
        </div>

        {/* Subtitle - Sleek */}
        <div className="text-center mb-14 animate-slide-up max-w-3xl" style={{ animationDelay: '0.1s' }}>
          <p className="text-xl md:text-2xl text-white/60 font-light leading-relaxed">
            Harness the power of <span className="text-white font-medium">3 million minds</span> with
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-medium"> AI-driven insights </span> 
            delivered in <span className="text-white font-medium">60 minutes</span>.
          </p>
        </div>

        {/* CTA Buttons - Premium */}
        <div className="flex flex-col sm:flex-row gap-5 mb-20 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <a href="/sign-up" className="group relative px-10 py-5 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 rounded-2xl font-semibold text-lg overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/50">
            <span className="relative z-10 flex items-center justify-center gap-3">
              Start Your Journey+
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </a>
          <button className="px-10 py-5 bg-white/5 backdrop-blur-xl hover:bg-white/10 border border-white/10 rounded-2xl font-semibold text-lg transition-all hover:scale-[1.02] hover:border-white/20">
            Watch Demo
          </button>
        </div>

        {/* Trust Indicators - Futuristic */}
        <div className="flex flex-wrap items-center justify-center gap-12 text-sm animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-4">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-12 h-12 rounded-full border-2 border-black shadow-xl"
                  style={{
                    background: `linear-gradient(135deg, ${['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'][i]} 0%, ${['#3b82f6', '#8b5cf6', '#ec4899', '#f97316'][i]} 100%)`
                  }}
                />
              ))}
            </div>
            <span className="font-medium text-white/80">10,000+ Elite Researchers</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-sm bg-gradient-to-br from-yellow-400 to-orange-500" />
              ))}
            </div>
            <span className="font-medium text-white/80">4.9 Rating</span>
          </div>
        </div>
      </div>

      {/* Stats Section - Glass Morphism */}
      <div className="max-w-7xl mx-auto px-4 py-32">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="group relative text-center p-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className={`text-6xl font-bold mb-3 ${stat.color}`}>
                  {stat.number}
                </div>
                <div className="text-sm text-white/60 font-medium tracking-wide uppercase">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section - Premium Cards */}
      <div className="max-w-7xl mx-auto px-4 py-32">
        <div className="text-center mb-24">
          <h2 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              The Future of Learning
            </span>
          </h2>
          <p className="text-xl text-white/50 font-light max-w-3xl mx-auto leading-relaxed">
            Cutting-edge technology meets human potential. Experience learning without limits.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative p-12 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-500 cursor-pointer overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-white/60 text-lg leading-relaxed">{feature.description}</p>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full bg-gradient-to-r ${feature.gradient} transition-all duration-500`} />
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section - Stunning */}
      <div className="max-w-6xl mx-auto px-4 py-40">
        <div className="relative rounded-[3rem] bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 p-20 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="relative z-10">
            <h2 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
              Begin Your Evolution
            </h2>
            <p className="text-xl text-white/90 font-light mb-12 max-w-2xl mx-auto leading-relaxed">
              Join the movement. Transform your potential into performance with the world's most advanced learning platform.
            </p>
            <a href="/sign-up" className="inline-block px-12 py-6 bg-white hover:bg-gray-100 text-black text-lg font-bold rounded-2xl transition-all hover:scale-[1.02] shadow-2xl">
              Start Free Today
            </a>
          </div>
        </div>
      </div>

      {/* Footer Spacing */}
      <div className="h-32" />

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 1s ease-out forwards;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}