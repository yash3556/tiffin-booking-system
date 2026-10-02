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
    paddingTop: Spacing.three,
  },

  sub: {
    marginBottom: Spacing.three,
  },

  form: {
    gap: Spacing.two,
  },

  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },

  errorText: {
    color: '#DC2626',
  },

  button: {
    marginTop: Spacing.two,
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});