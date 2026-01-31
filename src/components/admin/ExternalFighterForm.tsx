import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { User, Award, Weight, Building2, MapPin } from 'lucide-react';
import { WEIGHT_CLASSES, ENABLED_DISCIPLINES } from '@/lib/constants/disciplines';

interface ExternalFighterFormProps {
  formData: {
    name: string;
    nickname?: string;
    weight_class: string;
    gym?: string;
    country?: string;
    record?: {
      wins: number;
      losses: number;
      draws: number;
    };
  };
  imageFile?: File;
  onFormChange: (data: any) => void;
  onImageChange: (file: File | undefined) => void;
}

export const ExternalFighterForm = ({
  formData,
  imageFile,
  onFormChange,
  onImageChange,
}: ExternalFighterFormProps) => {
  const [imagePreview, setImagePreview] = useState<string>();

  const handleImageSelect = (file: File) => {
    onImageChange(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    onImageChange(undefined);
    setImagePreview(undefined);
  };

  return (
    <div className="space-y-4">
      {/* Image Upload */}
      <div>
        <Label>Foto del Peleador (sin fondo)</Label>
        <FileUpload
          accept="image/*"
          onFileSelect={handleImageSelect}
          onRemoveFile={handleImageRemove}
          maxSize={50}
          preview={imagePreview}
          autoResize={false}
          showResizeInfo={false}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Preferiblemente foto en posición de pelea sin fondo (máx. 50MB)
        </p>
      </div>

      {/* Name */}
      <div>
        <Label htmlFor="external-name">
          <User className="h-4 w-4 inline mr-2" />
          Nombre Completo *
        </Label>
        <Input
          id="external-name"
          value={formData.name}
          onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
          placeholder="Ej: Juan Carlos Pérez"
          required
        />
      </div>

      {/* Nickname */}
      <div>
        <Label htmlFor="external-nickname">Apodo</Label>
        <Input
          id="external-nickname"
          value={formData.nickname || ''}
          onChange={(e) => onFormChange({ ...formData, nickname: e.target.value })}
          placeholder="Ej: El Tigre"
        />
      </div>

      {/* Weight Class */}
      <div>
        <Label htmlFor="external-weight">
          <Weight className="h-4 w-4 inline mr-2" />
          Categoría de Peso *
        </Label>
        <Select
          value={formData.weight_class}
          onValueChange={(value) => onFormChange({ ...formData, weight_class: value })}
        >
          <SelectTrigger id="external-weight">
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent>
            {WEIGHT_CLASSES.map((wc) => (
              <SelectItem key={wc.value} value={wc.value}>
                {wc.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gym */}
      <div>
        <Label htmlFor="external-gym">
          <Building2 className="h-4 w-4 inline mr-2" />
          Gimnasio / Academia
        </Label>
        <Input
          id="external-gym"
          value={formData.gym || ''}
          onChange={(e) => onFormChange({ ...formData, gym: e.target.value })}
          placeholder="Ej: Team Alpha"
        />
      </div>

      {/* Country */}
      <div>
        <Label htmlFor="external-country">
          <MapPin className="h-4 w-4 inline mr-2" />
          País
        </Label>
        <Input
          id="external-country"
          value={formData.country || 'HN'}
          onChange={(e) => onFormChange({ ...formData, country: e.target.value })}
          placeholder="HN"
        />
      </div>

      {/* Record (Optional) */}
      <div>
        <Label>
          <Award className="h-4 w-4 inline mr-2" />
          Record (Opcional)
        </Label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label htmlFor="record-wins" className="text-xs">Victorias</Label>
            <Input
              id="record-wins"
              type="number"
              min="0"
              value={formData.record?.wins || 0}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  record: {
                    ...formData.record,
                    wins: parseInt(e.target.value) || 0,
                    losses: formData.record?.losses || 0,
                    draws: formData.record?.draws || 0,
                  },
                })
              }
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="record-losses" className="text-xs">Derrotas</Label>
            <Input
              id="record-losses"
              type="number"
              min="0"
              value={formData.record?.losses || 0}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  record: {
                    wins: formData.record?.wins || 0,
                    losses: parseInt(e.target.value) || 0,
                    draws: formData.record?.draws || 0,
                  },
                })
              }
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="record-draws" className="text-xs">Empates</Label>
            <Input
              id="record-draws"
              type="number"
              min="0"
              value={formData.record?.draws || 0}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  record: {
                    wins: formData.record?.wins || 0,
                    losses: formData.record?.losses || 0,
                    draws: parseInt(e.target.value) || 0,
                  },
                })
              }
              placeholder="0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
