"use client";

import { useState } from "react";
import { BrainCircuit, CalendarCheck2, Clock3, FileText, HeartPulse, LayoutList, ShieldAlert, Stethoscope } from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutList },
  { id: "doctor-information", label: "Doctor", icon: Stethoscope },
  { id: "appointment-status", label: "Status", icon: Clock3 },
  { id: "ai-summary", label: "AI Summary", icon: BrainCircuit },
  { id: "patient-intake", label: "Patient Intake", icon: FileText },
  { id: "health-profile", label: "Health Profile", icon: ShieldAlert },
  { id: "clinical-outcome", label: "Clinical Outcome", icon: HeartPulse },
  { id: "booking-record", label: "Booking Record", icon: CalendarCheck2 },
];

export default function AppointmentDetailTabs() {
  const [activeTab, setActiveTab] = useState("overview");

  function selectTab(tabId) {
    setActiveTab(tabId);
    const sections = document.querySelectorAll("[data-appointment-section]");
    const main = document.getElementById("appointment-main-sections");
    const side = document.getElementById("appointment-side-sections");
    const grid = document.getElementById("appointment-detail-grid");

    if (tabId === "overview") {
      sections.forEach((section) => { section.hidden = false; });
      if (main) main.hidden = false;
      if (side) side.hidden = false;
      if (grid) grid.style.gridTemplateColumns = "";
      return;
    }

    sections.forEach((section) => { section.hidden = section.id !== tabId; });
    const selected = document.getElementById(tabId);
    const selectedInMain = selected?.closest("#appointment-main-sections");
    if (main) main.hidden = !selectedInMain;
    if (side) side.hidden = Boolean(selectedInMain);
    if (grid) grid.style.gridTemplateColumns = "minmax(0, 1fr)";
  }

  return (
    <nav className="sticky top-3 z-20 mt-6 rounded-2xl border bg-card/95 p-3 shadow-md backdrop-blur" aria-label="Appointment detail sections">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Show appointment section">
        {tabs.map(({ id, label, icon: Icon }, index) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(id)}
              className={`focus-ring inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-background text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary"}`}
            >
              {id !== "overview" && <span className={`flex size-5 items-center justify-center rounded-md text-[10px] font-bold ${active ? "bg-white/15" : "bg-muted text-muted-foreground"}`}>{index}</span>}
              <Icon className="size-3.5" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
