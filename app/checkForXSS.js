export function checkXSS(input) {
    const pattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    return pattern.test(input);
}