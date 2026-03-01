import React from 'react';
import { motion } from 'framer-motion';
import { FeatureItem } from "./feature-item";

export function FeaturesSection() {
    return (
        <section id="features" className="bg-background relative py-16 overflow-hidden">
            {/* Gradient background elements */}
            <div className="absolute top-0 inset-x-0 h-[25rem] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-[20rem] bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

            <div className="container max-w-7xl mx-auto px-4 relative z-10">
                {/* Section header */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                    <motion.h2
                        className="text-2xl md:text-3xl font-bold mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        Features Designed for Your Learning Journey
                    </motion.h2>
                    <motion.p
                        className="text-foreground/70 text-base"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        Discover how Learnex transforms the way you study, learn, and collaborate with peers.
                    </motion.p>
                </div>

                {/* Features grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <FeatureItem
                        title="Social Learning Communities"
                        description="Connect with peers who share your academic interests and learn together through collaborative communities."
                        icon="👥"
                        delay={0}
                    />
                    <FeatureItem
                        title="Focus Mode"
                        description="Minimize distractions and maximize productivity with our specialized study environment."
                        icon="🎯"
                        delay={0.1}
                    />
                    <FeatureItem
                        title="Study Analytics"
                        description="Track your learning patterns and progress with detailed insights and visualizations."
                        icon="📊"
                        delay={0.2}
                    />
                    <FeatureItem
                        title="Group Study Sessions"
                        description="Schedule and join virtual study rooms for real-time collaboration and knowledge sharing."
                        icon="👨‍👩‍👧‍👦"
                        delay={0.3}
                    />
                    <FeatureItem
                        title="Resource Library"
                        description="Access a growing collection of study materials, notes, and guides shared by the community."
                        icon="📚"
                        delay={0.4}
                    />
                    <FeatureItem
                        title="Goal Tracking"
                        description="Set academic targets and monitor your journey with progress indicators and milestones."
                        icon="🎯"
                        delay={0.5}
                    />
                </div>
            </div>
        </section>
    );
} 