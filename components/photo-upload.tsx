"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"
import Image from "next/image"

type Photo = {
  id: string
  url: string
  descricao: string | null
  created_at: string
}

export function PhotoUpload({ ordemServicoId, photos }: { ordemServicoId: string; photos: Photo[] }) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [localPhotos, setLocalPhotos] = useState<Photo[]>(photos)

  // Sync with props when photos change
  useEffect(() => {
    setLocalPhotos(photos)
  }, [photos])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setError("")
    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        // Upload to Supabase Storage
        const fileExt = file.name.split(".").pop()
        const fileName = `${ordemServicoId}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage.from("fotos-os").upload(fileName, file)

        if (uploadError) throw uploadError

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("fotos-os").getPublicUrl(fileName)

        // Save to database
        const { data, error: dbError } = await supabase
          .from("fotos")
          .insert([
            {
              ordem_servico_id: ordemServicoId,
              url: publicUrl,
              nome_arquivo: file.name,
            },
          ])
          .select()
          .single()

        if (dbError) throw dbError

        setLocalPhotos((prev) => [...prev, data])
      }
    } catch (err: any) {
      setError(err.message || "Erro ao fazer upload")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (photoId: string, url: string) => {
    try {
      // Extract file path from URL
      const urlParts = url.split("/fotos-os/")
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        await supabase.storage.from("fotos-os").remove([filePath])
      }

      // Delete from database
      await supabase.from("fotos").delete().eq("id", photoId)

      setLocalPhotos(localPhotos.filter((p) => p.id !== photoId))
    } catch (err: any) {
      setError(err.message || "Erro ao deletar foto")
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2">
        <input
          type="file"
          id="photo-upload"
          accept="image/*"
          multiple
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
        <label htmlFor="photo-upload">
          <Button type="button" variant="outline" disabled={uploading} asChild>
            <span>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? "Enviando..." : "Adicionar Fotos"}
            </span>
          </Button>
        </label>
      </div>

      {localPhotos.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Nenhuma foto adicionada</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {localPhotos.map((photo) => (
            <Card key={photo.id} className="relative group overflow-hidden">
              <div className="aspect-square relative">
                <Image
                  src={photo.url || "/placeholder.svg"}
                  alt={photo.descricao || "Foto"}
                  fill
                  className="object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(photo.id, photo.url)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
