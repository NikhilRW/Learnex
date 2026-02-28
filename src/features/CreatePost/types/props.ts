import {PostFormData} from './main';

export interface DraftBannerProps {
  onRestore: () => void;
  onDiscard: () => void;
  styles: any;
}

export interface PermissionStatusProps {
  onRequestPermissions: () => Promise<boolean>;
  styles: any;
}

export interface UploadProgressProps {
  uploadProgress: number;
  currentUploadIndex: number;
  totalCount: number;
  isDark: boolean;
  styles: any;
}

export interface MediaGridProps {
  formData: PostFormData;
  isDark: boolean;
  loading: boolean;
  pickerError: string | null;
  uploadProgress: number;
  currentUploadIndex: number;
  canAddMoreMedia: () => boolean;
  hasStoragePermission: boolean;
  onRemoveMedia: (index: number) => void;
  onPickMedia: () => Promise<void>;
  onRequestPermissions: () => Promise<boolean>;
  styles: any;
}

export interface CaptionInputProps {
  description: string;
  isDark: boolean;
  showSuggestions: boolean;
  suggestions: string[];
  onChangeText: (text: string) => void;
  onApplySuggestion: (suggestion: string) => void;
  styles: any;
}

export interface TagsInputProps {
  hashtags: string[];
  tagInput: string;
  isDark: boolean;
  onChangeTagInput: (text: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  styles: any;
}

export interface VisibilityToggleProps {
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
  styles: any;
}
