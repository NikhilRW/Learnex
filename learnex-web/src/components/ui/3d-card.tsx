import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface ThreeDCardProps {
    children: React.ReactNode;
    className?: string;
    containerClassName?: string;
    glareEnabled?: boolean;
    rotationIntensity?: number;
    borderRadius?: number;
}

export const ThreeDCard = ({
    children,
    className,
    containerClassName,
    glareEnabled = true,
    rotationIntensity = 20,
    borderRadius = 20,
}: ThreeDCardProps) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [glarePosition, setGlarePosition] = useState({ x: 0, y: 0 });

    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();

        // Calculate mouse position relative to card center
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        // Convert to rotation values (-1 to 1)
        const rotateYValue = (mouseX / (rect.width / 2)) * rotationIntensity;
        const rotateXValue = (mouseY / (rect.height / 2)) * -rotationIntensity;

        setRotateX(rotateXValue);
        setRotateY(rotateYValue);

        // Update glare position (0 to 100%)
        if (glareEnabled) {
            setGlarePosition({
                x: (e.clientX - rect.left) / rect.width * 100,
                y: (e.clientY - rect.top) / rect.height * 100,
            });
        }
    };

    const handleMouseLeave = () => {
        // Reset rotations when mouse leaves
        setRotateX(0);
        setRotateY(0);
    };

    return (
        <div
            className={cn("perspective-1000px", containerClassName)}
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                className={cn(
                    "w-full h-full relative",
                    className
                )}
                style={{
                    borderRadius: `${borderRadius}px`,
                    transformStyle: "preserve-3d",
                    boxShadow: "0 10px 30px -15px rgba(0, 0, 255, 0.5)",
                }}
                animate={{
                    rotateX,
                    rotateY,
                }}
                transition={{
                    type: "spring",
                    damping: 20,
                    stiffness: 300
                }}
            >
                {children}

                {/* Glare effect */}
                {glareEnabled && (
                    <div
                        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none rounded-[inherit] z-10"
                        style={{
                            borderRadius: `${borderRadius}px`,
                        }}
                    >
                        <div
                            className="absolute w-[200%] h-[200%] rounded-[inherit] opacity-30"
                            style={{
                                background: "radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 30%)",
                                top: `${glarePosition.y - 100}%`,
                                left: `${glarePosition.x - 100}%`,
                            }}
                        />
                    </div>
                )}
            </motion.div>
        </div>
    );
}; 