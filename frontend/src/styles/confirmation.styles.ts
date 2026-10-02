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

  idText: {
    fontFamily: 'monospace',
    flexShrink: 1,
  },

  button: {
    marginTop: Spacing.four,
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },

  buttonSecondary: {
    marginTop: Spacing.two,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },

  buttonText: {
    color: '#fff',
  },

  pressed: {
    opacity: 0.7,
  },
});