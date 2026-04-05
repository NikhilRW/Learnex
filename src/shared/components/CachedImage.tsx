import {StyleProp, ImageStyle, View} from 'react-native';
import { NitroImage } from 'react-native-nitro-image';

type SourceInput = string | number | {uri?: string} | null | undefined;

type NitroImageProps = React.ComponentProps<typeof NitroImage>;
type NitroSource = NitroImageProps['image'];

export type CachedImageProps = Omit<NitroImageProps, 'image'> & {
  source?: SourceInput;
  fallback?: React.ReactNode;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
};

const normalizeSource = (source?: SourceInput): NitroSource | null => {
  if (!source) {
    return null;
  }

  if (typeof source === 'number') {
    return source;
  }

  const toWebOrFile = (value: string): NitroSource => {
    if (value.startsWith('file://')) {
      return {filePath: value};
    }
    return {url: value};
  };

  if (typeof source === 'string') {
    return toWebOrFile(source);
  }

  if (typeof source === 'object' && source.uri) {
    return toWebOrFile(source.uri);
  }

  return null;
};

const CachedImage = ({ source, fallback = null, style, contentFit,containerStyle, ...rest }: CachedImageProps) => {
  const normalizedSource = normalizeSource(source);

  if (!normalizedSource) {
    return <>{fallback}</>;
  }

  const resolvedResizeMode =
    rest.resizeMode ?? (contentFit as NitroImageProps['resizeMode']);

  return (
    <View style={containerStyle}>
      <NitroImage
      image={normalizedSource}

      style={style}
      {...rest}
        resizeMode={resolvedResizeMode}
      />
    </View>
  );
};

CachedImage.displayName = 'CachedImage';
export default CachedImage;