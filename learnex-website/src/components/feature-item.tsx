import { motion } from "framer-motion";

interface FeatureItemProps {
    title: string;
    description: string;
    icon: string;
    delay: number;
}

export function FeatureItem({ title, description, icon, delay }: FeatureItemProps) {
    return (
        <motion.div
            className="bg-background/50 p-5 rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay }}
        >
            <div className="mb-3 text-2xl">{icon}</div>
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-foreground/70 text-sm">{description}</p>
        </motion.div>
    );
} 