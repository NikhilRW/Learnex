import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

// Testimonial card component
interface TestimonialCardProps {
    quote: string;
    name: string;
    role: string;
    avatar: string;
    delay?: number;
    rating: number;
    gradient?: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
    quote,
    name,
    role,
    avatar,
    delay = 0,
    rating,
    gradient = "bg-gradient-to-br from-secondary/30 to-secondary/10",
}) => {
    // Array to render star ratings
    const stars = Array.from({ length: 5 }).map((_, i) => (
        <svg
            key={i}
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={i < rating ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={i < rating ? "text-yellow-400" : "text-foreground/30"}
        >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    ));

    return (
        <motion.div
            className={`${gradient} backdrop-blur-sm border border-border rounded-lg p-4 h-full flex flex-col shadow hover:shadow-md transition-all duration-300 hover:scale-[1.02]`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
        >
            {/* Quote mark */}
            <div className="text-primary mb-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="opacity-20"
                >
                    <path d="M10 11l-2 2-4-4 4-4 2 2-2 2 2 2zm4 0l2 2 4-4-4-4-2 2 2 2-2 2z" />
                </svg>
            </div>

            {/* Content */}
            <div className="flex-grow">
                <div className="flex mb-2">{stars}</div>
                <p className="text-foreground/80 mb-4 italic text-sm">{quote}</p>
            </div>

            {/* User info */}
            <div className="flex items-center mt-2">
                <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3 border-2 border-primary/20">
                    <Image
                        src={avatar}
                        alt={name}
                        fill
                        className="object-cover"
                    />
                </div>
                <div>
                    <p className="font-semibold text-sm">{name}</p>
                    <p className="text-foreground/60 text-xs">{role}</p>
                </div>
            </div>
        </motion.div>
    );
};

export function TestimonialsSection() {
    const testimonials = [
        {
            quote: "Learnex transformed my study habits. The focus features remind me when I'm distracted and help me get back on track.",
            name: "Sophia Chen",
            role: "Computer Science Student",
            avatar: "https://avatar.iran.liara.run/public/girl",
            rating: 5,
            gradient: "bg-gradient-to-br from-blue-500/20 to-purple-500/10"
        },
        {
            quote: "I love that Learnex connects me with classmates without typical social media distractions. Goal-driven groups made our projects more efficient.",
            name: "Marcus Johnson",
            role: "Engineering Major",
            avatar: "https://avatar.iran.liara.run/public/boy",
            rating: 4,
            gradient: "bg-gradient-to-br from-emerald-500/20 to-teal-500/10"
        },
        {
            quote: "As someone easily distracted on social media, Learnex is a game-changer. I can chat with study partners while staying focused.",
            name: "Aisha Patel",
            role: "Medical Student",
            avatar: "https://avatar.iran.liara.run/public/girl",
            rating: 5,
            gradient: "bg-gradient-to-br from-amber-500/20 to-orange-500/10"
        },
        {
            quote: "The accountability features helped me stay consistent with my study schedule. My grades improved significantly since using it.",
            name: "David Rodriguez",
            role: "Business Student",
            avatar: "https://avatar.iran.liara.run/public/boy",
            rating: 5,
            gradient: "bg-gradient-to-br from-red-500/20 to-pink-500/10"
        },
        {
            quote: "Learnex's room feature made virtual study groups more engaging. It feels like we're studying together even miles apart.",
            name: "Emma Thompson",
            role: "Psychology Major",
            avatar: "https://avatar.iran.liara.run/public/girl",
            rating: 4,
            gradient: "bg-gradient-to-br from-indigo-500/20 to-blue-500/10"
        },
        {
            quote: "I appreciate how Learnex combines productivity tools with social features. It's what I needed to stay motivated this semester.",
            name: "Kevin Wu",
            role: "Data Science Student",
            avatar: "https://avatar.iran.liara.run/public/boy",
            rating: 5,
            gradient: "bg-gradient-to-br from-green-500/20 to-emerald-500/10"
        },
    ];

    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden" id="reviews">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-0 h-[30rem] w-[30rem] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-1/4 right-0 h-[20rem] w-[20rem] rounded-full bg-secondary/5 blur-[80px]" />
            </div>

            <div className="max-w-screen-xl mx-auto relative z-10">
                <div className="text-center mb-10">
                    <motion.div
                        className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full mb-2 font-medium text-sm"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        TESTIMONIALS
                    </motion.div>
                    <motion.h2
                        className="text-2xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        What Our Users Say
                    </motion.h2>
                    <motion.p
                        className="text-foreground/70 max-w-2xl mx-auto text-base"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        See how Learnex helps students balance social connection with focused learning
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {testimonials.map((testimonial, index) => (
                        <TestimonialCard
                            key={index}
                            quote={testimonial.quote}
                            name={testimonial.name}
                            role={testimonial.role}
                            avatar={testimonial.avatar}
                            rating={testimonial.rating}
                            delay={0.1 * index}
                            gradient={testimonial.gradient}
                        />
                    ))}
                </div>

                {/* Stats section */}
                <motion.div
                    className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    {[
                        { count: "10,000+", label: "Active Users", icon: "👥" },
                        { count: "4.8", label: "Average Rating", icon: "⭐" },
                        { count: "92%", label: "Improved Focus", icon: "🎯" }
                    ].map((stat, index) => (
                        <div key={index} className="bg-background/50 border border-border rounded-lg p-4 text-center backdrop-blur-sm">
                            <div className="text-2xl mb-2">{stat.icon}</div>
                            <div className="text-xl sm:text-2xl font-bold text-primary mb-1">{stat.count}</div>
                            <div className="text-foreground/70 text-sm">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
} 