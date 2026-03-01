import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';

export function LexAISection() {

    const features = [
        {
            title: 'Intelligent Assistance',
            description: 'Get instant help with your studies using our advanced AI that understands context and provides personalized support',
            icon: '🤖'
        },
        {
            title: 'Smart Study Planning',
            description: 'AI-powered study schedules, goal tracking, and progress monitoring tailored to your learning style',
            icon: '📊'
        },
        {
            title: 'Voice Commands',
            description: 'Coming Soon: Control your Learnex app with natural voice commands - "Create room ABC" or "Schedule study session"',
            icon: '🎤'
        },
        {
            title: 'App Integration',
            description: 'Seamlessly integrated with all Learnex features to enhance your learning experience',
            icon: '🔗'
        }
    ];

    return (
        <section id="lex-ai" className="bg-background relative py-16 overflow-hidden">
            {/* Gradient background elements */}
            <div className="absolute top-0 inset-x-0 h-[25rem] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-[20rem] bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

            {/* Floating elements */}
            <motion.div
                className="absolute top-1/4 right-1/4 w-8 h-8 rounded-xl rotate-12 bg-primary/10 backdrop-blur-sm border border-primary/20"
                animate={{
                    y: [0, 15, 0],
                    rotate: [12, 20, 12],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="container max-w-7xl mx-auto px-4 relative z-10">
                {/* Section header */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                    <motion.div
                        className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full mb-2 font-medium text-xs"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        AI-POWERED LEARNING
                    </motion.div>
                    <motion.h2
                        className="text-2xl md:text-3xl font-bold mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        Meet Lex AI
                    </motion.h2>
                    <motion.p
                        className="text-foreground/70 text-base"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        Your intelligent study companion that provides personalized assistance, smart study planning, and seamless integration with all Learnex features.
                    </motion.p>
                </div>

                {/* Video Demo Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
                    {/* Video Phone Frame */}
                    <motion.div
                        className="relative max-w-[50rem] w-[50vw] mx-auto"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        {/* Phone Frame - Same as App Showcase */}
                        <div className="relative rounded-[38px] overflow-hidden border-[6px] border-secondary/90 shadow-2xl bg-black max-w-[240px] mx-auto">
                            {/* Modern status bar with dynamic island */}
                            <div className="absolute top-0 z-10 w-full h-6 bg-black flex items-center justify-between px-3">
                                <div className="text-white text-[8px] font-medium">9:41</div>
                                {/* Dynamic island style notch */}
                                <div className="absolute left-1/2 top-0 transform -translate-x-1/2 w-14 h-4 bg-black rounded-b-xl" />
                                <div className="flex space-x-1.5">
                                    <div className="flex space-x-0.5">
                                        <div className="h-1.5 w-1.5 rounded-sm bg-white/90" />
                                        <div className="h-1.5 w-1.5 rounded-sm bg-white/90" />
                                        <div className="h-1.5 w-1.5 rounded-sm bg-white/90" />
                                        <div className="h-1.5 w-1.5 rounded-sm bg-white/90" />
                                    </div>
                                    <div className="w-2 h-1.5 bg-white/90 rounded-sm" />
                                    <div className="flex items-center">
                                        <div className="w-2.5 h-1.5 bg-white/90 rounded-[1px]" />
                                    </div>
                                </div>
                            </div>

                            {/* Video Container - Same structure as App Showcase */}
                            <div className="relative aspect-[9/19.5] pt-6 pb-12">
                                <div className="absolute inset-x-0 top-6 bottom-12 mx-1 bg-gradient-to-br from-gray-800/10 to-gray-900/20 border border-white/5 rounded-2xl overflow-hidden">
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <div className="relative w-[90%] h-[98%]">
                                            {/* Fallback Image when video is not available */}
                                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-blue-500/10 rounded-xl flex items-center justify-center relative">
                                                {/* Video Element */}
                                                <video
                                                    className="w-full h-full object-cover rounded-xl absolute inset-0"
                                                    src="/video.mp4"
                                                    loop
                                                    autoPlay
                                                    muted
                                                    playsInline
                                                    preload="metadata"
                                                    poster="/lex-ai.png"
                                                    onError={(e) => {
                                                        console.log('Video failed to load:', e);
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                    style={{borderRadius:10}}
                                                >
                                                    Your browser does not support the video tag.
                                                </video>

                                          
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Features List */}
                    <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        <div>
                            <h3 className="text-2xl font-bold mb-4">See Lex AI in Action</h3>
                            <p className="text-foreground/70 mb-6">
                                Watch how Lex AI transforms your learning experience with intelligent assistance,
                                smart study planning, and seamless app integration.
                            </p>
                        </div>

                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                className="flex items-start space-x-4"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                            >
                                <div className="text-2xl">{feature.icon}</div>
                                <div>
                                    <h4 className="text-lg font-bold mb-1">{feature.title}</h4>
                                    <p className="text-foreground/70 text-sm">{feature.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* CTA Section */}
                <motion.div
                    className="text-center mt-10"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                >
                    <h3 className="text-2xl font-bold mb-4">
                        Ready to Experience AI-Powered Learning?
                    </h3>
                    <p className="text-foreground/70 mb-8 max-w-2xl mx-auto">
                        Join thousands of students who are already using Lex AI to enhance their learning experience and achieve better academic results.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button className="bg-gradient-to-r from-primary to-blue-600 text-white px-8 py-3 rounded-lg font-medium text-lg hover:shadow-lg hover:shadow-primary/20 transition-all hover:scale-105">
                            Start Learning with Lex AI
                        </Button>
                        <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/10 px-8 py-3 rounded-lg font-medium text-lg">
                            Learn More
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
