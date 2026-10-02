import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },

  form: {
    gap: 10,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 6,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },

  error: {
    fontSize: 14,
    color: '#DC2626',
    marginTop: 4,
  },

  button: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },

  loginText: {
    fontSize: 14,
    color: '#6B7280',
  },

  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
});