"use client";

import { useEffect } from "react";

export default function ActionButtonFeedback() {
  useEffect(() => {
    function onSubmit(event: SubmitEvent) {
      const button = event.submitter instanceof HTMLButtonElement ? event.submitter : null;
      const form = button?.form;
      if (!button || !form || button.disabled || button.dataset.noAutoSpinner !== undefined) return;
      if (!form.getAttribute("action") && !button.hasAttribute("formaction")) return;
      if (button.dataset.vibePending === "true") return;
      button.dataset.vibePending = "true";
      button.setAttribute("aria-busy", "true");
      button.disabled = true;
      const spinner = document.createElement("span");
      spinner.className = "vibe-action-spinner";
      spinner.setAttribute("aria-hidden", "true");
      button.append(spinner);
    }
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, []);

  return <style>{`.vibe-action-spinner{display:inline-block;width:.9rem;height:.9rem;margin-left:.5rem;border:2px solid currentColor;border-right-color:transparent;border-radius:9999px;vertical-align:-.12rem;animation:vibe-action-spin .7s linear infinite}@keyframes vibe-action-spin{to{transform:rotate(360deg)}}button[data-vibe-pending="true"]{cursor:wait}button:not(:disabled):active{transform:scale(.975)}@media (prefers-reduced-motion:reduce){.vibe-action-spinner{animation:none}button:not(:disabled):active{transform:none}}`}</style>;
}
