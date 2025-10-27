"use client";

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex -mt-16 items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8 font-inter">
      <div className="max-w-md w-full bg-white rounded-2xl p-8">
        <div className="mb-8">
          <h2 className="text-center text-2xl font-extrabold text-gray-900 tracking-tighter">
            Create your account
          </h2>
        </div>

        <div className="flex justify-center">
          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-blue-400 hover:bg-blue-500 text-sm normal-case',
                card: 'shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'border-gray-300 hover:bg-gray-50',
                formFieldInput: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                footerActionLink: 'text-blue-400 hover:text-blue-500'
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}