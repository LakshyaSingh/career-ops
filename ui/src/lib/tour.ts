export interface TourStep {
  /** Pathname this step lives on. Tour navigates here on entry. */
  path: string;
  title: string;
  body: string;
  /**
   * Optional CSS selector to highlight on this step. The Tour component will
   * draw a soft animated ring over the matched element. Leave undefined to
   * just show the floating card without a highlight.
   */
  target?: string;
  /** Custom label for the next button (default: "Next →"). */
  nextLabel?: string;
}

export const TOUR: TourStep[] = [
  {
    path: "/",
    title: "Welcome to Career-Ops",
    body:
      "This is your local job search command center. Everything stays on your laptop. Let's take 60 seconds to walk through what each part does.",
    nextLabel: "Start tour →",
  },
  {
    path: "/settings",
    title: "Start with Settings",
    body:
      "This panel shows what's set up and what's missing. Red pills mean 'fix me'. Click any Fix → link to jump to the right editor. Run the full diagnostic for a deeper check.",
    target: "[role='row']",
  },
  {
    path: "/profile",
    title: "Tell the system who you are",
    body:
      "A structured form. Autosaves to config/profile.yml. Identity, target roles, narrative, comp, location. Anything you don't fill in stays untouched, so advanced fields edited elsewhere are safe.",
  },
  {
    path: "/cv",
    title: "Drop in your CV",
    body:
      "Plain markdown. Autosaves to cv.md, which every evaluation reads from. Update it whenever you accomplish something new. That's how the system learns about you.",
  },
  {
    path: "/scan",
    title: "Find new offers",
    body:
      "Hits Greenhouse, Ashby, and Lever directly. Fast, free, no LLM tokens. New URLs land in the inbox below; each row has an Evaluate button to start a full A–G report.",
  },
  {
    path: "/pipeline",
    title: "Track everything",
    body:
      "Reads data/applications.md. Paste any URL up top to evaluate it directly. Click any row to read the full markdown report and generate a tailored PDF.",
  },
  {
    path: "/",
    title: "That's the whole loop",
    body:
      "Scan → evaluate → review → tailor → apply. Run a real scan when you're ready, or paste a URL to test the full flow. Hit ? on any page to see this tour again.",
    nextLabel: "Done",
  },
];

export const TOUR_DONE_KEY = "career-ops:tour:completed:v1";
