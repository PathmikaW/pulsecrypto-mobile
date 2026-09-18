import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../../core/components/Icon';
import type { SvgIconName } from '../../../core/icons/svgIcons';
import { colors, radius, spacing, typography } from '../../../core/theme';

interface AccountDrawerProps {
  visible: boolean;
  onClose: () => void;
}

// Maps to Figma's "Aside — Side Navigation Drawer" (node 1:271, width verified as 320 of
// the Terminal frame's 390 — ~82%), reachable from Terminal's hamburger button
// (specs/mobile-screens.md). No account system, auth, or backend exists anywhere in this
// project - this is intentionally static/decorative content and no-op links, built for
// Figma fidelity per ADR-M10, not a real account feature. "Trade History" is shown active
// (highlighted) because that's how the source file itself designed it, not a real
// selection state.
export function AccountDrawer({ visible, onClose }: AccountDrawerProps) {
  const { t } = useTranslation('market-details');
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.panel, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.profile}>
            <View style={styles.avatar}>
              <Icon name="avatarPerson" size={28} color={colors.signal.positiveMuted} />
            </View>
            <Text style={styles.name}>{t('accountDrawer.profileName')}</Text>
            <Text style={styles.tier}>{t('accountDrawer.tier')}</Text>
          </View>
          <View style={styles.divider} />

          <Text style={styles.groupLabel}>{t('accountDrawer.account')}</Text>
          <DrawerLink icon="drawerApiKeys" label={t('accountDrawer.apiKeys')} />
          <DrawerLink icon="drawerSecurity" label={t('accountDrawer.security')} />

          <Text style={styles.groupLabel}>{t('accountDrawer.trading')}</Text>
          <DrawerLink icon="drawerTradeHistory" label={t('accountDrawer.tradeHistory')} active />
          <DrawerLink icon="drawerSupport" label={t('accountDrawer.support')} />

          <View style={styles.signOutBorder}>
            <Pressable style={styles.signOut} onPress={onClose}>
              <Icon name="drawerSignOut" size={18} color={colors.text.primary} />
              <Text style={styles.signOutText}>{t('accountDrawer.signOut')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DrawerLink({ icon, label, active }: { icon: SvgIconName; label: string; active?: boolean }) {
  const tintColor = active ? colors.signal.positiveMuted : colors.text.numeric;
  return (
    <Pressable style={[styles.link, active && styles.linkActive]}>
      <Icon name={icon} size={16} color={tintColor} />
      <Text style={[styles.linkText, active && { color: tintColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row' },
  panel: {
    width: '82%',
    backgroundColor: colors.background.recessed,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  profile: { alignItems: 'flex-start', gap: spacing.xs, paddingBottom: spacing.lg },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.card,
    backgroundColor: colors.signal.positiveDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: colors.text.primary, ...typography.heading },
  tier: { color: colors.text.numeric, ...typography.bodySmall },
  divider: { height: 1, backgroundColor: colors.background.divider, marginBottom: spacing.md },
  groupLabel: { color: colors.text.label, ...typography.labelCaps, marginTop: spacing.md },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  linkActive: { backgroundColor: colors.signal.positiveDeep },
  linkText: { color: colors.text.primary, ...typography.body },
  signOutBorder: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: colors.background.divider,
    paddingTop: spacing.sm,
  },
  signOut: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  signOutText: { color: colors.text.primary, ...typography.body },
});
