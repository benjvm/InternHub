export const DELETE_FIELD = Symbol('internhub.deleteField')

export function deleteProfileField() {
  return DELETE_FIELD
}

export function isDeleteField(value: unknown) {
  return value === DELETE_FIELD
}

export function stripUndefinedValues<T extends Record<string, unknown>>(data: T) {
  return Object.entries(data).reduce<Record<string, unknown>>((accumulator, [key, value]) => {
    if (value !== undefined) {
      accumulator[key] = value
    }

    return accumulator
  }, {})
}
