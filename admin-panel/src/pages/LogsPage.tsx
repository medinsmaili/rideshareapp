import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useLogs } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RefreshCw, Loader2, FileText, Search, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function LogsPage() {
  const [lines, setLines] = useState(500);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error, refetch, isFetching } = useLogs(lines);

  const content = data?.content || "";
  const source = data?.source;

  const filteredLines = search
    ? content.split("\n").filter(l => l.toLowerCase().includes(search.toLowerCase())).join("\n")
    : content;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(filteredLines);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div>
      <PageHeader
        title="Backend Logs"
        description={source ? `Source: ${source}` : "Tailing backend log files"}
        actions={
          <div className="flex items-center gap-2">
            <Select value={String(lines)} onValueChange={(v) => setLines(Number(v))}>
              <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="100">Last 100</SelectItem>
                <SelectItem value="500">Last 500</SelectItem>
                <SelectItem value="1000">Last 1000</SelectItem>
                <SelectItem value="5000">Last 5000</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Refresh
            </Button>
          </div>
        }
      />

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Filter lines..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button size="sm" variant="outline" onClick={copyToClipboard} disabled={!content}>
            {copied ? <Check className="h-4 w-4 mr-1 text-success" /> : <Copy className="h-4 w-4 mr-1" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Failed to load logs</p>
            <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
          </div>
        ) : (
          <pre className="p-4 m-0 bg-[#0d1117] text-[#c9d1d9] font-mono text-xs leading-relaxed max-h-[70vh] overflow-auto whitespace-pre-wrap break-all">
            {filteredLines || <span className="text-muted-foreground italic">— no log content —</span>}
          </pre>
        )}
      </div>
    </div>
  );
}
