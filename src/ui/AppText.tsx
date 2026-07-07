/** Themed text primitive. Maps a typography token + color token to a RN Text. */
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { colors, tabularNums, typography, TypographyToken } from '@/theme';

interface AppTextProps extends TextProps {
  variant?: TypographyToken;
  color?: keyof typeof colors;
  /** Apply tabular numerals (for any numeric display). */
  tabular?: boolean;
  center?: boolean;
}

export function AppText({
  variant = 'body',
  color = 'textPrimary',
  tabular = false,
  center = false,
  style,
  ...rest
}: AppTextProps) {
  const composed: TextStyle = {
    ...typography[variant],
    color: colors[color],
    ...(tabular ? tabularNums : null),
    ...(center ? { textAlign: 'center' } : null),
  };
  return <RNText {...rest} style={[composed, style]} />;
}
