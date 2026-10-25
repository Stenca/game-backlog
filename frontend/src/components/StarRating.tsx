import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useState } from "react";

type Props = {
  value: number;
  onChange: (value: number) => void;
  max?: number;
};
export default function StarRating({ value, onChange, max = 5 }: Props) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= (hover || value);

        return (
          <Button
            key={starValue}
            type="button"
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(0)}
            className={`border-none bg-transparent p-0 transition-colors hover:bg-transparent focus:outline-none ${
              isFilled ? "text-brand" : "text-ink-dim hover:text-ink-muted"
            }`}
          >
            <Star className="h-5 w-5" />
          </Button>
        );
      })}
    </div>
  );
}
