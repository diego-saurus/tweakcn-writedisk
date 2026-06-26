export {};

declare global {
  interface Window {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
  }

  interface SaveFilePickerOptions {
    suggestedName?: string;
    startIn?: string | FileSystemHandle;
    id?: string;
    types?: FilePickerAcceptType[];
    excludeAcceptAllOption?: boolean;
  }

  interface FilePickerAcceptType {
    description?: string;
    accept: Record<string, string[]>;
  }

  interface FileSystemFileHandle {
    queryPermission?: (descriptor?: FileSystemPermissionDescriptor) => Promise<PermissionState>;
    requestPermission?: (descriptor?: FileSystemPermissionDescriptor) => Promise<PermissionState>;
    isSameEntry?: (other: FileSystemHandle) => Promise<boolean>;
  }

  interface FileSystemPermissionDescriptor {
    mode?: "read" | "readwrite";
  }
}