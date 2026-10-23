import { Paperclip, X } from "lucide-react";
import {
  Attachment,
  AttachmentContent,
  AttachmentTitle,
  AttachmentActions,
  AttachmentAction,
} from "@/components/ui/attachment";

type Props = {
  onChange: (file: File | null) => void;
  file: File | null;
};

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function FileUpload({ onChange, file }: Props) {
  return (
    <div className="flex w-full flex-col gap-2">
      <label className="inline-flex w-fit cursor-pointer items-center gap-2 whitespace-nowrap text-xs font-medium text-ink-muted transition-colors hover:text-brand">
        <Paperclip className="h-4 w-4 shrink-0" />
        <span>{file ? "Change image" : "Add image"}</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          className="hidden"
        />
      </label>

      {file && (
        <Attachment className="w-fit max-w-full border-border bg-surface-2">
          <AttachmentContent>
            <AttachmentTitle className="flex flex-wrap items-center gap-x-1 text-ink break-all">
              <span>{file.name}</span>
              <span className="text-ink-dim">- {formatBytes(file.size)}</span>
            </AttachmentTitle>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction
              onClick={() => onChange(null)}
              className="text-ink-muted hover:text-red-400"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      )}
    </div>
  );
}
