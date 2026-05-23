import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

export function applyServerFieldErrors<TFieldValues extends FieldValues>(
  errors: Record<string, string[]> | undefined,
  setError: UseFormSetError<TFieldValues>,
) {
  if (!errors) {
    return
  }

  for (const [field, messages] of Object.entries(errors)) {
    const message = messages[0]
    if (!message) {
      continue
    }

    setError(field as Path<TFieldValues>, {
      type: 'server',
      message,
    })
  }
}

