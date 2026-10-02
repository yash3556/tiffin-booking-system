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
    gap: Spacing.two,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  button: {
    marginTop: Spacing.four,
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
  },

  pressed: {
    opacity: 0.8,
  },
});