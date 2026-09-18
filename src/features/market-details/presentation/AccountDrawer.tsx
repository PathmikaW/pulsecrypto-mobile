import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../core/theme';

interface AccountDrawerProps {
  visible: boolean;
  onClose: () => void;
}

// Maps to Figma's "Aside — Side Navigation Drawer" (node 1:271), reachable from Terminal's
// hamburger button (specs/mobile-screens.md). No account system, auth, or backend exists
// anywhere in this project - this is intentionally static/decorative content and no-op
// links, built for Figma fidelity per ADR-M10, not a real account feature.
export function AccountDrawer({ visible, onClose }: AccountDrawerProps) {
  const { t } = useTranslation('market-details');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
          <View style={styles.profile}>
            <View style={styles.avatar} />
            <Text style={styles.name}>{t('accountDrawer.profileName')}</Text>
            <Text style={styles.tier}>{t('accountDrawer.tier')}</Text>
          </View>

          <Text style={styles.groupLabel}>{t('accountDrawer.account')}</Text>
          <DrawerLink label={t('accountDrawer.apiKeys')} />
          <DrawerLink label={t('accountDrawer.security')} />

          <Text style={styles.groupLabel}>{t('accountDrawer.trading')}</Text>
          <DrawerLink label={t('accountDrawer.tradeHistory')} />
          <DrawerLink label={t('accountDrawer.support')} />

          <Pressable style={styles.signOut} onPress={onClose}>
            <Text style={styles.signOutText}>{t('accountDrawer.signOut')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DrawerLink({ label }: { label: string }) {
  return (
    <Pressable style={styles.link}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row' },
  panel: {
    width: '78%',
    backgroundColor: colors.background.recessed,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  profile: {
    backgroundColor: colors.background.navBar,
    borderRadius: radius.card,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.signal.positiveDeep,
  },
  name: { color: colors.text.primary, ...typography.body },
  tier: { color: colors.text.label, ...typography.bodySmall },
  groupLabel: { color: colors.text.label, ...typography.labelCaps, marginTop: spacing.md },
  link: { paddingVertical: spacing.sm },
  linkText: { color: colors.text.primary, ...typography.body },
  signOut: { marginTop: 'auto', paddingVertical: spacing.md },
  signOutText: { color: colors.signal.negative, ...typography.body },
});
