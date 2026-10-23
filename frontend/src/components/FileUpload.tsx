type Props = {
  onChange: (file: File | null) => void;
  file: File | null;
};

export default function FileUpload({ onChange, file }: Props) {
  return (
    <div className="flex items-center gap-3">
      <label className="inline-flex w-fit cursor-pointer items-center gap-2 whitespace-nowrap text-xs font-medium text-ink-muted transition-colors hover:text-brand">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span>{file ? "Change image" : "Add image"}</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          className="hidden"
        />
      </label>

      {file && (
        <span className="max-w-37.5 truncate text-xs text-ink-dim">
          {file.name}
        </span>
      )}
    </div>
  );
}
