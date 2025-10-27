"use client";
import Navbar from "@/components/navbar";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-white">
        {/* <Navbar/> */}
        <div className="flex-column w-full items-center justify-center mt-32">
          <h1 className="text-8xl font-extrabold text-center tracking-tighter">Research made</h1>
          <h1 className="text-8xl font-extrabold tracking-tighter text-center pb-6">simple with AI</h1>
          <p className="text-center">Run any type of consumer, brand or product research with </p>
          <p className="text-center">over 3 million participants and get answers within 60 minutes</p>
          <a href="/sign-up" className="inline-block border mx-[45.6vw] mt-4 text-sm font-inter shadow-sm font-bold border-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-blue-400 hover:text-white transition">
          Get Started 
        </a>
        </div>
    </div>
  );
}
