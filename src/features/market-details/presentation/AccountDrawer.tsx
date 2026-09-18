import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Icon } from '../../../core/components/Icon';
import type { SvgIconName } from '../../../core/icons/svgIcons';
import { colors, radius, spacing, typography } from '../../../core/theme';
import { useUiStore } from '../../../store/uiStore';

const PANEL_WIDTH_RATIO = 0.82; // 320 of the Terminal frame's 390 (verified in Figma)
const ANIMATION_DURATION_MS = 250;

// Maps to Figma's "Aside — Side Navigation Drawer" (node 1:271). A single global overlay,
// mounted once at the app root (app.tsx) and opened from any screen's TopAppBar via
// uiStore - not a per-screen instance. Slides in horizontally on the UI thread via
// reanimated (ADR-M4's "smooth, no lag" standard applies here too) - RN's built-in
// <Modal animationType="slide"> only slides vertically, which is wrong for a side drawer,
// so the Modal's own animation is disabled and this drives the motion instead.
//
// No account system, auth, or backend exists anywhere in this project - the profile
// content and links are intentionally static/decorative (ADR-M10). Tapping a link surfaces
// a "Coming Soon" notice rather than silently doing nothing, matching mobile-screens.md's
// explicit allowance for no-ops or a placeholder destination on unimplemented features.
export function AccountDrawer() {
  const { t } = useTranslation('market-details');
  const insets = useSafeAreaInsets();
  const isOpen = useUiStore((state) => state.isDrawerOpen);
  const closeDrawer = useUiStore((state) => state.closeDrawer);

  const { width: windowWidth } = useWindowDimensions();
  const panelWidth = windowWidth * PANEL_WIDTH_RATIO;
  const translateX = useSharedValue(-panelWidth);
  const backdropOpacity = useSharedValue(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Deliberately keyed on `isOpen` alone: this synchronizes the animation with an
    // external system (the UI thread, via reanimated shared values), which is exactly
    // what effects are for — the alternative (mounting immediately, unmounting only after
    // the close animation's own completion callback fires) is the standard pattern for a
    // slide-out-before-unmount drawer, not an accidental cascading render.
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above.
      setIsMounted(true);
      translateX.value = withTiming(0, { duration: ANIMATION_DURATION_MS });
      backdropOpacity.value = withTiming(1, { duration: ANIMATION_DURATION_MS });
    } else if (isMounted) {
      translateX.value = withTiming(-panelWidth, { duration: ANIMATION_DURATION_MS });
      backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION_MS }, (finished) => {
        if (finished) runOnJS(setIsMounted)(false);
      });
    }
    // Deps intentionally exclude panelWidth/translateX/backdropOpacity/isMounted: this
    // effect is a one-shot "respond to the isOpen transition" handler, not a continuous
    // sync - including the shared values or isMounted (which this effect itself writes)
    // would either do nothing (shared values are stable refs) or cause a retrigger loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  const showComingSoon = (label: string) => {
    Alert.alert(t('accountDrawer.comingSoonTitle'), t('accountDrawer.comingSoonBody', { feature: label }));
  };

  if (!isMounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={closeDrawer}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeDrawer}
            accessibilityLabel={t('accountDrawer.close')}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            { width: panelWidth, paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom },
            panelStyle,
          ]}
        >
          <View style={styles.profile}>
            <View style={styles.avatar}>
              <Icon name="avatarPerson" size={28} color={colors.signal.positiveMuted} />
            </View>
            <Text style={styles.name}>{t('accountDrawer.profileName')}</Text>
            <Text style={styles.tier}>
              {t('accountDrawer.tierLabel')}
              <Text style={styles.tierId}>{t('accountDrawer.tierId')}</Text>
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.content}>
            <Text style={styles.groupLabel}>{t('accountDrawer.account')}</Text>
            <DrawerLink icon="drawerApiKeys" label={t('accountDrawer.apiKeys')} onPress={showComingSoon} />
            <DrawerLink icon="drawerSecurity" label={t('accountDrawer.security')} onPress={showComingSoon} />

            <Text style={styles.groupLabel}>{t('accountDrawer.trading')}</Text>
            <DrawerLink
              icon="drawerTradeHistory"
              label={t('accountDrawer.tradeHistory')}
              onPress={showComingSoon}
              active
            />
            <DrawerLink icon="drawerSupport" label={t('accountDrawer.support')} onPress={showComingSoon} />
          </View>

          <View style={styles.signOutBorder}>
            <Pressable style={styles.signOut} onPress={closeDrawer}>
              <Icon name="drawerSignOut" size={18} color={colors.text.primary} />
              <Text style={styles.signOutText}>{t('accountDrawer.signOut')}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function DrawerLink({
  icon,
  label,
  active,
  onPress,
}: {
  icon: SvgIconName;
  label: string;
  active?: boolean;
  onPress: (label: string) => void;
}) {
  const tintColor = active ? colors.signal.positiveMuted : colors.text.numeric;
  return (
    <Pressable style={[styles.link, active && styles.linkActive]} onPress={() => onPress(label)}>
      <Icon name={icon} size={16} color={tintColor} />
      <Text style={[styles.linkText, active && { color: tintColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.5)' },
  panel: {
    backgroundColor: colors.background.recessed,
    gap: spacing.sm,
  },
  // Horizontal padding lives on the content sections, not the panel itself, so the divider
  // lines can span the drawer's full width edge-to-edge, matching Figma exactly.
  content: { paddingHorizontal: spacing.lg },
  profile: {
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
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
  tierId: { color: colors.signal.positive },
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
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
  },
  signOutText: { color: colors.text.primary, ...typography.body },
});
