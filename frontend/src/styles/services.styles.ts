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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  empty: {
    textAlign: 'center',
    marginTop: Spacing.six,
  },

  pressed: {
    opacity: 0.7,
  },
});