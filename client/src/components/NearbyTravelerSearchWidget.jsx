import { useMemo, useState } from "react";
import {
  BASE_TRAVELER_TYPES,
  TOP_CHOICES,
  getAllActivities,
  getAllInterests,
  getAllLanguages,
} from "@shared/base-options";
import { GENDER_OPTIONS, SEXUAL_PREFERENCE_OPTIONS } from "@/lib/formConstants";
import { COUNTRIES } from "@/lib/locationData";

const AGE_RANGES = [
  { label: "18–25", min: "18", max: "25" },
  { label: "26–35", min: "26", max: "35" },
  { label: "36–45", min: "36", max: "45" },
  { label: "46–55", min: "46", max: "55" },
  { label: "55+", min: "55", max: "120" },
];

const USER_TYPE_OPTIONS = ["traveler", "local", "business"];

const pillStyle = (active) => ({
  background: active ? "linear-gradient(135deg, #1a6ff4, #0fa9e6)" : "rgba(255,255,255,0.06)",
  border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,0.1)",
  borderRadius: 22,
  padding: "8px 16px",
  color: active ? "#fff" : "#b0bec5",
  fontSize: 13,
  fontWeight: active ? 600 : 400,
  cursor: "pointer",
  transition: "all 0.15s",
  transform: active ? "scale(1.03)" : "scale(1)",
  whiteSpace: "nowrap",
});

function Section({ title, icon, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "12px 4px",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
          {count > 0 && (
            <span
              style={{
                background: "#1a6ff4",
                color: "#fff",
                borderRadius: 10,
                padding: "1px 7px",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {count}
            </span>
          )}
        </div>
        <span
          style={{
            color: "#6b7f90",
            fontSize: 11,
            display: "inline-block",
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "none",
          }}
        >
          ▼
        </span>
      </button>
      {open && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingBottom: 12 }}>{children}</div>
      )}
      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginTop: 4 }} />
    </div>
  );
}

export default function NearbyTravelerSearchWidget({ filters, setFilters, onClose }) {
  const [searchQuery, setSearchQuery] = useState(filters.search || "");
  const [hostelQuery, setHostelQuery] = useState(filters.hostelName || "");
  const [languageQuery, setLanguageQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");

  const allInterests = useMemo(() => getAllInterests(), []);
  const allActivities = useMemo(() => getAllActivities(), []);
  const allLanguages = useMemo(() => getAllLanguages(), []);
  // This codebase no longer has "events" in shared/base-options; reuse TOP_CHOICES as event-category chips.
  const allEvents = useMemo(() => TOP_CHOICES, []);
  const allTopChoices = useMemo(() => TOP_CHOICES, []);
  const allCountries = useMemo(() => COUNTRIES, []);

  const toggleArray = (key, value) => {
    setFilters((prev) => {
      const arr = prev[key] || [];
      return { ...prev, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const activeAgeRange = AGE_RANGES.find(
    (r) => String(r.min) === String(filters.minAge || "") && String(r.max) === String(filters.maxAge || "")
  );
  const toggleAge = (range) => {
    if (activeAgeRange?.label === range.label) {
      setFilters((prev) => ({ ...prev, minAge: "", maxAge: "" }));
    } else {
      setFilters((prev) => ({ ...prev, minAge: range.min, maxAge: range.max }));
    }
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setFilters((prev) => ({ ...prev, search: val }));
  };

  const handleHostel = (e) => {
    const val = e.target.value;
    setHostelQuery(val);
    setFilters((prev) => ({ ...prev, hostelName: val }));
  };

  const totalSelected = useMemo(() => {
    let n = 0;
    [
      "topChoices",
      "gender",
      "sexualPreference",
      "userType",
      "interests",
      "activities",
      "events",
      "travelerTypes",
      "militaryStatus",
      "languages",
      "countriesVisited",
    ].forEach(
      (k) => {
        n += (filters[k] || []).length;
      }
    );
    if (filters.newToTown) n += 1;
    if (filters.travelingWithChildren) n += 1;
    if (filters.hostelName) n += 1;
    if (filters.minAge || filters.maxAge) n += 1;
    if (filters.search) n += 1;
    return n;
  }, [filters]);

  const activeChips = useMemo(() => {
    const chips = [];
    [
      "topChoices",
      "gender",
      "sexualPreference",
      "userType",
      "interests",
      "activities",
      "events",
      "travelerTypes",
      "militaryStatus",
      "languages",
      "countriesVisited",
    ].forEach(
      (key) => {
        (filters[key] || []).forEach((val) => chips.push({ key, val }));
      }
    );
    if (filters.minAge || filters.maxAge) {
      const r = AGE_RANGES.find((r) => String(r.min) === String(filters.minAge) && String(r.max) === String(filters.maxAge));
      if (r) chips.push({ key: "age", val: r.label });
    }
    if (filters.newToTown) chips.push({ key: "newToTown", val: "New to town" });
    if (filters.travelingWithChildren) chips.push({ key: "travelingWithChildren", val: "Traveling with children" });
    if (filters.hostelName) chips.push({ key: "hostelName", val: `Hostel: ${filters.hostelName}` });
    return chips;
  }, [filters]);

  const removeChip = ({ key, val }) => {
    if (key === "age") {
      setFilters((prev) => ({ ...prev, minAge: "", maxAge: "" }));
    } else if (key === "newToTown") {
      setFilters((prev) => ({ ...prev, newToTown: false }));
    } else if (key === "travelingWithChildren") {
      setFilters((prev) => ({ ...prev, travelingWithChildren: false }));
    } else if (key === "hostelName") {
      setHostelQuery("");
      setFilters((prev) => ({ ...prev, hostelName: "" }));
    } else {
      toggleArray(key, val);
    }
  };

  const clearAll = () => {
    setSearchQuery("");
    setHostelQuery("");
    setFilters({
      topChoices: [],
      gender: [],
      sexualPreference: [],
      minAge: "",
      maxAge: "",
      interests: [],
      activities: [],
      location: "",
      search: "",
      userType: [],
      events: [],
      travelerTypes: [],
      militaryStatus: [],
      languages: [],
      countriesVisited: [],
      newToTown: false,
      travelingWithChildren: false,
      hostelName: "",
      startDate: "",
      endDate: "",
    });
  };

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        background: "#0f1923",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "20px 20px 16px",
          flexShrink: 0,
          background: "linear-gradient(to bottom, #0f1923 85%, transparent)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: "-0.3px" }}>
              Find Travelers
            </h2>
            <p style={{ color: "#6b7f90", fontSize: 12, margin: "2px 0 0" }}>
              {totalSelected > 0 ? `${totalSelected} filter${totalSelected !== 1 ? "s" : ""} active` : "No filters applied"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {totalSelected > 0 && (
              <button
                onClick={clearAll}
                style={{
                  background: "rgba(255,100,80,0.12)",
                  border: "1px solid rgba(255,100,80,0.3)",
                  color: "#ff6450",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Clear all
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#6b7f90",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ✕ Close
              </button>
            )}
          </div>
        </div>

        <div style={{ position: "relative", marginBottom: 4 }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 15,
              opacity: 0.4,
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search by name or username…"
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "10px 12px 10px 36px",
              color: "#fff",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {activeChips.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, paddingBottom: 4 }}>
            {activeChips.map((chip) => (
              <button
                key={`${chip.key}-${chip.val}`}
                onClick={() => removeChip(chip)}
                style={{
                  background: "linear-gradient(135deg, #1a6ff4, #0fa9e6)",
                  border: "none",
                  borderRadius: 20,
                  padding: "4px 10px",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {chip.val} <span style={{ opacity: 0.7 }}>×</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "8px 16px 140px", overflowY: "auto", flexGrow: 1 }}>
        <Section title="Top Choices" icon="⭐" count={(filters.topChoices || []).length}>
          {allTopChoices.map((opt) => (
            <button
              key={opt}
              style={pillStyle((filters.topChoices || []).includes(opt))}
              onClick={() => toggleArray("topChoices", opt)}
            >
              {opt}
            </button>
          ))}
        </Section>

        <Section title="Gender" icon="🪪" count={filters.gender.length} defaultOpen>
          {GENDER_OPTIONS.map((opt) => (
            <button key={opt} style={pillStyle(filters.gender.includes(opt))} onClick={() => toggleArray("gender", opt)}>
              {opt}
            </button>
          ))}
        </Section>

        <Section title="Sexual Preference" icon="🌈" count={filters.sexualPreference.length} defaultOpen>
          {SEXUAL_PREFERENCE_OPTIONS.map((opt) => (
            <button
              key={opt}
              style={pillStyle(filters.sexualPreference.includes(opt))}
              onClick={() => toggleArray("sexualPreference", opt)}
            >
              {opt}
            </button>
          ))}
        </Section>

        <Section title="User Type" icon="✈️" count={filters.userType.length}>
          {USER_TYPE_OPTIONS.map((opt) => (
            <button key={opt} style={pillStyle(filters.userType.includes(opt))} onClick={() => toggleArray("userType", opt)}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </Section>

        <Section title="Traveler Type" icon="🗺️" count={filters.travelerTypes.length}>
          {BASE_TRAVELER_TYPES.map((opt) => (
            <button
              key={opt}
              style={pillStyle(filters.travelerTypes.includes(opt))}
              onClick={() => toggleArray("travelerTypes", opt)}
            >
              {opt}
            </button>
          ))}
        </Section>

        <Section title="Age Range" icon="🗓" count={filters.minAge ? 1 : 0}>
          {AGE_RANGES.map((range) => (
            <button
              key={range.label}
              style={pillStyle(activeAgeRange?.label === range.label)}
              onClick={() => toggleAge(range)}
            >
              {range.label}
            </button>
          ))}
        </Section>

        <Section title="Military Status" icon="🎖️" count={(filters.militaryStatus || []).length}>
          {["Active Duty", "Veteran"].map((opt) => (
            <button
              key={opt}
              style={pillStyle((filters.militaryStatus || []).includes(opt))}
              onClick={() => toggleArray("militaryStatus", opt)}
            >
              {opt}
            </button>
          ))}
        </Section>

        <Section
          title="Family & Local Status"
          icon="👨‍👩‍👧‍👦"
          count={(filters.newToTown ? 1 : 0) + (filters.travelingWithChildren ? 1 : 0)}
        >
          <button
            style={pillStyle(!!filters.newToTown)}
            onClick={() => setFilters((prev) => ({ ...prev, newToTown: !prev.newToTown }))}
          >
            New to town
          </button>
          <button
            style={pillStyle(!!filters.travelingWithChildren)}
            onClick={() => setFilters((prev) => ({ ...prev, travelingWithChildren: !prev.travelingWithChildren }))}
          >
            Traveling with children
          </button>
        </Section>

        <Section title="Interests" icon="💡" count={filters.interests.length}>
          {allInterests.map((opt) => (
            <button key={opt} style={pillStyle(filters.interests.includes(opt))} onClick={() => toggleArray("interests", opt)}>
              {opt}
            </button>
          ))}
        </Section>

        <Section title="Activities" icon="🏄" count={filters.activities.length}>
          {allActivities.map((opt) => (
            <button
              key={opt}
              style={pillStyle(filters.activities.includes(opt))}
              onClick={() => toggleArray("activities", opt)}
            >
              {opt}
            </button>
          ))}
        </Section>

        <Section title="Local Events" icon="🎉" count={filters.events.length}>
          {allEvents.map((opt) => (
            <button key={opt} style={pillStyle(filters.events.includes(opt))} onClick={() => toggleArray("events", opt)}>
              {opt}
            </button>
          ))}
        </Section>

        <Section title="Languages" icon="🗣️" count={(filters.languages || []).length}>
          <div style={{ width: "100%" }}>
            <input
              value={languageQuery}
              onChange={(e) => setLanguageQuery(e.target.value)}
              placeholder="Type to filter languages…"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "10px 12px",
                color: "#fff",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 10,
              }}
            />
          </div>
          {allLanguages
            .filter((l) => !languageQuery.trim() || String(l).toLowerCase().includes(languageQuery.trim().toLowerCase()))
            .map((opt) => (
              <button
                key={opt}
                style={pillStyle((filters.languages || []).includes(opt))}
                onClick={() => toggleArray("languages", opt)}
              >
                {opt}
              </button>
            ))}
        </Section>

        <Section title="Countries Visited" icon="🌍" count={(filters.countriesVisited || []).length}>
          <div style={{ width: "100%" }}>
            <input
              value={countryQuery}
              onChange={(e) => setCountryQuery(e.target.value)}
              placeholder="Type to filter countries…"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "10px 12px",
                color: "#fff",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 10,
              }}
            />
          </div>
          {allCountries
            .filter((c) => !countryQuery.trim() || String(c).toLowerCase().includes(countryQuery.trim().toLowerCase()))
            .map((opt) => (
              <button
                key={opt}
                style={pillStyle((filters.countriesVisited || []).includes(opt))}
                onClick={() => toggleArray("countriesVisited", opt)}
              >
                {opt}
              </button>
            ))}
        </Section>

        <Section title="Hostel Connect" icon="🏨" count={filters.hostelName ? 1 : 0}>
          <div style={{ width: "100%" }}>
            <input
              value={hostelQuery}
              onChange={handleHostel}
              placeholder="Hostel name (optional)…"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "10px 12px",
                color: "#fff",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </Section>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(to top, #0f1923 70%, transparent)",
          padding: "20px 20px 32px",
        }}
      >
        <button
          onClick={onClose}
          style={{
            width: "100%",
            background: totalSelected > 0 ? "linear-gradient(135deg, #1a6ff4, #0fa9e6)" : "rgba(255,255,255,0.08)",
            border: "none",
            borderRadius: 16,
            padding: "16px",
            color: totalSelected > 0 ? "#fff" : "#6b7f90",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.2px",
            transition: "all 0.2s",
          }}
        >
          {totalSelected > 0
            ? `Show results · ${totalSelected} filter${totalSelected !== 1 ? "s" : ""} active`
            : "Show all travelers"}
        </button>
      </div>
    </div>
  );
}
