import { StyleSheet } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: Spacing.three,
  },

  heading: {
    paddingVertical: Spacing.three,
  },

  list: {
    gap: Spacing.two,
  },

  card: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  idText: {
    fontFamily: 'monospace',
    flexShrink: 1,
    marginRight: Spacing.two,
  },

  empty: {
    textAlign: 'center',
    marginTop: Spacing.six,
  },
    logoutButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },

  logoutButtonPressed: {
    opacity: 0.8,
  },

  logoutButtonDisabled: {
    opacity: 0.6,
  },

  logoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});