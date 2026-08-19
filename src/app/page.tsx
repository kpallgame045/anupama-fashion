"use client";

import React, { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  FabricSparkleIcon,
  GoldFlourishDivider,
} from "@/components/FashionIcons";
import { ExternalLink, RefreshCw, Sparkles, AlertCircle, Check } from "lucide-react";

const INITIAL_ENGLISH_REVIEW =
  "Found a wonderful collection of women's wear at ANUPAMA FASHION in Kudasan! Loved the quality and unique variety of one-piece and two-piece outfits. Great fitting and very comfortable shopping experience in Gandhinagar.";

const INITIAL_GUJARATI_REVIEW =
  "ANUPAMA FASHION Kudasan ma shopping karvano experience ghano saro rahyo. Women's clothing ma one-piece ane two-piece collection ni variety ghani sari che. Quality ane fitting ekdam perfect che!";

export default function Home() {
  const [selectedLanguage, setSelectedLanguage] = useState<"English" | "Gujarati">("English");
  const [reviewDraft, setReviewDraft] = useState<string>(INITIAL_ENGLISH_REVIEW);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  const activeRequestRef = useRef<boolean>(false);

  const googleReviewUrl = "https://g.page/r/CWzrHhE76rD0EBE/review";
  const instagramUrl = "https://www.instagram.com/flashdesign_ai/";

  // Fast review generator with lock to prevent duplicate simultaneous calls
  const generateReview = useCallback(async (lang: "English" | "Gujarati") => {
    if (activeRequestRef.current) return;
    activeRequestRef.current = true;

    setIsGenerating(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          language: lang,
        }),
      });

      const data = await response.json();

      if (data.success && data.reviewText) {
        setReviewDraft(data.reviewText);
      } else {
        setErrorMessage(data.error || "Failed to generate review.");
      }
    } catch (error: any) {
      console.error("Failed to generate and insert review:", error);
      setErrorMessage(error.message || "Network error during review generation.");
    } finally {
      setIsGenerating(false);
      activeRequestRef.current = false;
    }
  }, []);

  const handleLanguageChange = (lang: "English" | "Gujarati") => {
    if (lang !== selectedLanguage && !isGenerating) {
      setSelectedLanguage(lang);
      if (lang === "English") {
        setReviewDraft(INITIAL_ENGLISH_REVIEW);
      } else {
        setReviewDraft(INITIAL_GUJARATI_REVIEW);
      }
      generateReview(lang);
    }
  };

  const handleGenerateAnother = () => {
    if (!isGenerating) {
      generateReview(selectedLanguage);
    }
  };

  // Bulletproof Click-to-Copy & Redirect Handler for Mobile & Desktop
  const handlePostToGoogle = async () => {
    if (!reviewDraft) return;

    // 1. Immediately copy the EXACT currently displayed review to clipboard
    let copySuccess = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(reviewDraft);
        copySuccess = true;
      } else {
        // Fallback for older mobile browsers or webviews
        const textArea = document.createElement("textarea");
        textArea.value = reviewDraft;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copySuccess = document.execCommand("copy");
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error("Primary clipboard write error:", err);
      try {
        const textArea = document.createElement("textarea");
        textArea.value = reviewDraft;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copySuccess = document.execCommand("copy");
        document.body.removeChild(textArea);
      } catch {
        copySuccess = false;
      }
    }

    // 2. Show instant confirmation badge
    setCopiedToast(true);
    setTimeout(() => {
      setCopiedToast(false);
    }, 3500);

    // 3. Automatically open Google Review URL in new tab directly within user click handler
    window.open(googleReviewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-boutique-bg text-boutique-textPrimary relative overflow-hidden selection:bg-boutique-goldLight selection:text-boutique-textPrimary">
      {/* Subtle Warm Boutique Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-light-radial pointer-events-none opacity-80" />
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-boutique-champagne/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-boutique-goldLight/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Container */}
      <main className="w-full max-w-md mx-auto px-4 py-8 relative z-10 flex-1 flex flex-col justify-start">
        {/* 1. HERO & HIGHLY HIGHLIGHTED LOGO */}
        <header className="text-center flex flex-col items-center mb-6">
          {/* Prominent Logo Presentation Card Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative mb-5 p-4 rounded-3xl logo-hero-frame"
          >
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="ANUPAMA FASHION Logo"
                fill
                priority
                className="object-contain p-1"
              />
            </div>
          </motion.div>

          {/* Elegant Fashion Boutique Heading */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-1.5 text-center"
          >
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-boutique-surfaceWarm border border-boutique-borderGold text-boutique-goldMuted uppercase tracking-widest">
              <FabricSparkleIcon className="w-3.5 h-3.5 text-boutique-gold" /> Women's Clothing Boutique
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-boutique-textPrimary mt-2">
              Share Your <span className="gold-shimmer font-serif">Fashion Experience</span>
            </h1>
          </motion.div>

          <GoldFlourishDivider className="w-44 h-5 my-4 opacity-80" />
        </header>

        {/* 2. CORE AUTOMATIC REVIEW FLOW */}
        <section className="space-y-5">
          {/* LANGUAGE SELECTOR - Top of Review Section */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="space-y-1.5"
          >
            <label className="block text-[11px] uppercase tracking-wider text-boutique-textMuted text-center font-medium">
              Select Language / ભાષા પસંદ કરો
            </label>

            {/* Exactly Two Options: English | ગુજરાતી */}
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-white border border-boutique-borderGold shadow-card-light">
              <button
                type="button"
                onClick={() => handleLanguageChange("English")}
                disabled={isGenerating}
                className={`py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  selectedLanguage === "English"
                    ? "bg-gold-gradient text-white font-semibold shadow-gold-btn"
                    : "text-boutique-textSecondary hover:text-boutique-goldMuted hover:bg-boutique-surfaceWarm"
                }`}
              >
                English
              </button>

              <button
                type="button"
                onClick={() => handleLanguageChange("Gujarati")}
                disabled={isGenerating}
                className={`py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  selectedLanguage === "Gujarati"
                    ? "bg-gold-gradient text-white font-semibold shadow-gold-btn"
                    : "text-boutique-textSecondary hover:text-boutique-goldMuted hover:bg-boutique-surfaceWarm"
                }`}
              >
                ગુજરાતી
              </button>
            </div>
          </motion.div>

          {/* GENERATED REVIEW CARD / LOADING / ERROR DISPLAY */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                /* LOADING STATE CARD */
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-8 rounded-2xl glass-card-light space-y-3 shadow-card-light text-center flex flex-col items-center justify-center min-h-[160px]"
                >
                  <RefreshCw className="w-6 h-6 animate-spin text-boutique-goldMuted mb-1" />
                  <p className="text-sm font-serif font-medium text-boutique-goldMuted tracking-wide">
                    Creating your fresh AI review...
                  </p>
                </motion.div>
              ) : errorMessage ? (
                /* ERROR STATE CARD */
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 shadow-card-light text-center"
                >
                  <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
                  <p className="text-xs text-amber-900 font-medium leading-relaxed">
                    {errorMessage}
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateAnother}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-amber-600 text-white shadow-sm hover:bg-amber-700 transition-colors cursor-pointer"
                  >
                    Retry Generation
                  </button>
                </motion.div>
              ) : (
                /* GENERATED REVIEW CARD & ACTION BUTTONS */
                <motion.div
                  key="review"
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Modern, Clean Sans-Serif Highly Readable Review Box */}
                  <div className="p-6 rounded-2xl bg-white border border-boutique-borderGold shadow-card-light relative">
                    <p className="text-base sm:text-[17px] leading-[1.6] text-boutique-textPrimary font-sans font-normal tracking-normal select-all">
                      {reviewDraft}
                    </p>
                  </div>

                  {/* Temporary Toast Banner upon Copying */}
                  <AnimatePresence>
                    {copiedToast && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium text-center flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Check className="w-4 h-4 text-emerald-600" />
                        Review copied to clipboard — paste it on Google!
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* EXACT ORDER OF BUTTONS: 1. POST REVIEW ON GOOGLE (Primary) -> 2. GENERATE ANOTHER REVIEW (Secondary) */}
                  <div className="space-y-2.5 pt-1">
                    {/* PRIMARY ACTION BUTTON: POST REVIEW ON GOOGLE */}
                    <button
                      type="button"
                      onClick={handlePostToGoogle}
                      className="w-full py-4 px-6 rounded-2xl font-serif font-semibold text-base shadow-gold-btn hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer bg-gold-gradient text-white border border-boutique-gold/30"
                    >
                      {copiedToast ? (
                        <>
                          <Check className="w-5 h-5 text-white animate-bounce" />
                          REVIEW COPIED! OPENING GOOGLE...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 text-white animate-pulse" />
                          POST REVIEW ON GOOGLE
                          <ExternalLink className="w-4 h-4 text-white/90" />
                        </>
                      )}
                    </button>

                    {/* SECONDARY ACTION BUTTON: GENERATE ANOTHER REVIEW */}
                    <button
                      type="button"
                      onClick={handleGenerateAnother}
                      disabled={isGenerating}
                      className="w-full py-3.5 px-6 rounded-2xl font-serif font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer bg-white text-boutique-goldMuted border border-boutique-borderGold hover:bg-boutique-surfaceWarm hover:text-boutique-textPrimary shadow-card-light active:scale-[0.99]"
                    >
                      <RefreshCw className="w-4 h-4 text-boutique-goldMuted" />
                      GENERATE ANOTHER REVIEW
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* 3. ELEGANT BOUTIQUE FOOTER */}
      <footer className="w-full py-5 border-t border-boutique-borderGold bg-white/80 backdrop-blur-md relative z-10 text-center text-xs text-boutique-textSecondary">
        <div className="max-w-md mx-auto px-4 flex flex-col items-center justify-center gap-1">
          <p className="tracking-wide font-medium">
            Powered by{" "}
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-boutique-goldMuted hover:underline hover:text-boutique-gold transition-colors inline-flex items-center gap-1"
            >
              FlashDesign AI
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>

          <p className="text-[10px] text-boutique-textMuted">
            ANUPAMA FASHION &copy; {new Date().getFullYear()} &bull; Women&apos;s Clothing Boutique
          </p>
        </div>
      </footer>
    </div>
  );
}
