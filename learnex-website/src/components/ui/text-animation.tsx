import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface AnimatedTextProps {
    text: string;
    className?: string;
    animation?: 'glow' | 'fadeIn' | 'typewriter';
    once?: boolean;
}

export function AnimatedText({ text, className, animation = 'glow', once = false }: AnimatedTextProps) {
    const [isInView, setIsInView] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const currentRef = ref.current; // Store ref value to use in cleanup

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    if (once && currentRef) {
                        observer.unobserve(currentRef);
                    }
                } else if (!once) {
                    setIsInView(false);
                }
            },
            { threshold: 0.1 }
        );

        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [once]);

    const renderGlowAnimation = () => {
        return (
            <div className={cn("relative", className)} ref={ref}>
                <span className="relative z-10">{text}</span>
                {isInView && (
                    <motion.span
                        className="absolute inset-0 blur-[2px] opacity-30 z-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.2 }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
                    >
                        {text}
                    </motion.span>
                )}
            </div>
        );
    };

    const renderFadeInAnimation = () => {
        return (
            <div ref={ref}>
                <motion.span
                    className={className}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ duration: 0.5 }}
                >
                    {text}
                </motion.span>
            </div>
        );
    };

    const renderTypewriterAnimation = () => {
        return (
            <div ref={ref}>
                <motion.span
                    className={className}
                    initial={{ width: 0 }}
                    animate={isInView ? { width: '100%' } : { width: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden' }}
                >
                    {text}
                </motion.span>
            </div>
        );
    };

    switch (animation) {
        case 'glow':
            return renderGlowAnimation();
        case 'fadeIn':
            return renderFadeInAnimation();
        case 'typewriter':
            return renderTypewriterAnimation();
        default:
            return <span className={className}>{text}</span>;
    }
} 