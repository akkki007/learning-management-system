"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";

type Language = {
  name: string;
  proficiency: "Beginner" | "Intermediate" | "Advanced" | "Expert";
};

export default function CompleteProfile() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [formData, setFormData] = useState({
    education: "",
    career: "",
  });
  const [languagesKnown, setLanguagesKnown] = useState<Language[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<{ name: string; proficiency: Language['proficiency'] }>({ 
    name: "", 
    proficiency: "Beginner" 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Check if user already has a complete profile
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!isLoaded || !user) return;

      try {
        const response = await fetch("/api/user/check-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        
        if (data.hasProfile) {
          // User already has a complete profile, redirect to dashboard
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error checking profile:", error);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkExistingProfile();
  }, [user, isLoaded, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleAddLanguage = () => {
    if (currentLanguage.name.trim()) {
      const exists = languagesKnown.some(lang => 
        lang.name.toLowerCase() === currentLanguage.name.toLowerCase()
      );
      
      if (exists) {
        setError("This language is already added");
        return;
      }
      
      setLanguagesKnown([...languagesKnown, { ...currentLanguage }]);
      setCurrentLanguage({ name: "", proficiency: "Beginner" });
      setError("");
    } else {
      setError("Please enter a language name");
    }
  };

  const handleRemoveLanguage = (index: number) => {
    setLanguagesKnown(languagesKnown.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.education.trim()) {
      setError("Education is required");
      return;
    }

    if (!formData.career.trim()) {
      setError("Career is required");
      return;
    }

    if (languagesKnown.length === 0) {
      setError("Please add at least one programming language");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/user/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          education: formData.education,
          career: formData.career,
          languagesKnown: languagesKnown,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      toast.success("Profile completed successfully!");
      router.push("/dashboard");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex -mt-16 items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8 font-inter">
      <div className="max-w-md w-full bg-white rounded-2xl p-8">
        <div className="mb-8">
          <h2 className="text-center text-2xl font-extrabold text-gray-900 tracking-tighter">
            Complete Your Profile
          </h2>
          <p className="mt-2 tracking-tighter text-center text-sm text-gray-600">
            Please provide some additional information to get started
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="education" className="block text-sm font-medium text-gray-700">
              Education
            </label>
            <input
              id="education"
              name="education"
              type="text"
              required
              value={formData.education}
              onChange={handleChange}
              placeholder="e.g., Bachelor's in Computer Science"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="career" className="block text-sm font-medium text-gray-700">
              Career
            </label>
            <input
              id="career"
              name="career"
              type="text"
              required
              value={formData.career}
              onChange={handleChange}
              placeholder="e.g., Software Developer"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Programming Languages Known
              <span className="text-xs text-gray-500 block mt-1">Add at least one programming language</span>
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentLanguage.name}
                  onChange={(e) => {
                    setCurrentLanguage({ ...currentLanguage, name: e.target.value });
                    setError("");
                  }}
                  placeholder="e.g., JavaScript, Python, Java"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLanguage();
                    }
                  }}
                />
                <select
                  value={currentLanguage.proficiency}
                  onChange={(e) => setCurrentLanguage({ ...currentLanguage, proficiency: e.target.value as Language['proficiency'] })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  disabled={!currentLanguage.name.trim()}
                  className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>

              {languagesKnown.length > 0 && (
                <div className="space-y-2 mt-4 max-h-48 overflow-y-auto">
                  <p className="text-sm text-gray-600 mb-2">Added languages ({languagesKnown.length}):</p>
                  {languagesKnown.map((lang, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="text-sm text-gray-900">
                        <span className="font-medium">{lang.name}</span> - <span className="text-gray-600">{lang.proficiency}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguage(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {languagesKnown.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No languages added yet</p>
                  <p className="text-xs mt-1">Add your programming languages above</p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-400 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? "Completing..." : "Complete Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}