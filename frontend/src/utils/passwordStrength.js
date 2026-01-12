import zxcvbn from 'zxcvbn';

export const getPasswordStrength = (password) => {
    if (!password) return 0;
    const result = zxcvbn(password);
    return result.score;
};
