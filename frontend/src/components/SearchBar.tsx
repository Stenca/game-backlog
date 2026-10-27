import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isFetching?: boolean;
  selected?: boolean;
  showClear?: boolean;
  onClear?: () => void;
  onFocus?: () => void;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  isFetching,
  selected,
  showClear,
  onClear,
  onFocus,
}: SearchBarProps) {
  const displayClear = showClear || selected;

  return (
    <InputGroup className="rounded border border-border bg-surface-2/60 transition-colors focus:border-brand has-[[data-slot=input-group-control]:disabled]:opacity-60 has-[[data-slot=input-group-control]:disabled]:bg-surface-2/60">
      <InputGroupInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        disabled={selected}
        className=" bg-transparent px-3 py-2 pr-10 text-sm text-ink placeholder:text-ink-dim disabled:bg-transparent"
      />

      {isFetching && !selected && (
        <InputGroupAddon align="inline-end" className="pr-3">
          <Spinner className="h-4 w-4 text-ink-muted" />
        </InputGroupAddon>
      )}

      {displayClear && !isFetching && (
        <InputGroupAddon align="inline-end" className="pr-1.5">
          <InputGroupButton
            type="button"
            variant="ghost"
            onClick={onClear}
            aria-label="Clear"
            className="h-auto border-0 bg-transparent px-2 py-1 text-ink-muted shadow-none transition-colors hover:bg-transparent hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
