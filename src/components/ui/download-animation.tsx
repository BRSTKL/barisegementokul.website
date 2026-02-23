import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download } from 'lucide-react';

interface DownloadButtonProps {
    onDownload?: () => void;
    label?: string;
    className?: string;
}

export const DownloadButton = ({ onDownload, label = "Resume", className = "" }: DownloadButtonProps) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadClick = () => {
        if (isDownloading) return;

        setIsDownloading(true);

        // Create a temporary link element to trigger the download
        const link = document.createElement('a');
        link.href = '/resume/BarisEgemenTokul_CV.pdf';
        link.download = 'BarisEgemenTokul_CV.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        onDownload?.();

        // Simulate download animation duration
        setTimeout(() => {
            setIsDownloading(false);
        }, 3500);
    };

    return (
        <div className={`flex justify-center items-center ${className}`}>
            <motion.button
                onClick={handleDownloadClick}
                className={`relative flex items-center border-[1.5px] rounded-full overflow-hidden transition-all
          ${isDownloading ? 'cursor-wait border-primary' : 'cursor-pointer border-border hover:bg-accent hover:text-accent-foreground'}`}
                animate={{
                    width: isDownloading ? 36 : 110,
                    borderRadius: '9999px' // Keeps full rounding
                }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                style={{ minWidth: isDownloading ? '36px' : '110px', height: 36 }}
            >
                {/* Spinner animation inside circle */}
                <AnimatePresence>
                    {isDownloading && (
                        <motion.div
                            className="absolute inset-0 w-1.5 h-1.5 bg-background rounded-full m-auto z-20"
                            initial={{ opacity: 1 }}
                            animate={{
                                rotate: 360,
                                x: [0, 16, 0, -16, 0],
                                y: [0, -16, 0, 16, 0]
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 3,
                                ease: 'easeInOut',
                                times: [0, 0.25, 0.5, 0.75, 1]
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Circular button with icon */}
                <motion.div
                    className={`h-9 w-9 rounded-full flex justify-center items-center relative z-10 ${isDownloading ? 'bg-primary shadow-sm' : 'bg-transparent text-foreground'}`}
                    animate={isDownloading ? {
                        rotate: 180,
                        scale: [0.95, 1, 0.95],
                    } : {}}
                    transition={{
                        duration: isDownloading ? 1 : 0.4,
                        times: isDownloading ? [0, 0.7, 1] : undefined
                    }}
                >
                    {/* Progress fill */}
                    <motion.div
                        className="absolute top-0 left-0 w-full bg-primary/80 rounded-full"
                        initial={{ height: '0%' }}
                        animate={isDownloading ? { height: '100%' } : { height: '0%' }}
                        transition={{ duration: 3, ease: 'easeInOut' }}
                        style={{ zIndex: 1 }}
                    />

                    {/* Download icon */}
                    <motion.div
                        className={`z-20 flex justify-center items-center ${isDownloading ? 'text-primary-foreground' : ''}`}
                        initial={{ opacity: 1 }}
                        animate={{ opacity: isDownloading ? 0 : 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Download className="w-4 h-4" />
                    </motion.div>

                    {/* Loading block */}
                    <motion.div
                        className="w-2.5 h-2.5 rounded-full bg-primary-foreground absolute z-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isDownloading ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                    />
                </motion.div>

                {/* Download label */}
                <AnimatePresence>
                    {!isDownloading && (
                        <motion.span
                            className="ml-1 text-sm font-medium select-none z-10"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            {label}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
};
