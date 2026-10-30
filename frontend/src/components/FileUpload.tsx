import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";

type Props = {
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  files: File[];
  existingUrls?: string[];
  onRemoveExisting?: (url: string) => void;
  multiple?: boolean;
  disabled?: boolean;
};

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function FileUpload({
  onAdd,
  onRemove,
  files,
  existingUrls = [],
  onRemoveExisting,
  multiple,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      onAdd(selectedFiles);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        disabled={disabled}
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2/50 transition-colors hover:border-brand hover:bg-surface-2 hover:text-brand text-ink-muted disabled:pointer-events-none disabled:opacity-50"
        title="Add Image"
      >
        <ImagePlus className="h-4 w-4" />
      </button>

      {existingUrls.map((url) => (
        <div
          key={url}
          className="group/image relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border bg-surface-2 transition-colors hover:border-brand"
        >
          <img
            src={url}
            alt="Existing attachment"
            className="h-full w-full object-cover opacity-90 transition-opacity group-hover/image:opacity-40"
          />
          {onRemoveExisting && (
            <button
              type="button"
              onClick={() => onRemoveExisting(url)}
              className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover/image:opacity-100"
            >
              <div className="rounded-full bg-destructive/90 p-1 text-white shadow-sm transition-transform hover:scale-110">
                <X className="h-3 w-3" />
              </div>
            </button>
          )}
        </div>
      ))}

      {files.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className="group/image relative flex h-9 shrink-0 items-center gap-2 overflow-hidden rounded-md border border-border bg-surface-2 pr-2 transition-colors hover:border-brand"
        >
          <img
            src={URL.createObjectURL(file)}
            alt="Preview"
            className="h-full w-9 object-cover opacity-90 transition-opacity group-hover/image:opacity-40"
          />
          <span className="max-w-25 truncate text-[11px] font-medium text-ink-muted">
            {formatBytes(file.size)}
          </span>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/image:opacity-100"
          >
            <div className="rounded-full bg-destructive/90 p-1 text-white shadow-sm transition-transform hover:scale-110">
              <X className="h-3 w-3" />
            </div>
          </button>
        </div>
      ))}
    </div>
  );
}
