import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = {
  label: string;
  value: string;
};

type Props = {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  className?: string;
};

export default function FilterSelect({
  value,
  onValueChange,
  options,
  placeholder,
  className = "w-45",
}: Props) {
  return (
    <Select value={value} onValueChange={(val) => onValueChange(val ?? "")}>
      <SelectTrigger
        className={`cursor-pointer rounded border border-border bg-surface-2 font-medium text-ink transition-colors focus:ring-0 focus-visible:ring-0 hover:text-brand! data-popup-open:border-brand! data-popup-open:text-brand! ${className}`}
      >
        <SelectValue placeholder={placeholder}>
          {options.find((opt) => opt.value === value)?.label || placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        className="border-border bg-surface text-ink"
      >
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
