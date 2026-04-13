import '../../styles/site-footer.scss';

const GITHUB_REPO_URL =
  process.env.NEXT_PUBLIC_GITHUB_REPO_URL || 'https://github.com/Luke-up/homeworkapp';

export default function SiteFooter() {
  return (
    <footer className="site-footer-bar">
      <span className="site-footer-bar__left">Granadilla — made by Luke</span>
      <a
        className="site-footer-bar__link"
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub
      </a>
    </footer>
  );
}
