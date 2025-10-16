import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  checklistId?: string;
}

export function ImageUpload({ images, onImagesChange, checklistId }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione apenas imagens.',
        variant: 'destructive',
      });
      return false;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 5MB.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = checklistId ? `${checklistId}/${fileName}` : `temp/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('checklist-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('checklist-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível fazer upload da imagem.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const validFiles = Array.from(files).filter(validateFile);
    if (validFiles.length === 0) {
      setUploading(false);
      return;
    }

    const uploadedUrls: string[] = [];
    const totalFiles = validFiles.length;

    for (let i = 0; i < validFiles.length; i++) {
      const url = await uploadImage(validFiles[i]);
      if (url) {
        uploadedUrls.push(url);
      }
      setUploadProgress(((i + 1) / totalFiles) * 100);
    }

    if (uploadedUrls.length > 0) {
      onImagesChange([...images, ...uploadedUrls]);
      toast({
        title: 'Upload concluído',
        description: `${uploadedUrls.length} imagem(ns) enviada(s) com sucesso.`,
      });
    }

    setUploading(false);
    setUploadProgress(0);
  };

  const removeImage = async (imageUrl: string) => {
    try {
      // Extrair o caminho do arquivo da URL
      const urlParts = imageUrl.split('/checklist-images/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('checklist-images').remove([filePath]);
      }

      onImagesChange(images.filter((img) => img !== imageUrl));
      toast({
        title: 'Imagem removida',
        description: 'A imagem foi removida com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a imagem.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Selecionar da Galeria
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
        >
          <Camera className="h-4 w-4 mr-2" />
          Tirar Foto
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Fazendo upload... {Math.round(uploadProgress)}%
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <img
                src={imageUrl}
                alt={`Imagem ${index + 1}`}
                className="w-full h-32 object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className={cn(
                  "absolute top-2 right-2 h-6 w-6",
                  "opacity-0 group-hover:opacity-100 transition-opacity"
                )}
                onClick={() => removeImage(imageUrl)}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
