import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
export function AboutSection() {
    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden" id="about">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute bottom-0 left-1/4 h-[35rem] w-[35rem] rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <div className="max-w-screen-xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Image container with animation */}
                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="relative h-[500px] w-full lg:w-[90%] rounded-2xl overflow-hidden">
                            <Image
                                src="/learnex.png"
                                alt="Learnex Android App"
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-40" />
                        </div>

                        {/* Stats overlay */}
                        <motion.div
                            className="absolute -right-4 -bottom-6 bg-secondary/70 backdrop-blur-sm p-6 rounded-xl border border-border shadow-md lg:max-w-[250px]"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <h4 className="text-xl font-semibold mb-4">The Problem</h4>
                            <p className="text-foreground/70 mb-4">
                                Educational social apps often prioritize engagement over learning,
                                leading to distraction rather than productive collaboration.
                            </p>
                            <div className="flex flex-col gap-3 mt-4">
                                <div>
                                    <p className="text-foreground/50 text-sm">Time spent on social apps daily</p>
                                    <p className="text-2xl font-bold text-primary">2.5 hours</p>
                                </div>
                                <div>
                                    <p className="text-foreground/50 text-sm">% of that time that&apos;s productive</p>
                                    <p className="text-2xl font-bold text-accent">Less than 20%</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Content container */}
                    <motion.div
                        className="lg:pl-6"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                            Balance Social Connection with Learning Goals
                        </h2>
                        <p className="text-foreground/70 mb-6">
                            Learnex was created to solve a common problem: how can we harness the benefits of social connection for learning without the inevitable distractions that come with traditional social media?
                        </p>

                        <div className="space-y-6 mb-8">
                            <div className="flex items-start">
                                <div className="p-2 bg-primary/10 rounded-lg mr-4 mt-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">Social Learning</h3>
                                    <p className="text-foreground/70">
                                        Learnex enables meaningful connections with peers through direct messages,
                                        group chats, and virtual meetings designed for collaborative learning.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="p-2 bg-primary/10 rounded-lg mr-4 mt-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">Focus Mode</h3>
                                    <p className="text-foreground/70">
                                        Our distraction control features help you stay on task with reminders
                                        and time management tools that nudge you back to your learning goals.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="p-2 bg-primary/10 rounded-lg mr-4 mt-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="8.5" cy="7" r="4"></circle>
                                        <line x1="20" y1="8" x2="20" y2="14"></line>
                                        <line x1="23" y1="11" x2="17" y2="11"></line>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">Goal-Driven Groups</h3>
                                    <p className="text-foreground/70">
                                        Create or join groups centered around specific learning objectives,
                                        with tools to track progress and coordinate study sessions.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center mt-8">
                            <a
                                href=""
                                className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                            >
                                Download APK
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                                    <path d="M5 12h14"></path>
                                    <path d="m12 5 7 7-7 7"></path>
                                </svg>
                            </a>
                            <a
                                href="#features"
                                className="ml-4 inline-flex items-center px-6 py-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                            >
                                Explore Features
                            </a>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
} 