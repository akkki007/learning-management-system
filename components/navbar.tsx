"use client";
import Link from "next/link";
import React from "react";
import { useUser, SignInButton, UserButton } from '@clerk/nextjs';

const Navbar: React.FC = () => {
  const { isSignedIn, user } = useUser();

  return (
    <nav className="flex items-center justify-between mt-7 mr-36 px-8 py-4 bg-white ">
      {/* Logo */}
      <div className="text-2xl text-gray-900 ml-52">
        <h1 className="font-inter tracking-tighter font-extrabold">Skills<span className="text-orange-300">era</span></h1>
      </div>

      {/* Nav Links */}
      <ul className="hidden md:flex items-center space-x-4 text-[15px] font-medium text-gray-800">
        <li className="hover:bg-gray-100 p-2.5 py-1.5 rounded-lg tracking-tight font-semibold cursor-pointer">
          Solutions
        </li>
        <li className="hover:bg-gray-100 p-2.5 py-1.5 rounded-lg tracking-tight font-semibold cursor-pointer">
          Solutions
        </li>
        <li className="hover:bg-gray-100 p-2.5 py-1.5 rounded-lg tracking-tight font-semibold cursor-pointer">
          Solutions
        </li>
        <li className="hover:bg-gray-100 p-2.5 py-[6px] rounded-lg tracking-tight font-semibold cursor-pointer">
          Solutions
        </li>
      </ul>

      {/* Buttons */}
      <div className="flex items-center space-x-4">
        {isSignedIn ? (
          <>
            <Link href="/dashboard" className="border text-sm font-inter shadow-sm font-bold border-gray-300 text-gray-800 px-4 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition">
              Assessment
            </Link>
            <Link href="/roadmap" className="border text-sm font-inter shadow-sm font-bold border-gray-300 text-gray-800 px-4 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition">
              Roadmap
            </Link>
            <UserButton afterSignOutUrl="/" />
          </>
        ) : (
          <>
            <Link href="/sign-in" className="border text-sm font-inter shadow-sm font-bold border-gray-300 text-gray-800 px-4 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition">
              Sign In
            </Link>
            <Link href="/sign-up" className="border text-sm font-inter shadow-sm font-bold border-gray-300  px-4 py-2 rounded-md bg-blue-400 hover:bg-blue-500 cursor-pointer text-white transition">
              Get Started 
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
