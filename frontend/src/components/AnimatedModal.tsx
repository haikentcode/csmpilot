"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  trigger?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "max-w-sm sm:max-w-md",
  md: "max-w-md sm:max-w-lg lg:max-w-2xl",
  lg: "max-w-lg sm:max-w-xl lg:max-w-4xl",
  xl: "max-w-xl sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl",
  full: "max-w-full sm:max-w-6xl lg:max-w-7xl",
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" as const },
  },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.85,
    y: 40,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1] as const,
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 30,
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 1, 1] as const,
    },
  },
};

const contentVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
      delay: 0.05,
    },
  },
};

// Performance optimized modal content component
const ModalContent = React.memo(
  ({
    isOpen,
    onClose,
    title,
    description,
    children,
    size,
    showCloseButton,
    className,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    size: "sm" | "md" | "lg" | "xl" | "full";
    showCloseButton: boolean;
    className: string;
  }) => {
    // Memoize backdrop click handler to prevent unnecessary re-renders
    const handleBackdropClick = React.useCallback(
      (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      },
      [onClose]
    );

    return (
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              zIndex: 9999,
              maxHeight: "100vh",
              maxWidth: "100vw",
            }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 backdrop-blur-sm touch-manipulation"
              onClick={handleBackdropClick}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal Container with Enhanced Responsive Positioning */}
            <motion.div
              className={cn(
                "relative flex flex-col bg-white rounded-lg shadow-xl overflow-hidden",
                "max-h-[95vh] sm:max-h-[90vh] lg:max-h-[85vh]",
                "w-full mx-auto",
                "my-auto",
                sizeClasses[size],
                className
              )}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              data-modal-content
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? "modal-title" : undefined}
              aria-describedby={description ? "modal-description" : undefined}
              style={{
                // Ensure modal adapts to viewport changes
                maxWidth: "calc(100vw - 2rem)",
                maxHeight: "calc(100vh - 2rem)",
              }}
            >
              {/* Fixed Header */}
              {(title || showCloseButton) && (
                <motion.div
                  className="sticky top-0 z-10 flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-gray-200 bg-white flex-shrink-0"
                  variants={contentVariants}
                >
                  {title && (
                    <motion.h2
                      id="modal-title"
                      className="text-responsive-lg font-semibold text-gray-900"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.1,
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                    >
                      {title}
                    </motion.h2>
                  )}
                  {showCloseButton && (
                    <motion.button
                      onClick={onClose}
                      className={cn(
                        "flex items-center justify-center rounded-full",
                        "bg-gray-100 hover:bg-gray-200 focus:bg-gray-200",
                        "transition-colors duration-200",
                        "h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                        "touch-manipulation",
                        "min-h-[44px] min-w-[44px]" // Ensure minimum touch target size
                      )}
                      aria-label="Close modal"
                      type="button"
                      initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.15,
                        duration: 0.3,
                        ease: "backOut",
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                    </motion.button>
                  )}
                </motion.div>
              )}

              {/* Scrollable Content Area */}
              <motion.div
                className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 relative"
                variants={contentVariants}
              >
                {/* Scroll indicator shadow at top */}
                <div className="sticky top-0 left-0 right-0 h-4 bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none z-10 -mt-3 -mx-3 sm:-mx-4 lg:-mx-6" />

                {description && (
                  <motion.p
                    id="modal-description"
                    className="text-responsive-sm text-gray-600 mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    {description}
                  </motion.p>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.25,
                    duration: 0.4,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  {children}
                </motion.div>

                {/* Scroll indicator shadow at bottom */}
                <div className="sticky bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10 -mb-3 -mx-3 sm:-mx-4 lg:-mx-6" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

ModalContent.displayName = "ModalContent";

export default function AnimatedModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  trigger,
  size = "md",
  showCloseButton = true,
  className = "",
}: AnimatedModalProps) {
  // Handle escape key and dynamic centering with resize/orientation changes
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    // Dynamic centering on resize and orientation change
    const handleResize = () => {
      // Force re-render of modal positioning by triggering a layout recalculation
      const modalElement = document.querySelector(
        "[data-modal-content]"
      ) as HTMLElement;
      if (modalElement) {
        // Temporarily hide and show to force recalculation
        modalElement.style.visibility = "hidden";
        requestAnimationFrame(() => {
          modalElement.style.visibility = "visible";
        });
      }
    };

    const handleOrientationChange = () => {
      // Add a small delay to allow for orientation change to complete
      setTimeout(handleResize, 100);
    };

    // Store original overflow and touch-action values
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    // Allow background scrolling while maintaining modal focus
    // Remove body scroll prevention to allow background scrolling
    // document.body.style.overflow = "hidden";
    // document.body.style.touchAction = "none";

    // Add event listeners
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      // Cleanup
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
      document.body.style.overflow = originalOverflow || "";
      document.body.style.touchAction = originalTouchAction || "";
    };
  }, [isOpen, onClose]);

  // Enhanced focus trap implementation with better mobile support
  useEffect(() => {
    if (!isOpen) return;

    // Use a timeout to ensure modal content is rendered
    const timeoutId = setTimeout(() => {
      const modalElement = document.querySelector("[data-modal-content]");
      if (!modalElement) return;

      const focusableElements = modalElement.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== "Tab") return;

        // Only trap focus if we're inside the modal
        if (!modalElement.contains(e.target as Node)) return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      };

      // Handle touch/click focus for mobile devices
      const handleFocusIn = (e: FocusEvent) => {
        if (!modalElement.contains(e.target as Node)) {
          e.preventDefault();
          firstElement?.focus();
        }
      };

      document.addEventListener("keydown", handleTabKey);
      document.addEventListener("focusin", handleFocusIn);

      // Focus the first element only if no element is already focused within the modal
      if (!modalElement.contains(document.activeElement)) {
        firstElement?.focus();
      }

      return () => {
        document.removeEventListener("keydown", handleTabKey);
        document.removeEventListener("focusin", handleFocusIn);
      };
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isOpen]);

  const modalProps = {
    isOpen,
    onClose,
    title,
    description,
    children,
    size,
    showCloseButton,
    className,
  };

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <ModalContent {...modalProps} />
      </Dialog>
    );
  }

  return <ModalContent {...modalProps} />;
}

// Utility hook for modal state management
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = React.useState(initialState);

  const openModal = React.useCallback(() => setIsOpen(true), []);
  const closeModal = React.useCallback(() => setIsOpen(false), []);
  const toggleModal = React.useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
}
