/**
 * URL & Username Parser & Platform Detection Logic
 */

/**
 * Clean a username by stripping trailing spaces/slashes and leading @.
 * NOTE: Do NOT strip trailing dots — they can be part of valid handles (e.g. 'Manan.' on Codeforces).
 */
function cleanHandle(raw) {
  if (!raw) return '';
  return raw.replace(/^@/, '').replace(/[\s\/]+$/, '').trim();
}

function parseProfileInput(input, defaultPlatform = null) {
  if (!input || typeof input !== 'string') return { error: 'Empty input' };
  const str = input.trim();
  if (!str) return { error: 'Empty input' };

  // Check if string contains URL pattern
  const isUrlPattern = str.startsWith('http://') || str.startsWith('https://') ||
    str.includes('leetcode.com') || str.includes('codeforces.com') ||
    str.includes('codechef.com') || str.includes('geeksforgeeks.org') ||
    str.includes('github.com') || str.includes('atcoder.jp');

  if (isUrlPattern) {
    try {
      const urlToParse = str.startsWith('http') ? str : `https://${str}`;
      const parsed = new URL(urlToParse);
      const hostname = parsed.hostname.replace('www.', '');
      const parts = parsed.pathname.split('/').filter(Boolean);

      if (hostname === 'leetcode.com') {
        const username = cleanHandle(parts[0] === 'u' ? parts[1] : parts[0]);
        if (!username) return { error: 'Could not extract LeetCode username' };
        return { platform: 'leetcode', username };
      }

      if (hostname === 'codeforces.com') {
        const username = cleanHandle(parts[0] === 'profile' ? parts[1] : parts[0]);
        if (!username) return { error: 'Could not extract Codeforces handle' };
        return { platform: 'codeforces', username };
      }

      if (hostname === 'codechef.com') {
        const username = cleanHandle(parts[0] === 'users' ? parts[1] : parts[0]);
        if (!username) return { error: 'Could not extract CodeChef username' };
        return { platform: 'codechef', username };
      }

      if (hostname === 'geeksforgeeks.org') {
        const username = cleanHandle((parts[0] === 'user' || parts[0] === 'profile') ? parts[1] : parts[0]);
        if (!username) return { error: 'Could not extract GFG username' };
        return { platform: 'gfg', username };
      }

      if (hostname === 'github.com') {
        const username = cleanHandle(parts[0]);
        if (username) return { platform: 'github', username };
        return { error: 'Could not extract GitHub username' };
      }

      if (hostname === 'atcoder.jp') {
        const username = cleanHandle(parts[0] === 'users' ? parts[1] : parts[0]);
        if (!username) return { error: 'Could not extract AtCoder username' };
        return { platform: 'atcoder', username };
      }

      return { error: `Unsupported domain: ${hostname}` };
    } catch (e) {
      // Fallback if URL parsing fails
    }
  }

  // Treat as plain username
  let cleanUsername = cleanHandle(str);
  cleanUsername = cleanUsername.replace(/^(u|profile|users|user)\//i, '');
  cleanUsername = cleanUsername.split('/')[0].trim();

  if (!cleanUsername) return { error: 'Invalid username' };

  if (defaultPlatform) {
    return { platform: defaultPlatform, username: cleanUsername };
  }

  return { error: `Cannot determine platform for username "${cleanUsername}".` };
}

module.exports = { parseProfileInput, parseProfileUrl: parseProfileInput };
