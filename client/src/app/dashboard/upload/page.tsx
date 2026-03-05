"use client";

import { useState, useRef } from "react";
import { salesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [result, setResult] = useState<{ message: string; inserted: number } | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.match(/\.(csv|xlsx|xls)$/i)) {
      setError("Only CSV and Excel files are supported.");
      return;
    }
    setFile(f);
    setError("");
    setStatus("idle");
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setError("");
    try {
      const data = await salesApi.upload(file);
      setResult({ message: data.message, inserted: data.inserted });
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  };

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setResult(null);
    setError("");
  };

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Upload Sales Data</h1>
        <p className="text-muted-foreground text-sm">
          Upload a CSV or Excel file. Columns are auto-detected — no exact headers required.
        </p>
      </div>

      {/* Drop zone */}
      <Card
        className={`border-2 border-dashed cursor-pointer transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          {!file ? (
            <>
              <Upload className="h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">Drop your file here</p>
              <p className="text-sm text-muted-foreground">or click to browse — CSV, XLSX, XLS</p>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); reset(); }}
                className="ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* Column mapping info */}
      <Card className="bg-muted/40 border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Auto Column Detection</CardTitle>
          <CardDescription className="text-xs">
            The system maps your columns automatically based on keywords.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {[
            { label: "Product", hint: "product, item, name" },
            { label: "Date", hint: "date, time, period" },
            { label: "Revenue", hint: "revenue, amount, sales, price" },
            { label: "Quantity", hint: "qty, quantity, units, count" },
            { label: "Category", hint: "category, type, group" },
          ].map(({ label, hint }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <Badge variant="secondary">{label}</Badge>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Upload button */}
      {file && status !== "success" && (
        <Button onClick={handleUpload} disabled={status === "uploading"} className="w-fit">
          {status === "uploading" ? "Uploading & running forecast..." : "Upload File"}
        </Button>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Success */}
      {status === "success" && result && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-start gap-3 pt-6">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">{result.message}</p>
              <p className="text-sm text-green-700 mt-1">
                {result.inserted} sales records inserted. ML forecast has been triggered.
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={reset}>
                Upload another file
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
