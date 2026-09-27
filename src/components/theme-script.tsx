export function ThemeScript() {
    const code = `
    (function() {
      try {
        var storageKey = 'promocuts-theme';
        var storedTheme = localStorage.getItem(storageKey);
        var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var isDark = storedTheme === 'dark' || (!storedTheme || storedTheme === 'system') && systemDark;
        var root = document.documentElement;
        if (isDark) {
          root.classList.add('dark');
          root.classList.remove('light');
          root.style.colorScheme = 'dark';
        } else {
          root.classList.remove('dark');
          root.classList.add('light');
          root.style.colorScheme = 'light';
        }
      } catch (e) {}
    })();
  `;

    return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
