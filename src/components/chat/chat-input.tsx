"use client";

import {
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
  type ClipboardEvent,
} from "react";
import { Send, Paperclip, Mic, X, FileIcon, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChatStore } from "@/store/chat-store";
import { SUPPORTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (text: string, files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

export function ChatInput({ onSend, disabled = false, className }: ChatInputProps) {
  const inputText = useChatStore((s) => s.inputText);
  const setInputText = useChatStore((s) => s.setInputText);
  const attachedFiles = useChatStore((s) => s.attachedFiles);
  const addAttachedFile = useChatStore((s) => s.addAttachedFile);
  const removeAttachedFile = useChatStore((s) => s.removeAttachedFile);
  const clearInput = useChatStore((s) => s.clearInput);
  const isStreaming = useChatStore((s) => s.isStreaming);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDisabled = disabled || isStreaming;
  const canSend = inputText.trim().length > 0 || attachedFiles.length > 0;

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = 6 * 24; // ~6 lines
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [inputText, adjustHeight]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = useCallback(() => {
    if (!canSend || isDisabled) return;
    const text = inputText.trim();
    const files = [...attachedFiles];
    clearInput();
    onSend(text, files);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    // Re-focus
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [canSend, isDisabled, inputText, attachedFiles, clearInput, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setInputText(e.target.value);
    },
    [setInputText]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file && file.size <= MAX_FILE_SIZE) {
            addAttachedFile(file);
          }
        }
      }
    },
    [addAttachedFile]
  );

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      for (const file of files) {
        if (file.size <= MAX_FILE_SIZE) {
          addAttachedFile(file);
        }
      }

      // Reset input so the same file can be selected again
      e.target.value = "";
    },
    [addAttachedFile]
  );

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function isImageFile(file: File): boolean {
    return (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(file.type);
  }

  return (
    <div className={cn("shrink-0 border-t border-border bg-white px-3 py-2 sm:px-4 sm:py-3", className)}>
      {/* Attached file previews */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="relative flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs"
            >
              {isImageFile(file) ? (
                <ImageIcon className="h-4 w-4 text-saffron-600 flex-shrink-0" />
              ) : (
                <FileIcon className="h-4 w-4 text-saffron-600 flex-shrink-0" />
              )}
              <div className="flex flex-col min-w-0">
                <span className="truncate max-w-[120px] font-medium">
                  {file.name}
                </span>
                <span className="text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
              </div>
              <button
                onClick={() => removeAttachedFile(index)}
                className="ml-1 rounded-full p-0.5 hover:bg-destructive/10 transition-colors"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Action buttons */}
        <div className="flex items-center gap-1 pb-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={openFileDialog}
                disabled={isDisabled}
                aria-label="Attach file"
                className="text-muted-foreground hover:text-foreground"
              >
                <Paperclip className="h-4.5 w-4.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Attach file</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={isDisabled}
                aria-label="Voice input"
                className="text-muted-foreground hover:text-foreground"
              >
                <Mic className="h-4.5 w-4.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Voice input</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={isDisabled}
            placeholder="Type a message..."
            rows={1}
            className={cn(
              "w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm leading-6",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-saffron focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "scrollbar-none"
            )}
          />
        </div>

        {/* Send button */}
        <div className="pb-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!canSend || isDisabled}
                className={cn(
                  "h-10 w-10 rounded-xl transition-all",
                  canSend && !isDisabled
                    ? "bg-saffron hover:bg-saffron-600 text-white shadow-sm"
                    : "bg-muted text-muted-foreground"
                )}
                aria-label="Send message"
              >
                <Send className="h-4.5 w-4.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Send message</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden="true"
      />

      {/* Hint text — hide on small screens to save space */}
      <p className="hidden sm:block text-[11px] text-muted-foreground mt-1.5 text-center">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
