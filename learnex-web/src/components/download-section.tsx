import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Download section component
export function DownloadSection() {
    const [activeTab, setActiveTab] = useState('download');

    return (
        <section id="download" className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <motion.div
                        className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full mb-2 font-medium text-sm"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        DOWNLOAD
                    </motion.div>
                    <motion.h2
                        className="text-2xl sm:text-3xl font-bold mb-4"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        Get Learnex Now
                    </motion.h2>
                    <motion.p
                        className="text-foreground/70 text-base max-w-lg mx-auto"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        Download our Android app to experience focused social learning
                    </motion.p>
                </div>

                {/* Tabs */}
                <div className="mb-8 flex justify-center">
                    <div className="inline-flex rounded-md shadow-sm p-1 bg-secondary/20 border border-border">
                        <button
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'download'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-foreground/70 hover:text-foreground'
                                }`}
                            onClick={() => setActiveTab('download')}
                        >
                            Download
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'install'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-foreground/70 hover:text-foreground'
                                }`}
                            onClick={() => setActiveTab('install')}
                        >
                            Installation
                        </button>
                    </div>
                </div>

                {/* Content based on active tab */}
                <motion.div
                    className="rounded-xl bg-secondary/10 backdrop-blur-sm border border-border p-6 overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <div className={activeTab === 'download' ? 'block' : 'hidden'}>
                        <div className="flex flex-col items-center md:flex-row md:items-start md:justify-between gap-6">
                            <div className="md:max-w-sm">
                                <h3 className="text-lg font-bold mb-3">Direct APK Download</h3>
                                <p className="text-foreground/70 text-sm mb-4">
                                    Get the latest version of Learnex directly from our website.
                                </p>

                                <ul className="space-y-2 text-sm mb-5">
                                    <li className="flex items-start">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2 mt-1 shrink-0">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        <span>Version 1.3.0 (Latest Release)</span>
                                    </li>
                                    <li className="flex items-start">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2 mt-1 shrink-0">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        <span>File size: 15.8 MB</span>
                                    </li>
                                    <li className="flex items-start">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2 mt-1 shrink-0">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        <span>Android 7.0+ required</span>
                                    </li>
                                </ul>

                                <details className="mb-4 text-sm">
                                    <summary className="font-medium cursor-pointer text-primary hover:underline">What's New in v1.3.0</summary>
                                    <div className="mt-2 pl-2 border-l-2 border-primary/20">
                                        <p className="font-semibold mb-1">Major New Features:</p>
                                        <ul className="space-y-1 mb-2">
                                            <li>• LexAI: Your intelligent AI companion</li>
                                            <li>• Group Tasks: Get things done together</li>
                                            <li>• Room-Task Integration: Smart linking between study rooms and tasks</li>
                                        </ul>
                                        <p className="font-semibold mb-1">Improvements:</p>
                                        <ul className="space-y-1">
                                            <li>• Enhanced direct messages with sound notifications</li>
                                            <li>• Multiple bug fixes and performance improvements</li>
                                        </ul>
                                    </div>
                                </details>

                                <a
                                    href="/app-release.apk"
                                    download="learnex.apk"
                                    className="inline-flex items-center px-5 py-2 rounded-lg bg-gradient-to-r from-primary to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                                >
                                    Download APK
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                </a>
                            </div>

                            <div className="bg-background/30 p-4 rounded-lg border border-border/50 max-w-sm">
                                <h3 className="text-lg font-bold mb-3">Coming Soon to Play Store</h3>
                                <p className="text-foreground/70 text-sm mb-4">
                                    We&apos;re working on bringing Learnex to the Google Play Store for easier installation and updates.
                                </p>
                                <div className="flex items-center justify-center p-3 rounded-md border border-dashed border-border/50 bg-secondary/10">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                    </svg>
                                    <span className="text-sm">Stay tuned for updates!</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={activeTab === 'install' ? 'block' : 'hidden'}>
                        <h3 className="text-lg font-bold mb-4">Installation Guide</h3>

                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-2 text-base">Step 1: Enable Unknown Sources</h4>
                                <p className="text-foreground/70 text-sm mb-2">
                                    Open your Android device&apos;s Settings and follow these steps:
                                </p>
                                <ul className="space-y-1 text-sm mb-2">
                                    <li className="flex items-start">
                                        <span className="text-primary mr-2">•</span>
                                        Navigate to Security or Privacy settings
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-primary mr-2">•</span>
                                        Enable &quot;Unknown Sources&quot; or &quot;Install Unknown Apps&quot;
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-primary mr-2">•</span>
                                        If prompted, select your browser or file manager from the list
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2 text-base">Step 2: Download the APK</h4>
                                <p className="text-foreground/70 text-sm mb-2">
                                    Download the Learnex APK from our website by clicking the download button in the Download tab.
                                </p>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2 text-base">Step 3: Install Learnex</h4>
                                <p className="text-foreground/70 text-sm mb-2">
                                    After downloading:
                                </p>
                                <ul className="space-y-1 text-sm mb-2">
                                    <li className="flex items-start">
                                        <span className="text-primary mr-2">•</span>
                                        Open your file manager
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-primary mr-2">•</span>
                                        Navigate to Downloads folder
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-primary mr-2">•</span>
                                        Tap the learnex.apk file to start installation
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-primary mr-2">•</span>
                                        Tap &quot;Install&quot; when prompted
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2 text-base">Step 4: Finish</h4>
                                <p className="text-foreground/70 text-sm">
                                    For security reasons, remember to disable &quot;Unknown Sources&quot; in your device settings after installation. Open Learnex from your app drawer to get started!
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
} 