import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../theme/colors';

export type FeedbackKind = 'success' | 'error' | 'info';

export interface FeedbackNotice {
  kind: FeedbackKind;
  title: string;
  message: string;
  actionLabel?: string;
}

interface FeedbackDialogProps {
  notice: FeedbackNotice | null;
  onClose: () => void;
}

export default function FeedbackDialog({ notice, onClose }: FeedbackDialogProps) {
  if (!notice) return null;

  const palette = {
    success: {
      icon: '✓',
      iconBackground: colors.successLight,
      iconColor: colors.success,
      accent: colors.success,
      button: colors.success,
    },
    error: {
      icon: '×',
      iconBackground: colors.dangerLight,
      iconColor: colors.danger,
      accent: colors.danger,
      button: colors.danger,
    },
    info: {
      icon: '!',
      iconBackground: colors.infoLight,
      iconColor: colors.info,
      accent: colors.info,
      button: colors.info,
    },
  }[notice.kind];

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={[styles.icon, { backgroundColor: palette.iconBackground }]}>
            <Text style={[styles.iconText, { color: palette.iconColor }]}>{palette.icon}</Text>
          </View>
          <Text style={[styles.title, { color: palette.accent }]}>{notice.title}</Text>
          <Text style={styles.message}>{notice.message}</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: palette.button }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>{notice.actionLabel ?? 'Entendido'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 23, 39, 0.68)',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  icon: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    marginBottom: 16,
  },
  iconText: { fontSize: 38, lineHeight: 44, fontWeight: '800' },
  title: { fontSize: 21, fontWeight: '800', textAlign: 'center' },
  message: {
    color: '#526273',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 9,
    marginBottom: 22,
  },
  button: {
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
