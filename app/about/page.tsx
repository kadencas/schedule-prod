"use client";
import { motion } from 'framer-motion';
import Link from 'next/link';
import { PT_Serif, Inter } from 'next/font/google';

const ptSerif = PT_Serif({
  subsets: ['latin'],
  weight: '700',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

export default function About() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#F9F7F4] to-white px-6 overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Background Elements */}
      <motion.div
        className="absolute w-[500px] h-[500px] bg-blue-200 rounded-full filter blur-[100px] opacity-30"
        style={{ top: '-200px', left: '-200px', zIndex: 0 }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] bg-green-200 rounded-full filter blur-[100px] opacity-30"
        style={{ bottom: '-150px', right: '-150px', zIndex: 0 }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Navigation */}
      <motion.div
        className="absolute top-8 left-8 flex gap-4 z-10"
        variants={itemVariants}
      >
        <Link href="/">
          <motion.button
            className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </motion.button>
        </Link>
      </motion.div>

      <motion.div 
        className="max-w-7xl mx-auto mt-24 z-10 pb-32"
        variants={itemVariants}
      >
        <motion.h1 
          className={`${ptSerif.className} text-7xl font-extrabold text-blue-600 mb-6 text-center leading-tight`}
          variants={itemVariants}
        >
          Library Scheduling Made Simple
        </motion.h1>

        <motion.p 
          className={`${inter.className} text-2xl text-gray-700 mb-12 text-center max-w-3xl mx-auto leading-relaxed`}
          variants={itemVariants}
        >
Scroll to see how our intuitive two-layer tagging system makes scheduling effortless. Quickly organize, manage, and visualize your team's shifts—saving you time and streamlining your workflow.        </motion.p>

        {/* Feature Sections */}
        <div className="space-y-16">
          {/* Tagging System */}
          <motion.div 
            className="rounded-2xl overflow-hidden shadow-2xl relative w-full"
            variants={itemVariants}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full"
              style={{ maxHeight: '90vh' }}
            >
              <source src="/videos/about-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/70 to-transparent h-[40%]">
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h2 className={`${ptSerif.className} text-4xl font-bold text-white mb-4`}>
                  Define Tags
                </h2>
                <p className={`${inter.className} text-xl text-white/95 max-w-2xl`}>
                  Create stations and tasks with custom, colors, and icons and coverage rules.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Connecting Arrow */}
          <motion.div 
            className="flex justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <motion.path
                d="M12 4L12 20M12 20L6 14M12 20L18 14"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
            </svg>
          </motion.div>

          {/* Shift Creation */}
          <motion.div 
            className="rounded-2xl overflow-hidden shadow-2xl relative w-full"
            variants={itemVariants}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full"
              style={{ maxHeight: '90vh' }}
            >
              <source src="/videos/add-tags.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/70 to-transparent h-[40%]">
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h2 className={`${ptSerif.className} text-4xl font-bold text-white mb-4`}>
                  Create Shifts
                </h2>
                <p className={`${inter.className} text-xl text-white/95 max-w-2xl`}>
                  Build employee shifts with segments connected to tags. Set complex recurrence patterns.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Connecting Arrow */}
          <motion.div 
            className="flex justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <motion.path
                d="M12 4L12 20M12 20L6 14M12 20L18 14"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
            </svg>
          </motion.div>

          {/* Team View */}
          <motion.div 
            className="rounded-2xl overflow-hidden shadow-2xl relative w-full"
            variants={itemVariants}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full"
              style={{ maxHeight: '90vh' }}
            >
              <source src="/videos/view-team.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/70 to-transparent h-[40%]">
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h2 className={`${ptSerif.className} text-4xl font-bold text-white mb-4`}>
                  Team Schedule Overview
                </h2>
                <p className={`${inter.className} text-xl text-white/95 max-w-2xl`}>
                  View and manage your team's schedule with our intuitive drag-and-drop interface.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Connecting Arrow */}
          <motion.div 
            className="flex justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <motion.path
                d="M12 4L12 20M12 20L6 14M12 20L18 14"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
            </svg>
          </motion.div>

          {/* Tag View */}
          <motion.div 
            className="rounded-2xl overflow-hidden shadow-2xl relative w-full"
            variants={itemVariants}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full"
              style={{ maxHeight: '90vh' }}
            >
              <source src="/videos/tag_view_importannt.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/70 to-transparent h-[40%]">
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h2 className={`${ptSerif.className} text-4xl font-bold text-white mb-4`}>
                  Tag Schedule Visualization
                </h2>
                <p className={`${inter.className} text-xl text-white/95 max-w-2xl`}>
                  See who's working where and when with tag view. Automatic schedule population based on user assignments.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
} 