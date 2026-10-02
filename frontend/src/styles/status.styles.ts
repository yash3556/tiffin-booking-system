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

  card: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.three,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  historyRow: {
    gap: Spacing.one,
    paddingTop: Spacing.two,
  },

  idText: {
    fontFamily: 'monospace',
    flexShrink: 1,
  },

  errorText: {
    color: '#DC2626',
    marginTop: Spacing.two,
  },

  primaryButton: {
    padding: Spacing.three,
    borderRadius: 10,
    marginTop: Spacing.three,
    backgroundColor: '#222',
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#fff',
  },

  cancelButton: {
    marginTop: Spacing.four,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DC2626',
  },

  cancelText: {
    color: '#DC2626',
  },

  buttonDisabled: {
    opacity: 0.5,
  },
});