// BACKEND-008 pure validation helpers.
export const normalizedEmail = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
export const validCode = value => typeof value === 'string' && /^[0-9]{6,8}$/.test(value);
