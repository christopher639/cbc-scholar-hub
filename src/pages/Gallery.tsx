import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Image, Loader2, Upload } from "lucide-react";

interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: string;
  display_order: number;
  is_published: boolean;
  created_at: string;
}

const categories = [
  { value: "facilities", label: "Facilities" },
  { value: "events", label: "Events" },
  { value: "sports", label: "Sports" },
  { value: "academics", label: "Academics" },
  { value: "general", label: "General" },
];

export default function Gallery() {
  const { toast } = useToast();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    category: "general",
    display_order: 0,
    is_published: true,
  });

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gallery_images")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast({ title: "Error", description: "Failed to load gallery images", variant: "destructive" });
    } else {
      setImages(data || []);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `gallery-${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from("avatars")
      .upload(fileName, file);

    if (uploadError) {
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
    setFormData({ ...formData, image_url: publicUrl });
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.image_url.trim()) {
      toast({ title: "Error", description: "Title and image are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (selectedImage) {
        const { error } = await supabase
          .from("gallery_images")
          .update({
            title: formData.title,
            description: formData.description || null,
            image_url: formData.image_url,
            category: formData.category,
            display_order: formData.display_order,
            is_published: formData.is_published,
          })
          .eq("id", selectedImage.id);

        if (error) throw error;
        toast({ title: "Success", description: "Image updated successfully" });
      } else {
        const { error } = await supabase.from("gallery_images").insert({
          title: formData.title,
          description: formData.description || null,
          image_url: formData.image_url,
          category: formData.category,
          display_order: formData.display_order,
          is_published: formData.is_published,
        });

        if (error) throw error;
        toast({ title: "Success", description: "Image added successfully" });
      }

      setDialogOpen(false);
      resetForm();
      fetchImages();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedImage) return;

    try {
      const { error } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", selectedImage.id);

      if (error) throw error;
      toast({ title: "Success", description: "Image deleted successfully" });
      setDeleteDialogOpen(false);
      setSelectedImage(null);
      fetchImages();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = (image: GalleryImage) => {
    setSelectedImage(image);
    setFormData({
      title: image.title,
      description: image.description || "",
      image_url: image.image_url,
      category: image.category,
      display_order: image.display_order,
      is_published: image.is_published,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedImage(null);
    setFormData({
      title: "",
      description: "",
      image_url: "",
      category: "general",
      display_order: 0,
      is_published: true,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Photo Gallery</h1>
            <p className="text-muted-foreground">Manage images displayed on the public homepage</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Image
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{selectedImage ? "Edit Image" : "Add New Image"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Image title"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Image *</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="Image URL or upload below"
                        className="flex-1"
                      />
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button type="button" variant="outline" size="icon" disabled={uploading} asChild>
                          <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</span>
                        </Button>
                      </label>
                    </div>
                    {formData.image_url && (
                      <img src={formData.image_url} alt="Preview" className="h-32 w-full object-cover rounded-md" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label>Published</Label>
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {selectedImage ? "Update Image" : "Add Image"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : images.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Image className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No gallery images yet</p>
              <p className="text-sm text-muted-foreground">Add images to showcase on the homepage</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <Card key={image.id} className="overflow-hidden group">
                <div className="relative aspect-square">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" onClick={() => openEditDialog(image)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => { setSelectedImage(image); setDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {!image.is_published && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                      Draft
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="font-medium text-sm truncate">{image.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{image.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Image?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the image from the gallery.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}