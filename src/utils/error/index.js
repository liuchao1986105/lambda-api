import createError from 'create-error';

export const PermissionDeniedError = createError('PermissionDeniedError', {status: 550, message: 'Permission denied'});
export const AuthenticationError = createError('AuthenticationError', {status: 401, message: 'Token has expired'});
