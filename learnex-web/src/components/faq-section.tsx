import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    toggleOpen: () => void;
    delay: number;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, toggleOpen, delay }) => {
    return (
        <motion.div
            className="border border-border rounded-lg overflow-hidden bg-background/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
        >
            <button
                className="w-full px-4 py-3 flex justify-between items-center text-left"
                onClick={toggleOpen}
            >
                <h3 className="font-medium text-base">{question}</h3>
                <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-4 pb-3"
                    >
                        <div className="border-t border-border pt-2 text-foreground/70 text-sm">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number>(0);

    const faqs = [
        {
            question: "How is Learnex different from other social networking apps?",
            answer: "Learnex is specifically designed for students and learning, with features that encourage focus rather than endless scrolling. We include productivity tools, distraction controls, and learning-centered social features that regular social networks don't prioritize."
        },
        {
            question: "Is Learnex free to use?",
            answer: "Yes, Learnex is completely free to use with all core features available to everyone. We may introduce premium features in the future, but our commitment is to keep the essential functionality free of charge."
        },
        {
            question: "How does Learnex help with focus and productivity?",
            answer: "Learnex includes features like focus timers, distraction controls, gentle reminders when you've been scrolling too long, and usage insights to help you understand your study patterns and improve over time."
        },
        {
            question: "Can I create study groups with my classmates?",
            answer: "Absolutely! You can create private or public study groups, invite classmates, share materials, schedule group study sessions, and collaborate on projects all within the Learnex platform."
        },
        {
            question: "What kind of content can I share on Learnex?",
            answer: "You can share text posts, images, documents, links to resources, recorded explanations, and more. Learnex supports various content types that are useful for learning and collaboration."
        },
        {
            question: "How does Learnex protect my privacy?",
            answer: "Learnex gives you granular control over who can see your content. You can set privacy settings at the account level and for individual posts, making it easy to share appropriate content with the right audience."
        }
    ];

    return (
        <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute bottom-0 left-0 right-0 h-[20rem] bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="text-center mb-10">
                    <motion.div
                        className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full mb-2 font-medium text-sm"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        FAQ
                    </motion.div>
                    <motion.h2
                        className="text-2xl sm:text-3xl font-bold mb-4"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        Frequently Asked Questions
                    </motion.h2>
                    <motion.p
                        className="text-foreground/70 mx-auto text-base mb-8"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        Have more questions? Contact us at <a href="mailto:support@learnex.app" className="text-primary hover:underline">support@learnex.app</a>
                    </motion.p>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, index) => (
                        <FAQItem
                            key={index}
                            question={faq.question}
                            answer={faq.answer}
                            isOpen={openIndex === index}
                            toggleOpen={() => setOpenIndex(openIndex === index ? -1 : index)}
                            delay={0.1 * index}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
} 