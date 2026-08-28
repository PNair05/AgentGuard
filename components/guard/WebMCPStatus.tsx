import { ArrowIcon, CheckIcon, LockIcon } from "@/components/icons";
import type { WebMCPStatus as Status } from "@/hooks/useWebMCPTools";

export function WebMCPStatus({ status, error }: { status: Status; error: string | null }) {
  if (status === "ready" || status === "checking") return null;
  return (
    <section className="webmcp-notice page-shell" role="status">
      <span className="notice-icon"><LockIcon /></span>
      <div>
        <strong>{status === "error" ? "WebMCP registration needs attention" : "WebMCP isn’t enabled in this browser"}</strong>
        <p>{error ?? "The human interface still works. To expose tools to an agent, enable Chrome’s WebMCP testing flag and relaunch."}</p>
      </div>
      <a href="https://developer.chrome.com/docs/ai/webmcp" target="_blank" rel="noreferrer" className="button notice-button">
        <CheckIcon /> Setup guide <ArrowIcon />
      </a>
    </section>
  );
}
