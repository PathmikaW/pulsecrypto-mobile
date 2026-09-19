import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Icon } from '../../../core/components/Icon';
import type { SvgIconName } from '../../../core/icons/svgIcons';
import { colors, radius, spacing, typography } from '../../../core/theme';
import { useUiStore } from '../../../store/uiStore';
import { ComingSoonDialog } from './ComingSoonDialog';

const PANEL_WIDTH_RATIO = 0.82; // 320 of the Terminal frame's 390 (verified in Figma)
const ANIMATION_DURATION_MS = 250;

// Single global overlay mounted at the app root and opened via uiStore. Reanimated drives the horizontal slide because
// Modal's built-in animation is vertical-only. Content is static; links show a Coming Soon notice (ADR-M10).
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

  // Render-phase state update mounts the Modal in the same commit as the isOpen flip; an effect-based mount gate delayed opening (ADR-M11).
  if (isOpen && !isMounted) {
    setIsMounted(true);
  }

  useEffect(() => {
    // Keyed on isOpen alone: syncs the animation with the UI thread, then unmounts once the close animation completes.
    if (isOpen) {
      translateX.value = withTiming(0, { duration: ANIMATION_DURATION_MS });
      backdropOpacity.value = withTiming(1, { duration: ANIMATION_DURATION_MS });
    } else if (isMounted) {
      translateX.value = withTiming(-panelWidth, { duration: ANIMATION_DURATION_MS });
      backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION_MS }, (finished) => {
        if (finished) runOnJS(setIsMounted)(false);
      });
    }
    // Deps omit the shared values and isMounted: this is a one-shot transition handler, and including them would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);
  const showComingSoon = (label: string) => setComingSoonFeature(label);

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
            <View style={styles.profileText}>
              <Text style={styles.name}>{t('accountDrawer.profileName')}</Text>
              <Text style={styles.tier}>
                {t('accountDrawer.tierLabel')}
                <Text style={styles.tierId}>{t('accountDrawer.tierId')}</Text>
              </Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.content}>
            <Text style={styles.groupLabel}>{t('accountDrawer.account')}</Text>
            <DrawerLink icon="drawerApiKeys" label={t('accountDrawer.apiKeys')} onPress={showComingSoon} />
            <DrawerLink icon="drawerSecurity" label={t('accountDrawer.security')} onPress={showComingSoon} />

            <Text style={[styles.groupLabel, styles.tradingGroupLabel]}>{t('accountDrawer.trading')}</Text>
            <DrawerLink
              icon="drawerTradeHistory"
              label={t('accountDrawer.tradeHistory')}
              onPress={showComingSoon}
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

        <ComingSoonDialog
          visible={comingSoonFeature !== null}
          title={t('accountDrawer.comingSoonTitle')}
          body={t('accountDrawer.comingSoonBody', { feature: comingSoonFeature ?? '' })}
          confirmLabel={t('accountDrawer.comingSoonConfirm')}
          onDismiss={() => setComingSoonFeature(null)}
        />
      </View>
    </Modal>
  );
}

// The highlight is press feedback, not a selected state; padding is constant so nothing shifts on press.
function DrawerLink({
  icon,
  label,
  onPress,
}: {
  icon: SvgIconName;
  label: string;
  onPress: (label: string) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
      onPress={() => onPress(label)}
    >
      {({ pressed }) => {
        const tintColor = pressed ? colors.signal.positiveMuted : colors.text.numeric;
        return (
          <>
            <Icon name={icon} size={16} color={tintColor} />
            <Text style={[styles.linkText, pressed && { color: tintColor }]}>{label}</Text>
          </>
        );
      }}
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
  content: { paddingHorizontal: spacing.lg },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  profileText: { gap: spacing.xs },
  name: { color: colors.text.primary, ...typography.heading },
  tier: { color: colors.text.numeric, ...typography.bodySmall },
  tierId: { color: colors.signal.positive },
  divider: { height: 2, backgroundColor: colors.background.divider, marginBottom: spacing.md },
  groupLabel: {
    color: colors.text.label,
    ...typography.labelCaps,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  tradingGroupLabel: { marginTop: spacing.xxl },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  linkPressed: { backgroundColor: colors.signal.positiveDeep },
  linkText: { color: colors.text.numeric, ...typography.body },
  signOutBorder: {
    marginTop: 'auto',
    borderTopWidth: 2,
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
  // Real bold needs the 700 weight's own font file; fontWeight alone doesn't synthesize it.
  signOutText: {
    color: colors.text.primary,
    ...typography.body,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
});
