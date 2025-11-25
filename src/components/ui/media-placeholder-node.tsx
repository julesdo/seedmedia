'use client';

import * as React from 'react';

import type { TPlaceholderElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import {
  PlaceholderPlugin,
  PlaceholderProvider,
  updateUploadHistory,
} from '@platejs/media/react';
import { AudioLines, FileUp, Film, ImageIcon, Loader2Icon } from 'lucide-react';
import { KEYS } from 'platejs';
import { PlateElement, useEditorPlugin, withHOC } from 'platejs/react';
import { useFilePicker } from 'use-file-picker';

import { cn } from '@/lib/utils';
import { useUploadFile } from '@/hooks/use-upload-file';
import { useImageUploadContext } from '@/components/articles/ImageUploadContext';

const CONTENT: Record<
  string,
  {
    accept: string[];
    content: React.ReactNode;
    icon: React.ReactNode;
  }
> = {
  [KEYS.audio]: {
    accept: ['audio/*'],
    content: 'Add an audio file',
    icon: <AudioLines />,
  },
  [KEYS.file]: {
    accept: ['*'],
    content: 'Add a file',
    icon: <FileUp />,
  },
  [KEYS.img]: {
    accept: ['image/*'],
    content: 'Add an image',
    icon: <ImageIcon />,
  },
  [KEYS.video]: {
    accept: ['video/*'],
    content: 'Add a video',
    icon: <Film />,
  },
};

export const PlaceholderElement = withHOC(
  PlaceholderProvider,
  function PlaceholderElement(props: PlateElementProps<TPlaceholderElement>) {
    const { editor, element } = props;

    const { api } = useEditorPlugin(PlaceholderPlugin);

    // Utiliser le contexte d'upload personnalisé si disponible, sinon utiliser UploadThing
    const imageUploadContext = useImageUploadContext();
    const uploadThingHook = useUploadFile();
    
    // Si on a un contexte d'upload personnalisé, créer un wrapper pour l'utiliser
    const customUploadFile = React.useCallback(async (file: File) => {
      if (imageUploadContext) {
        const blobUrl = await imageUploadContext.handleImageUpload(file);
        // Retourner un objet compatible avec UploadedFile
        return {
          key: blobUrl,
          url: blobUrl,
          name: file.name,
          size: file.size,
          type: file.type,
        } as any;
      }
      return uploadThingHook.uploadFile(file);
    }, [imageUploadContext, uploadThingHook]);

    const { isUploading, progress, uploadedFile, uploadingFile } = imageUploadContext
      ? {
          isUploading: false,
          progress: 0,
          uploadedFile: undefined,
          uploadingFile: undefined,
        }
      : uploadThingHook;
    
    // État local pour gérer l'upload personnalisé
    const [customUploading, setCustomUploading] = React.useState(false);
    const [customUploadedFile, setCustomUploadedFile] = React.useState<any>(undefined);
    const [customUploadingFile, setCustomUploadingFile] = React.useState<File | undefined>(undefined);

    const loading = finalIsUploading && finalUploadingFile;

    const currentContent = CONTENT[element.mediaType];

    const isImage = element.mediaType === KEYS.img;

    const imageRef = React.useRef<HTMLImageElement>(null);

    const { openFilePicker } = useFilePicker({
      accept: currentContent.accept,
      multiple: true,
      onFilesSelected: ({ plainFiles: updatedFiles }) => {
        const firstFile = updatedFiles[0];
        const restFiles = updatedFiles.slice(1);

        replaceCurrentPlaceholder(firstFile);

        if (restFiles.length > 0) {
          editor.getTransforms(PlaceholderPlugin).insert.media(restFiles);
        }
      },
    });

    const replaceCurrentPlaceholder = React.useCallback(
      async (file: File) => {
        if (imageUploadContext) {
          // Utiliser l'upload personnalisé
          setCustomUploading(true);
          setCustomUploadingFile(file);
          api.placeholder.addUploadingFile(element.id as string, file);
          
          try {
            const blobUrl = await imageUploadContext.handleImageUpload(file);
            const uploadedFileData = {
              key: blobUrl,
              url: blobUrl,
              name: file.name,
              size: file.size,
              type: file.type,
            };
            setCustomUploadedFile(uploadedFileData);
            setCustomUploading(false);
            setCustomUploadingFile(undefined);
          } catch (error) {
            console.error('Erreur upload image:', error);
            setCustomUploading(false);
            setCustomUploadingFile(undefined);
            api.placeholder.removeUploadingFile(element.id as string);
          }
        } else {
          // Utiliser UploadThing
          void uploadThingHook.uploadFile(file);
          api.placeholder.addUploadingFile(element.id as string, file);
        }
      },
      [api.placeholder, element.id, imageUploadContext, uploadThingHook]
    );

    // Utiliser uploadedFile ou customUploadedFile selon le contexte
    const finalUploadedFile = imageUploadContext ? customUploadedFile : uploadedFile;
    const finalIsUploading = imageUploadContext ? customUploading : isUploading;
    const finalUploadingFile = imageUploadContext ? customUploadingFile : uploadingFile;

    React.useEffect(() => {
      if (!finalUploadedFile) return;

      const path = editor.api.findPath(element);

      editor.tf.withoutSaving(() => {
        editor.tf.removeNodes({ at: path });

        const node = {
          children: [{ text: '' }],
          initialHeight: imageRef.current?.height,
          initialWidth: imageRef.current?.width,
          isUpload: true,
          name: element.mediaType === KEYS.file ? finalUploadedFile.name : '',
          placeholderId: element.id as string,
          type: element.mediaType!,
          url: finalUploadedFile.url,
        };

        editor.tf.insertNodes(node, { at: path });

        updateUploadHistory(editor, node);
      });

      api.placeholder.removeUploadingFile(element.id as string);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finalUploadedFile, element.id]);

    // React dev mode will call React.useEffect twice
    const isReplaced = React.useRef(false);

    /** Paste and drop */
    React.useEffect(() => {
      if (isReplaced.current) return;

      isReplaced.current = true;
      const currentFiles = api.placeholder.getUploadingFile(
        element.id as string
      );

      if (!currentFiles) return;

      void replaceCurrentPlaceholder(currentFiles);

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReplaced]);

    return (
      <PlateElement className="my-1" {...props}>
        {(!loading || !isImage) && (
          <div
            className={cn(
              'flex cursor-pointer items-center rounded-sm bg-muted p-3 pr-9 select-none hover:bg-primary/10'
            )}
            onClick={() => !loading && openFilePicker()}
            contentEditable={false}
          >
            <div className="relative mr-3 flex text-muted-foreground/80 [&_svg]:size-6">
              {currentContent.icon}
            </div>
            <div className="text-sm whitespace-nowrap text-muted-foreground">
              <div>
                {loading ? finalUploadingFile?.name : currentContent.content}
              </div>

              {loading && !isImage && (
                <div className="mt-1 flex items-center gap-1.5">
                  <div>{formatBytes(finalUploadingFile?.size ?? 0)}</div>
                  <div>–</div>
                  <div className="flex items-center">
                    <Loader2Icon className="mr-1 size-3.5 animate-spin text-muted-foreground" />
                    {imageUploadContext ? 'Upload...' : `${progress ?? 0}%`}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isImage && loading && finalUploadingFile && (
          <ImageProgress
            file={finalUploadingFile}
            imageRef={imageRef}
            progress={imageUploadContext ? 100 : progress}
          />
        )}

        {props.children}
      </PlateElement>
    );
  }
);

export function ImageProgress({
  className,
  file,
  imageRef,
  progress = 0,
}: {
  file: File;
  className?: string;
  imageRef?: React.RefObject<HTMLImageElement | null>;
  progress?: number;
}) {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!objectUrl) {
    return null;
  }

  return (
    <div className={cn('relative', className)} contentEditable={false}>
      <img
        ref={imageRef}
        className="h-auto w-full rounded-sm object-cover"
        alt={file.name}
        src={objectUrl}
      />
      {progress < 100 && (
        <div className="absolute right-1 bottom-1 flex items-center space-x-2 rounded-full bg-black/50 px-1 py-0.5">
          <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
          <span className="text-xs font-medium text-white">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
}

function formatBytes(
  bytes: number,
  opts: {
    decimals?: number;
    sizeType?: 'accurate' | 'normal';
  } = {}
) {
  const { decimals = 0, sizeType = 'normal' } = opts;

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const accurateSizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];

  if (bytes === 0) return '0 Byte';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === 'accurate'
      ? (accurateSizes[i] ?? 'Bytest')
      : (sizes[i] ?? 'Bytes')
  }`;
}
