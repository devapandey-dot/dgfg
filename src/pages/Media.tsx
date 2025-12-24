
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { mediaService, MediaAssetItem, MediaListResponse } from "@/services/media.service";
import { uploadService } from "@/services/upload.service";
import { Upload, Trash2, Image as ImageIcon, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Media = () => {
  const { toast } = useToast();
  const [assets, setAssets] = useState<MediaAssetItem[]>([]);
  const [meta, setMeta] = useState<MediaListResponse["meta"]>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [isUploading, setIsUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerAsset, setViewerAsset] = useState<MediaAssetItem | null>(null);

  const queryParams = useMemo(() => ({ page, limit, sort_by: sortBy, sort_order: sortOrder, search: searchQuery.trim() || undefined }), [page, limit, sortBy, sortOrder, searchQuery]);

  const loadAssets = async () => {
    const res = await mediaService.list(queryParams);
    if (res.success) {
      const list = Array.isArray(res.data) ? (res.data as any[]) : (res.data?.data ?? []);
      const metaFrom = Array.isArray(res.data) ? (res as any).meta : (res.data?.meta ?? (res as any).meta);
      setAssets(list ?? []);
      if (metaFrom) setMeta(metaFrom);
    } else {
      toast({ title: "Failed to load media", description: res.error || "Unknown error", variant: "destructive" });
    }
  };

  useEffect(() => {
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sortBy, sortOrder]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const uploadRes = await uploadService.uploadFile(file);
        if (!uploadRes.success || !uploadRes.data) {
          toast({ title: `Upload failed`, description: uploadRes.error || file.name, variant: "destructive" });
          continue;
        }
        const createRes = await mediaService.create({
          file_url: uploadRes.data.url,
          file_type: uploadRes.data.mimetype,
          file_size: uploadRes.data.size,
          original_name: uploadRes.data.filename,
          storage_provider: uploadRes.data.storage,
          title: file.name,
        });
        if (!createRes.success) {
          toast({ title: "Failed to save media", description: createRes.error || file.name, variant: "destructive" });
        }
      }
      await loadAssets();
      toast({ title: "Upload complete" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (assetId: number) => {
    const res = await mediaService.delete(assetId);
    if (res.success) {
      toast({ title: "Media removed" });
      await loadAssets();
    } else {
      toast({ title: "Delete failed", description: res.error || "Unknown error", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
            <p className="text-muted-foreground">Manage your images and videos for posts.</p>
          </div>
          <label htmlFor="media-upload" className="block">
            <div className="inline-flex items-center gap-2 border border-border rounded-lg px-4 py-2 cursor-pointer hover:bg-muted/30">
              <Upload className="h-4 w-4" />
              <span>Upload</span>
              <input id="media-upload" type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => handleUpload(e.target.files)} />
            </div>
          </label>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border shadow-card p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2 md:col-span-2">
            <Label>Search</Label>
            <div className="relative">
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search title or file name" onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); loadAssets(); } }} />
              <Search className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Sort by</Label>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Created</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="rights_expiry">Rights expiry</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Order</Label>
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DESC">DESC</SelectItem>
                <SelectItem value="ASC">ASC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid */}
        <div className="bg-card rounded-xl border border-border shadow-card p-4">
          {assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-3" />
              <p>No media found</p>
              <p className="text-xs">Upload files to build your library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {assets.map((asset) => {
                const isImage = (asset.file_type || '').startsWith('image/');
                return (
                  <div key={asset.asset_id} className="relative border border-border rounded-lg overflow-hidden">
                    <div className="aspect-video bg-muted flex items-center justify-center cursor-pointer" onClick={() => { setViewerAsset(asset); setViewerOpen(true); }}>
                      {isImage ? (
                        <img src={asset.file_url} alt={asset.title || asset.original_name || 'media'} className="w-full h-full object-cover" />
                      ) : (
                        <video src={asset.file_url} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-2 text-xs flex items-center justify-between">
                      <div className="truncate max-w-[70%]">{asset.title || asset.original_name || asset.file_url}</div>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(asset.asset_id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages} • {meta.total} items</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
            <Button variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      </div>
      {/* Viewer modal */}
      <Dialog open={viewerOpen} onOpenChange={(o) => { setViewerOpen(o); if (!o) setViewerAsset(null); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewerAsset?.title || viewerAsset?.original_name || 'Preview'}</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg overflow-hidden border">
            {viewerAsset ? (
              (viewerAsset.file_type || '').startsWith('image/') ? (
                <img src={viewerAsset.file_url} alt={viewerAsset.title || viewerAsset.original_name || 'media'} className="w-full h-auto max-h-[75vh] object-contain bg-black" />
              ) : (
                <video key={viewerAsset.file_url} src={viewerAsset.file_url} controls autoPlay playsInline className="w-full h-auto max-h-[75vh] bg-black" />
              )
            ) : null}
          </div>
          <div className="flex items-center justify-end">
            <Button variant="outline" onClick={() => setViewerOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Media;