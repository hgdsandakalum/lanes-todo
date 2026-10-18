import { branchLinks, branchList, safeHttpUrl } from "@/lib/domain/repo";

const linkCls = "underline decoration-line underline-offset-4 hover:text-ink hover:decoration-ink";

/** "github.com/softsora/gaku/pull/12" for a link, without the scheme. */
const shortUrl = (href: string) => {
  const u = new URL(href);
  return `${u.host}${u.pathname}`.replace(/\/$/, "");
};

/**
 * A task's branches (linked when the project has a repo on a known host), a pull request link per branch
 * until a PR link is saved or the task has shipped, and the task's own link. Renders inline items for a meta row.
 */
export function TaskLinks({ branch, link, repo, shipped = false }: { branch: string | null; link: string | null; repo: string | null; shipped?: boolean }) {
  const branches = branchList(branch);
  const href = link ? safeHttpUrl(link) : null;
  return (
    <>
      {branches.map((b) => {
        const links = repo ? branchLinks(repo, b) : null;
        if (!links)
          return (
            <span key={b} className="tabular" title={repo ? undefined : "Link the project's repo to make this a link"}>
              {b}
            </span>
          );
        return (
          <span key={b} className="inline-flex flex-wrap items-baseline gap-x-2">
            <a href={links.tree} target="_blank" rel="noreferrer" className={`tabular ${linkCls}`}>
              {b}
            </a>
            {!href && !shipped ? (
              // one branch: spelled out; several: a short "PR" after each, named in full for screen readers
              <a href={links.pr} target="_blank" rel="noreferrer" className={linkCls} aria-label={`Open pull request for ${b}`}>
                {branches.length === 1 ? "Open pull request" : "PR"}
              </a>
            ) : null}
          </span>
        );
      })}
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className={`max-w-full truncate ${linkCls}`}>
          {shortUrl(href)}
        </a>
      ) : null}
    </>
  );
}
