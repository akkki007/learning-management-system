"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useUser, UserButton } from '@clerk/nextjs';

const Navbar: React.FC = () => {
  const { isSignedIn, user } = useUser();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled 
        ? 'bg-black/80 backdrop-blur-2xl border-b border-white/10' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold">
            <h1 className="tracking-tight hover:opacity-70 transition-opacity cursor-pointer">
              <span className="text-white">Skills</span>
              <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">era</span>
            </h1>
          </Link>

          {/* Desktop Nav Links */}
          <ul className="hidden md:flex items-center space-x-1 text-[15px] font-medium">
            <li className="text-white/70 hover:text-white px-5 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-all">
              Solutions
            </li>
            <li className="text-white/70 hover:text-white px-5 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-all">
              Features
            </li>
            <li className="text-white/70 hover:text-white px-5 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-all">
              Pricing
            </li>
            <li className="text-white/70 hover:text-white px-5 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-all">
              Resources
            </li>
          </ul>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isSignedIn ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-white/70 hover:text-white px-5 py-2.5 rounded-xl hover:bg-white/5 transition-all">
                  Assessment
                </Link>
                <Link href="/roadmap" className="text-sm font-medium text-white/70 hover:text-white px-5 py-2.5 rounded-xl hover:bg-white/5 transition-all">
                  Roadmap
                </Link>
                <div className="ml-2">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </>
            ) : (
              <>
                <Link href="/sign-in" className="text-sm font-medium text-white/70 hover:text-white px-5 py-2.5 rounded-xl hover:bg-white/5 transition-all">
                  Sign in
                </Link>
                <Link href="/sign-up" className="group relative text-sm font-semibold px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/50 overflow-hidden">
                  <span className="relative z-10">Get started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2.5 rounded-xl hover:bg-white/5 transition-all"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-6 pb-6 border-t border-white/10 pt-6 animate-slideDown">
            <ul className="space-y-2 mb-6">
              <li className="text-white/70 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl cursor-pointer transition-all font-medium">
                Solutions
              </li>
              <li className="text-white/70 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl cursor-pointer transition-all font-medium">
                Features
              </li>
              <li className="text-white/70 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl cursor-pointer transition-all font-medium">
                Pricing
              </li>
              <li className="text-white/70 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl cursor-pointer transition-all font-medium">
                Resources
              </li>
            </ul>
            
            <div className="space-y-3 pt-4 border-t border-white/10">
              {isSignedIn ? (
                <>
                  <Link href="/dashboard" className="block w-full text-center text-sm font-medium text-white/70 hover:text-white px-4 py-3 rounded-xl hover:bg-white/5 transition-all">
                    Assessment
                  </Link>
                  <Link href="/roadmap" className="block w-full text-center text-sm font-medium text-white/70 hover:text-white px-4 py-3 rounded-xl hover:bg-white/5 transition-all">
                    Roadmap
                  </Link>
                  <div className="flex justify-center pt-3">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </>
              ) : (
                <>
                  <Link href="/sign-in" className="block w-full text-center text-sm font-medium text-white/70 hover:text-white px-4 py-3 rounded-xl hover:bg-white/5 transition-all">
                    Sign in
                  </Link>
                  <Link href="/sign-up" className="block w-full text-center text-sm font-semibold px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white transition-all hover:scale-[1.02]">
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;