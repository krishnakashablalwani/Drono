"use client";

import React from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

function LinkedInIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

export interface TeamMember {
  id: string;
  name: string;
  tag?: string;
  rollNo: string;
  branch: string;
  year: string;
  image: string;
  initials: string;
  linkedin: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "krishna",
    name: "Krishna Kashab Lalwani",
    tag: "Team Lead",
    rollNo: "2451-25-733-075",
    branch: "CSE",
    year: "2nd Year",
    initials: "KR",
    image: "/team/Krishna.jpg",
    linkedin: "https://www.linkedin.com/in/krishna-kashab-lalwani/",
  },
  {
    id: "supraja",
    name: "C. Supraja Raj",
    rollNo: "2451-25-751-047",
    branch: "CSIT",
    year: "2nd Year",
    initials: "SP",
    image: "/team/Supraja.jpeg",
    linkedin: "https://www.linkedin.com/in/supraja-raj-chakkani/",
  },
  {
    id: "anjani",
    name: "B. Anjani",
    rollNo: "2451-25-751-022",
    branch: "CSIT",
    year: "2nd Year",
    initials: "AN",
    image: "/team/Anjani.jpeg",
    linkedin: "https://www.linkedin.com/in/anjani-bojjawar-529549396/",
  },
  {
    id: "nayan",
    name: "Lakkakula Nayandeep",
    rollNo: "2451-25-733-103",
    branch: "CSE",
    year: "2nd Year",
    initials: "LN",
    image: "/team/Nayan.jpeg",
    linkedin: "https://www.linkedin.com/in/nayandeep-lakkakula-71688b433/",
  },
  {
    id: "sathwi",
    name: "Singini Sathwi",
    rollNo: "2452-25-733-104",
    branch: "CSE",
    year: "2nd Year",
    initials: "SS",
    image: "/team/Sathwi.jpeg",
    linkedin: "https://www.linkedin.com/in/singini-sathwi-80543b433/",
  },
  {
    id: "shreshta",
    name: "Mupkalkar Shreshta",
    rollNo: "2451-25-751-039",
    branch: "CSIT",
    year: "2nd Year",
    initials: "MS",
    image: "/team/Shreshta.jpeg",
    linkedin: "https://www.linkedin.com/in/shreshta-mupkalkar-b5881342b/",
  },
];

export function TeamSection() {
  return (
    <section
      id="team"
      className="py-24 px-6 sm:px-8 max-w-[1200px] mx-auto border-t border-[var(--border-subtle)]"
    >
      <div>
        {/* Header */}
        <div className="mb-16 text-center max-w-3xl mx-auto space-y-4">
          <div className="text-[14px] text-[var(--color-ash-gray)] uppercase tracking-wider font-sans-ui">
            Engineering Collective
          </div>
          <h2 className="font-serif-display text-4xl sm:text-5xl text-foreground tracking-[-0.015em]">
            The Team Behind <em>Drono</em>
          </h2>
          <p className="text-[17px] text-[var(--text-secondary)] font-sans-ui max-w-xl mx-auto leading-[1.45]">
            Engineering collective developing autonomous single-pass 3D drone mapping.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.id}
              className="neutral-card p-6 flex flex-col justify-between space-y-4 transition-transform hover:-translate-y-1"
            >
              <div className="space-y-4 font-sans-ui">
                {/* Photo with 12px radius from DESIGN.md */}
                <div className="relative w-full aspect-square rounded-[12px] overflow-hidden bg-[var(--color-mist-gray)] flex items-center justify-center">
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover object-top filter brightness-[0.98] contrast-[1.02]"
                      priority={member.id === "krishna"}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-paper-white)] text-foreground text-base font-medium shadow-sm mb-2">
                        {member.initials}
                      </div>
                      <span className="text-xs text-[var(--color-slate-gray)]">
                        [{member.name}]
                      </span>
                    </div>
                  )}

                  {/* Overlaid Tag */}
                  {member.tag && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[var(--color-blush-peach)] text-[var(--color-sienna-brown)] text-[11px] font-medium shadow-sm">
                      {member.tag}
                    </div>
                  )}
                </div>

                {/* Member Details */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[18px] font-medium text-foreground">
                      {member.name}
                    </h3>
                  </div>

                  <p className="text-[14px] text-[var(--color-slate-gray)]">
                  </p>

                  <div className="pt-1 flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] font-mono px-2 py-0.5 rounded-md bg-[var(--color-paper-white)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                      Roll No: {member.rollNo}
                    </span>
                    <span className="text-[12px] text-[var(--color-ash-gray)]">
                      {member.branch} • {member.year}
                    </span>
                  </div>


                </div>
              </div>

              {/* LinkedIn Connect Footer */}
              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">


                {member.linkedin ? (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-paper-white)] border border-[var(--border-subtle)] text-[12px] text-foreground hover:bg-[var(--color-mist-gray)] transition-colors"
                  >
                    <LinkedInIcon className="h-3 w-3" />
                    <span>Connect</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
