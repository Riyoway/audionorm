import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

interface Props {
  onFiles: (files: File[]) => void;
}

export function Dropzone({ onFiles }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files);
    },
    [onFiles],
  );

  return (
    <div
      className={`dropzone${dragging ? " dragging" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.wav,.mp3,.flac,.m4a,.aac,.ogg,.opus,.aiff"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
      <div className="dropzone-icon">
        <UploadCloud size={40} strokeWidth={1.6} />
      </div>
      <p className="dropzone-text">
        Drag &amp; drop audio files here, or <span>click to browse</span>
      </p>
      <p className="dropzone-sub">WAV · MP3 · FLAC · M4A · OGG · Opus</p>
    </div>
  );
}
