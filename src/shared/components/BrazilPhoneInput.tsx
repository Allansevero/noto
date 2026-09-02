import { forwardRef } from "react";
import { IMaskInput } from "react-imask";
import { cn } from "@/shared/utils";

// Ícone SVG nítido e otimizado da bandeira do Brasil
export function BrazilFlag({ className = "w-4 h-3" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 720 504"
      className={cn("shrink-0 rounded-xs shadow-2xs", className)}
      aria-label="Bandeira do Brasil"
    >
      <rect width="720" height="504" fill="#009b3a" />
      <polygon points="360,57.6 662.4,252 360,446.4 57.6,252" fill="#fedf00" />
      <circle cx="360" cy="252" r="126" fill="#002776" />
      <path
        d="M 234 252 A 136 136 0 0 0 486 252 A 126 126 0 0 1 234 252"
        fill="#ffffff"
      />
    </svg>
  );
}

interface BrazilPhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export const BrazilPhoneInput = forwardRef<HTMLInputElement, BrazilPhoneInputProps>(
  ({ value = "", onChange, placeholder = "(00) 00000-0000", className, disabled, id }, ref) => {
    // Normaliza se já vier com prefixo +55
    const displayValue = value.startsWith("+55")
      ? value.slice(3).trim()
      : value;

    const handleAccept = (maskedValue: string) => {
      onChange?.(maskedValue);
    };

    return (
      <div
        className={cn(
          "flex h-9 w-full rounded-none border border-input bg-background overflow-hidden transition-colors",
          "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary",
          disabled && "opacity-50 cursor-not-allowed bg-muted/40",
          className
        )}
      >
        {/* Prefixo Fixo: Bandeira do Brasil + +55 (Bloco Lado a Lado Seguro Sem Sobreposição) */}
        <div className="flex items-center gap-1.5 px-2.5 bg-muted/40 border-r border-input/60 select-none shrink-0 text-xs font-mono font-medium text-foreground/80">
          <BrazilFlag className="w-4 h-3" />
          <span className="text-[11px] font-semibold text-muted-foreground">+55</span>
        </div>

        {/* Input de Digitação do DDD + Telefone */}
        <IMaskInput
          mask="(00) 00000-0000"
          id={id}
          value={displayValue}
          onAccept={handleAccept}
          placeholder={placeholder}
          disabled={disabled}
          inputRef={ref as React.RefCallback<HTMLInputElement>}
          className="flex-1 bg-transparent px-3 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 placeholder:font-mono focus:outline-none disabled:cursor-not-allowed"
        />
      </div>
    );
  }
);

BrazilPhoneInput.displayName = "BrazilPhoneInput";
