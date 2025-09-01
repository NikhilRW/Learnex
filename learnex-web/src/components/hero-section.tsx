import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedText } from '@/components/ui/text-animation';
import Image from 'next/image';

// This component will be the main hero section with Learnex app information and download button
export function HeroSection() {
    return (
        <section className="relative min-h-screen w-full overflow-hidden bg-background py-20 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Gradient spots */}
                <div className="absolute -top-40 -left-20 h-[35rem] w-[35rem] rounded-full bg-gradient-to-tr from-primary/20 to-blue-500/10 blur-[120px]" />
                <div className="absolute -bottom-40 -right-20 h-[35rem] w-[35rem] rounded-full bg-gradient-to-bl from-accent/15 to-purple-500/10 blur-[120px]" />

                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_70%,transparent_100%)]" />

                {/* Floating elements */}
                <div className="absolute hidden lg:block">
                    <motion.div
                        className="absolute top-1/4 left-[15%] w-6 h-6 rounded-full bg-primary/30 backdrop-blur-md"
                        animate={{ y: [0, 15, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute top-1/3 right-[10%] w-10 h-10 rounded-full bg-accent/20 backdrop-blur-md"
                        animate={{ y: [0, -20, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    />
                    <motion.div
                        className="absolute bottom-1/4 left-[20%] w-8 h-8 rounded-md rotate-45 bg-blue-500/20 backdrop-blur-md"
                        animate={{ y: [0, 25, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    />
                </div>
            </div>

            {/* Main content */}
            <div className="relative z-10 max-w-screen-xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                {/* Text section */}
                <div className="flex-1 text-center lg:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div
                            className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full mb-4 font-medium text-sm"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            INTRODUCING THE NEXT LEVEL
                        </motion.div>

                        <h1 className="text-5xl md:text-7xl font-bold mb-6">
                            <AnimatedText
                                text="Learnex"
                                className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-accent"
                                animation="fadeIn"
                                once
                            />
                        </h1>

                        <p className="text-xl text-foreground/80 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                            A social-educational Android app that perfectly balances collaboration with productivity while minimizing distractions. Connect with peers, learn together, and stay focused.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <motion.a
                                href="/app-release.apk" download={"learnex.apk"}
                                className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-gradient-to-r from-primary to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-primary/20 transition-all hover:scale-105"
                                whileHover={{ y: -3 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Download Now
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </motion.a>
                            <motion.a
                                href="#features"
                                className="inline-flex items-center justify-center px-8 py-4 rounded-lg border border-primary/20 bg-transparent hover:bg-primary/5 text-foreground font-medium transition-all"
                                whileHover={{ y: -3 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Explore Features
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </motion.a>
                        </div>

                        {/* Social proof */}
                        <motion.div
                            className="mt-10 flex items-center justify-center lg:justify-start"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                        >
                            <div className="flex -space-x-2 mr-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background overflow-hidden">
                                        <Image
                                            src={`https://avatar.iran.liara.run/public/${i % 2 === 0 ? 'girl' : 'boy'}/${20 + i}.jpg`}
                                            alt={`User ${i}`}
                                            width={32}
                                            height={32}
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-foreground/70">
                                <span className="font-semibold text-primary">12,000+</span> happy students
                            </p>
                        </motion.div>
                    </motion.div>
                </div>

                {/* App Showcase (Modern Design) */}
                <motion.div
                    className="flex-1 w-full max-w-md"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.7 }}
                >
                    <div className="relative w-full aspect-[3/4] bg-gradient-to-br from-background to-secondary/30 rounded-2xl overflow-hidden border border-border shadow-2xl hover:shadow-accent/10 transition-all">
                        {/* Phone frame */}
                        <div className="absolute top-0 w-full h-6 bg-background/80 backdrop-blur-md flex items-center justify-center">
                            <div className="w-20 h-2 rounded-full bg-foreground/20"></div>
                        </div>

                        <div className="h-full w-full pt-8 p-4 flex flex-col">
                            <div className="flex items-center mb-4">
                                <div className="w-3 h-3 rounded-full bg-primary mr-2" />
                                <div className="w-3 h-3 rounded-full bg-accent mr-2" />
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="ml-auto text-sm text-foreground/70 font-mono">Learnex v1.2.0</div>
                            </div>

                            <div className="flex-1 overflow-hidden rounded-xl bg-background/40 backdrop-blur-sm p-5 border border-border/60 shadow-inner">
                                <div className="h-full flex flex-col">
                                    <div className="text-xl font-bold mb-4 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                        </svg>
                                        Learnex Social
                                    </div>

                                    <div className="flex-1 font-mono text-sm overflow-hidden space-y-4">
                                        <motion.div
                                            className="bg-gradient-to-r from-primary/10 to-blue-500/5 p-4 rounded-lg border border-primary/10"
                                            whileHover={{ y: -3, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                                        >
                                            <div className="font-bold text-primary mb-1">Goal-Driven Groups</div>
                                            <div className="text-foreground/80 text-xs">Connect with peers working on similar objectives</div>
                                        </motion.div>

                                        <motion.div
                                            className="bg-gradient-to-r from-accent/10 to-purple-500/5 p-4 rounded-lg border border-accent/10"
                                            whileHover={{ y: -3, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                                        >
                                            <div className="font-bold text-accent mb-1">Virtual Meetings</div>
                                            <div className="text-foreground/80 text-xs">Focus-driven video collaboration</div>
                                        </motion.div>

                                        <motion.div
                                            className="bg-gradient-to-r from-blue-500/10 to-primary/5 p-4 rounded-lg border border-blue-500/10"
                                            whileHover={{ y: -3, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                                        >
                                            <div className="font-bold text-blue-500 mb-1">Distraction Control</div>
                                            <div className="text-foreground/80 text-xs">Smart features to keep you on track</div>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-between items-center px-2">
                                <motion.div
                                    className="flex items-center text-xs text-foreground/70"
                                    animate={{ opacity: [0.7, 1, 0.7] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
                                    Active
                                </motion.div>
                                <div className="text-xs text-foreground/70 font-mono">4 Online</div>
                                <div className="text-xs text-primary">Focus Mode</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                <div className="w-8 h-12 rounded-full border-2 border-foreground/30 flex items-start justify-center p-2">
                    <motion.div
                        className="w-1 h-2 rounded-full bg-primary"
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                </div>
            </motion.div>
        </section>
    );
} 