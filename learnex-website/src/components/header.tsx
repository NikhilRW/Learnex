"use client"
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Helper function to replace cn
const combineClassNames = (...classes: string[]) => {
    return classes.filter(Boolean).join(' ');
};

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Handle scroll event
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Navigation links
    const navLinks = [
        { name: 'Features', href: '#features' },
        { name: 'About', href: '#about' },
        { name: 'Screenshots', href: '#screenshots' },
        { name: 'Reviews', href: '#reviews' },
        { name: 'FAQ', href: '#faq' },
    ];

    return (
        <header
            className={combineClassNames(
                "fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 transition-all duration-300",
                isScrolled ? "py-2 bg-secondary/80 backdrop-blur-sm border-b border-border/50" : "py-4 bg-transparent"
            )}
        >
            <div className="max-w-screen-xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <a href="#" className="flex items-center text-2xl font-bold">
                    <div className="relative flex items-center">
                        <span className="text-primary mr-1">Learnex</span>
                        <span className="text-xs text-foreground/70 font-normal mt-1">for Android</span>
                    </div>
                </a>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            className="text-foreground/80 hover:text-primary transition-colors"
                        >
                            {link.name}
                        </a>
                    ))}
                </nav>

                {/* CTA Button */}
                <div className="hidden md:block">
                    <a
                        href="/app-release.apk" download={"learnex.apk"}
                        className={combineClassNames(
                            "px-4 py-2 rounded-lg font-medium transition-all",
                            isScrolled
                                ? "bg-primary text-white hover:bg-primary/90"
                                : "bg-primary/10 text-primary hover:bg-primary/20"
                        )}
                    >
                        Download APK
                    </a>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-foreground/80 hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        {isMobileMenuOpen ? (
                            <>
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </>
                        ) : (
                            <>
                                <line x1="4" y1="12" x2="20" y2="12"></line>
                                <line x1="4" y1="6" x2="20" y2="6"></line>
                                <line x1="4" y1="18" x2="20" y2="18"></line>
                            </>
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <motion.div
                    className="md:hidden pt-4 pb-6 px-4 mt-2 bg-secondary/95 backdrop-blur-sm border-t border-border/50"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <nav className="flex flex-col space-y-4">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                className="text-foreground/80 hover:text-primary transition-colors py-2"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.name}
                            </a>
                        ))}
                        <a
                            href="/app-release.apk" download={"learnex.apk"}
                            className="bg-primary text-white hover:bg-primary/90 transition-colors py-3 px-4 rounded-lg text-center mt-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Download APK
                        </a>
                    </nav>
                </motion.div>
            )}
        </header>
    );
} 