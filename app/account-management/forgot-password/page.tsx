"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#F9F7F4] px-6 overflow-hidden">
      <motion.button
        onClick={() => router.back()}
        className="absolute top-6 left-6 flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors z-20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back</span>
      </motion.button>
      <motion.div
        className="absolute w-64 h-64 bg-blue-200 rounded-full filter blur-3xl"
        style={{ top: "-100px", left: "-100px", zIndex: 0 }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-48 h-48 bg-green-200 rounded-full filter blur-3xl"
        style={{ bottom: "-50px", right: "-50px", zIndex: 0 }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">
          Forgot Password
        </h1>
        <p className="text-center text-gray-600">
          Too bad! You should have been more careful... I haven't built this feature yet. Please contact Kaden.
        </p>
      </motion.div>
    </div>
  );
} 