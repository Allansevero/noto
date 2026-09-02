import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/shared/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

const PRESET_SPECIALTIES = [
  "Psiquiatra",
  "Psicólogo",
  "Clínico Geral",
  "Cardiologista",
  "Dermatologista",
  "Ginecologista",
  "Neurologista",
  "Oftalmologista",
  "Ortopedista",
  "Pediatra",
  "Endocrinologista",
  "Nutricionista",
];

interface SpecialtyComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SpecialtyCombobox({
  value,
  onChange,
  className,
}: SpecialtyComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = PRESET_SPECIALTIES.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (selected: string) => {
    onChange(selected);
    setOpen(false);
    setSearch("");
  };

  const handleCustomAdd = () => {
    if (search.trim()) {
      onChange(search.trim());
      setOpen(false);
      setSearch("");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-9 text-xs font-normal border-input bg-transparent px-3",
            !value && "text-muted-foreground",
            className
          )}
        >
          {value || "Selecione a especialidade..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 border border-border bg-popover text-popover-foreground shadow-lg" align="start">
        <div className="p-2 border-b border-border flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Pesquisar especialidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCustomAdd();
              }
            }}
            className="h-7 text-xs border-none bg-transparent focus-visible:ring-0 px-1"
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="p-2 text-center text-xs text-muted-foreground">
              <p>Nenhuma especialidade encontrada.</p>
              {search.trim() && (
                <button
                  type="button"
                  onClick={handleCustomAdd}
                  className="mt-1 text-xs text-[#B7F20B] hover:underline font-medium block w-full text-center"
                >
                  Usar "{search.trim()}"
                </button>
              )}
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleSelect(item)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left transition-colors hover:bg-accent hover:text-accent-foreground",
                  value === item && "bg-accent/60 font-semibold text-foreground"
                )}
              >
                <span>{item}</span>
                {value === item && <Check className="h-3.5 w-3.5 text-[#B7F20B]" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
