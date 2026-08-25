import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, ExternalLink, Eye, FileText, Image as ImageIcon, Paperclip, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/hub";
import {
  addCaseDocuments,
  attachmentKindLabel,
  attachmentsQuery,
  downloadAttachment,
  previewTypeFor,
  STAFF_DOCUMENT_KINDS,
  type Attachment,
} from "@/lib/intake";

export function CaseDocuments({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<string>("case_document");
  const [viewing, setViewing] = useState<{ file: Attachment; url: string } | null>(null);

  const { data: documents = [], isLoading } = useQuery(attachmentsQuery(caseId));

  const upload = useMutation({
    mutationFn: async (files: File[]) => addCaseDocuments(caseId, kind, files),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["dispute_attachments", caseId] });
      toast.success(`${count} document${count === 1 ? "" : "s"} uploaded`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openViewer = async (file: Attachment) => {
    try {
      const url = await downloadAttachment(file.file_path);
      setViewing({ file, url });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const openInTab = async (file: Attachment) => {
    try {
      window.open(await downloadAttachment(file.file_path), "_blank", "noopener");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const previewType = viewing ? previewTypeFor(viewing.file.file_name) : "other";

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Case documents</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything filed on this matter — intake attachments, respondent filings, appeal
            evidence and staff uploads. Open any file to review it in the hub.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-1.5">
            <Label className="rule-label">Upload as</Label>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAFF_DOCUMENT_KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {attachmentKindLabel(k)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => fileInput.current?.click()}
            disabled={upload.isPending}
          >
            <Upload className="size-4" />
            {upload.isPending ? "Uploading…" : "Add documents"}
          </Button>
          <input
            ref={fileInput}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) upload.mutate(files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <ul className="mt-6 divide-y divide-border rounded-md border border-border">
        {isLoading && <li className="p-4 text-sm text-muted-foreground">Loading documents…</li>}
        {!isLoading && documents.length === 0 && (
          <li className="p-4 text-sm text-muted-foreground">
            No documents on this case yet. Upload hearing packets, evidence or decisions above.
          </li>
        )}
        {documents.map((doc) => {
          const type = previewTypeFor(doc.file_name);
          const Icon = type === "image" ? ImageIcon : type === "other" ? Paperclip : FileText;
          return (
            <li key={doc.id} className="flex flex-wrap items-center gap-3 p-4">
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.file_name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {attachmentKindLabel(doc.kind)}
                  {doc.response_id ? " · from response form" : ""}
                  {doc.appeal_id ? " · from appeal request" : ""} · {formatDateTime(doc.created_at)}
                </p>
              </div>
              <Badge variant="outline" className="uppercase">
                {doc.file_name.split(".").pop() || "file"}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => openViewer(doc)}>
                <Eye className="size-3.5" /> View
              </Button>
              <Button size="sm" variant="ghost" onClick={() => openInTab(doc)}>
                <Download className="size-3.5" /> Download
              </Button>
            </li>
          );
        })}
      </ul>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="truncate">{viewing?.file.file_name}</DialogTitle>
            <DialogDescription>
              {viewing ? attachmentKindLabel(viewing.file.kind) : ""} · access link expires in 10
              minutes
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="h-[70vh] overflow-auto rounded-md border border-border bg-muted/30">
              {previewType === "pdf" && (
                <iframe
                  src={viewing.url}
                  title={viewing.file.file_name}
                  className="h-full w-full"
                />
              )}
              {previewType === "image" && (
                <img
                  src={viewing.url}
                  alt={viewing.file.file_name}
                  className="mx-auto max-h-full object-contain"
                />
              )}
              {previewType === "text" && (
                <iframe
                  src={viewing.url}
                  title={viewing.file.file_name}
                  className="h-full w-full bg-background"
                />
              )}
              {previewType === "other" && (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                  <Paperclip className="size-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    This file type can’t be previewed in the browser.
                  </p>
                  <Button variant="outline" onClick={() => openInTab(viewing.file)}>
                    <ExternalLink className="size-4" /> Open in a new tab
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
