"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProfileBasics } from "@/lib/career-ops/profile";
import { SaveStatus, type Status } from "./SaveStatus";

interface Props {
  initialBasics: ProfileBasics;
  initialExists: boolean;
}

// Type for nested key paths we edit. Using strings keeps the form simple;
// the reducer below builds the right nested object on save.
type Field =
  | "candidate.full_name"
  | "candidate.email"
  | "candidate.phone"
  | "candidate.location"
  | "candidate.linkedin"
  | "candidate.portfolio_url"
  | "candidate.github"
  | "candidate.twitter"
  | "narrative.headline"
  | "narrative.exit_story"
  | "compensation.target_range"
  | "compensation.minimum"
  | "compensation.currency"
  | "compensation.location_flexibility"
  | "location.country"
  | "location.city"
  | "location.timezone"
  | "location.visa_status";

type FormState = Partial<Record<Field, string>> & {
  primary_roles: string;     // newline-separated
  superpowers: string;       // newline-separated
};

function flatten(b: ProfileBasics): FormState {
  return {
    "candidate.full_name": b.candidate?.full_name ?? "",
    "candidate.email": b.candidate?.email ?? "",
    "candidate.phone": b.candidate?.phone ?? "",
    "candidate.location": b.candidate?.location ?? "",
    "candidate.linkedin": b.candidate?.linkedin ?? "",
    "candidate.portfolio_url": b.candidate?.portfolio_url ?? "",
    "candidate.github": b.candidate?.github ?? "",
    "candidate.twitter": b.candidate?.twitter ?? "",
    "narrative.headline": b.narrative?.headline ?? "",
    "narrative.exit_story": b.narrative?.exit_story ?? "",
    "compensation.target_range": b.compensation?.target_range ?? "",
    "compensation.minimum": b.compensation?.minimum ?? "",
    "compensation.currency": b.compensation?.currency ?? "",
    "compensation.location_flexibility": b.compensation?.location_flexibility ?? "",
    "location.country": b.location?.country ?? "",
    "location.city": b.location?.city ?? "",
    "location.timezone": b.location?.timezone ?? "",
    "location.visa_status": b.location?.visa_status ?? "",
    primary_roles: (b.target_roles?.primary ?? []).join("\n"),
    superpowers: (b.narrative?.superpowers ?? []).join("\n"),
  };
}

function unflatten(s: FormState): ProfileBasics {
  const out: ProfileBasics = {
    candidate: {
      full_name: s["candidate.full_name"],
      email: s["candidate.email"],
      phone: s["candidate.phone"],
      location: s["candidate.location"],
      linkedin: s["candidate.linkedin"],
      portfolio_url: s["candidate.portfolio_url"],
      github: s["candidate.github"],
      twitter: s["candidate.twitter"],
    },
    narrative: {
      headline: s["narrative.headline"],
      exit_story: s["narrative.exit_story"],
      superpowers: s.superpowers
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    },
    target_roles: {
      primary: s.primary_roles
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    },
    compensation: {
      target_range: s["compensation.target_range"],
      minimum: s["compensation.minimum"],
      currency: s["compensation.currency"],
      location_flexibility: s["compensation.location_flexibility"],
    },
    location: {
      country: s["location.country"],
      city: s["location.city"],
      timezone: s["location.timezone"],
      visa_status: s["location.visa_status"],
    },
  };
  return out;
}

export function ProfileEditor({ initialBasics, initialExists }: Props) {
  const initialFlat = useMemo(() => flatten(initialBasics), [initialBasics]);
  const [form, setForm] = useState<FormState>(initialFlat);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | undefined>();
  const [exists, setExists] = useState(initialExists);
  const lastSerialized = useRef(JSON.stringify(initialFlat));
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (field: keyof FormState) => (value: string) =>
    setForm((s) => ({ ...s, [field]: value }));

  const save = useCallback(async (snapshot: FormState) => {
    setStatus("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basics: unflatten(snapshot) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      lastSerialized.current = JSON.stringify(snapshot);
      setExists(true);
      setStatus("saved");
      setTimeout(() => {
        if (lastSerialized.current === JSON.stringify(snapshot)) setStatus("idle");
      }, 1400);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setStatus("error");
    }
  }, []);

  // Debounced autosave: 700ms after last edit.
  useEffect(() => {
    const serialized = JSON.stringify(form);
    if (serialized === lastSerialized.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(form), 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [form, save]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "2rem",
          gap: "1rem",
        }}
      >
        <p style={{ color: "var(--fg-subtle)", fontSize: "0.85rem" }}>
          {exists
            ? "Editing config/profile.yml"
            : "config/profile.yml will be created on first save"}
          {" · "}
          fields not shown here (archetypes, proof points) are preserved
          on save
        </p>
        <SaveStatus status={status} error={error} />
      </div>

      <Section title="Identity" subtitle="The basics every recruiter wants.">
        <Grid>
          <Field label="Full name" value={form["candidate.full_name"]!} onChange={set("candidate.full_name")} />
          <Field label="Email" value={form["candidate.email"]!} onChange={set("candidate.email")} type="email" />
          <Field label="Phone" value={form["candidate.phone"]!} onChange={set("candidate.phone")} />
          <Field label="Where you live" value={form["candidate.location"]!} onChange={set("candidate.location")} />
        </Grid>
      </Section>

      <Section title="Links" subtitle="Where you exist on the internet.">
        <Grid>
          <Field label="LinkedIn" value={form["candidate.linkedin"]!} onChange={set("candidate.linkedin")} />
          <Field label="Portfolio URL" value={form["candidate.portfolio_url"]!} onChange={set("candidate.portfolio_url")} />
          <Field label="GitHub" value={form["candidate.github"]!} onChange={set("candidate.github")} />
          <Field label="Twitter / X" value={form["candidate.twitter"]!} onChange={set("candidate.twitter")} />
        </Grid>
      </Section>

      <Section title="Targets" subtitle="Tell the system what you're hunting for.">
        <Field
          label="Primary roles"
          hint="One per line. These are your North Star roles."
          value={form.primary_roles}
          onChange={set("primary_roles")}
          multiline
          rows={4}
        />
      </Section>

      <Section title="Narrative" subtitle="The story you want every evaluation to know.">
        <Field label="Headline" hint="A one-line professional pitch." value={form["narrative.headline"]!} onChange={set("narrative.headline")} />
        <Field label="Exit story" hint="What makes you unique. 1–2 sentences." value={form["narrative.exit_story"]!} onChange={set("narrative.exit_story")} multiline rows={3} />
        <Field label="Superpowers" hint="3–5 things you're great at, one per line." value={form.superpowers} onChange={set("superpowers")} multiline rows={5} />
      </Section>

      <Section title="Compensation" subtitle="What 'yes' looks like, and what's a hard no.">
        <Grid>
          <Field label="Target range" value={form["compensation.target_range"]!} onChange={set("compensation.target_range")} />
          <Field label="Walk-away minimum" value={form["compensation.minimum"]!} onChange={set("compensation.minimum")} />
          <Field label="Currency" value={form["compensation.currency"]!} onChange={set("compensation.currency")} />
          <Field label="Location flexibility" value={form["compensation.location_flexibility"]!} onChange={set("compensation.location_flexibility")} />
        </Grid>
      </Section>

      <Section title="Location" subtitle="For visa-aware filtering.">
        <Grid>
          <Field label="Country" value={form["location.country"]!} onChange={set("location.country")} />
          <Field label="City" value={form["location.city"]!} onChange={set("location.city")} />
          <Field label="Timezone" value={form["location.timezone"]!} onChange={set("location.timezone")} />
          <Field label="Visa status" value={form["location.visa_status"]!} onChange={set("location.visa_status")} />
        </Grid>
      </Section>
    </div>
  );
}

/* ───────── Apple-feel form primitives ───────── */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        paddingBlock: "2.5rem",
        borderTop: "1px solid var(--surface-hairline)",
      }}
    >
      <h2
        className="display"
        style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            color: "var(--fg-muted)",
            marginBottom: "1.5rem",
            fontSize: "0.95rem",
          }}
        >
          {subtitle}
        </p>
      )}
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "1.25rem",
      }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  type = "text",
  multiline = false,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  type?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const baseStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.7rem 0.95rem",
    background: "var(--bg-elevated)",
    color: "var(--fg)",
    border: "1px solid var(--surface-hairline)",
    borderRadius: "10px",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 180ms var(--ease-apple), box-shadow 180ms var(--ease-apple)",
  };
  const focusStyle = {
    borderColor: "var(--accent)",
    boxShadow: "0 0 0 4px color-mix(in srgb, var(--accent) 14%, transparent)",
  };

  return (
    <label style={{ display: "block", marginBottom: multiline ? "1.25rem" : 0 }}>
      <span
        style={{
          display: "block",
          fontSize: "0.8rem",
          fontWeight: 500,
          color: "var(--fg-muted)",
          marginBottom: "0.4rem",
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...baseStyle, resize: "vertical", lineHeight: 1.5 }}
          onFocus={(e) => Object.assign(e.currentTarget.style, focusStyle)}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--surface-hairline)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={baseStyle}
          onFocus={(e) => Object.assign(e.currentTarget.style, focusStyle)}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--surface-hairline)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      )}
      {hint && (
        <span
          style={{
            display: "block",
            fontSize: "0.78rem",
            color: "var(--fg-subtle)",
            marginTop: "0.4rem",
          }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}
