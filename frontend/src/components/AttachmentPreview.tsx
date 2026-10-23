import { X } from "lucide-react";
import {
  Attachment,
  AttachmentContent,
  AttachmentTitle,
  AttachmentActions,
  AttachmentAction,
} from "@/components/ui/attachment";

type Props = {
  name: string;
  size?: string;
  onRemove: () => void;
};

export default function AttachmentPreview({ name, size, onRemove }: Props) {
  return (
    <div className="w-full min-w-0">
      <Attachment className="border-border bg-surface-2">
        <AttachmentContent>
          <AttachmentTitle className="text-ink">
            {name} {size && <span className="text-ink-dim">- {size}</span>}
          </AttachmentTitle>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction
            onClick={onRemove}
            className="text-ink-muted hover:text-destructive"
            aria-label="Remove attachment"
          >
            <X className="h-4 w-4" />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
    </div>
  );
}
