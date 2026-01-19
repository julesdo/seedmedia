"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

interface ActionSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

/**
 * Contrôleur simple avec boutons +/- et valeur éditable
 */
export function ActionSlider({
  value,
  onChange,
  min = 1,
  max = 1000,
  className,
}: ActionSliderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchroniser l'input avec la valeur externe
  useEffect(() => {
    if (!isEditing) {
      setInputValue(value.toString());
    }
  }, [value, isEditing]);

  // Focus sur l'input quand on passe en mode édition
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDecrement = () => {
    const newValue = Math.max(min, value - 1);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + 1);
    onChange(newValue);
  };

  const handleValueClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const numValue = parseInt(inputValue, 10);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
    } else {
      setInputValue(value.toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputBlur();
    } else if (e.key === "Escape") {
      setInputValue(value.toString());
      setIsEditing(false);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-center gap-4">
        {/* Bouton Moins */}
        <motion.button
          onClick={handleDecrement}
          disabled={value <= min}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "bg-primary/10 hover:bg-primary/20 active:bg-primary/30",
            "border-2 border-primary/30",
            "transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            value <= min && "opacity-30"
          )}
        >
          <Minus className="w-5 h-5 text-primary" />
        </motion.button>

        {/* Valeur éditable */}
        <div className="flex flex-col items-center gap-1 min-w-[80px]">
          {isEditing ? (
            <input
              ref={inputRef}
              type="number"
              min={min}
              max={max}
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className={cn(
                "w-20 h-12 text-center text-3xl font-bold",
                "bg-transparent border-2 border-primary rounded-lg",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                "text-foreground"
              )}
            />
          ) : (
            <motion.button
              onClick={handleValueClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "text-3xl font-bold text-foreground",
                "px-4 py-2 rounded-lg",
                "hover:bg-primary/10 active:bg-primary/20",
                "transition-colors cursor-pointer",
                "select-none"
              )}
            >
              {value}
            </motion.button>
          )}
          <p className="text-[10px] text-muted-foreground">actions</p>
        </div>

        {/* Bouton Plus */}
        <motion.button
          onClick={handleIncrement}
          disabled={value >= max}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "bg-primary/10 hover:bg-primary/20 active:bg-primary/30",
            "border-2 border-primary/30",
            "transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            value >= max && "opacity-30"
          )}
        >
          <Plus className="w-5 h-5 text-primary" />
        </motion.button>
      </div>
    </div>
  );
}
