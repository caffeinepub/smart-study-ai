export function Footer() {
  return (
    <footer className="text-center py-6 text-xs text-muted-foreground border-t border-border mt-12">
      © {new Date().getFullYear()}. Built with ❤️ using{" "}
      <a
        href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-foreground transition-colors"
      >
        caffeine.ai
      </a>
    </footer>
  );
}
