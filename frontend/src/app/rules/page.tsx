"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  HiBuildingOffice2,
  HiShieldCheck,
  HiChevronLeft,
  HiClipboardDocumentList,
} from "react-icons/hi2";
import { MdRestaurant } from "react-icons/md";
import { motion } from "framer-motion";
import { RulesSkeleton } from "@/components/student/Skeleton";
import { AppHeader, PageContainer } from "@/components/ui";

export default function RulesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "allotment" | "catering" | "discipline">("all");
  const [isMountLoading, setIsMountLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMountLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  if (isMountLoading) {
    return <RulesSkeleton />;
  }

  const roomRules = [
    "Allotment of rooms is at the discretion of the Warden. Inmates must stay only in their allotted rooms. Relocating without prior permission is a serious violation.",
    "Each student is personally responsible for the furniture and fixtures available in their room.",
    "Inmates must bring their own bedding, buckets, mug, plate, glass, and cutlery.",
    "Electrical installations in rooms must not be tampered with. Any damage will result in disciplinary action and recovery of losses.",
    "Lights and fans must be switched off when leaving the room. Conserving energy and water is a collective responsibility.",
    "Use of heavy electrical appliances (heaters, kettles, iron boxes) is strictly prohibited. Unauthorized items will be confiscated and fined.",
    "Inmates are not permitted to host guests inside the hostel rooms without written permission from the Warden.",
    "To vacate the hostel, a written request must be submitted to the Warden. Unannounced departures will continue to incur regular billing.",
  ];

  const cateringRules = [
    "All inmates are automatically members of the hostel mess and must register. Staying in the hostel without availing mess facilities is not permitted.",
    "Both vegetarian and non-vegetarian meals are provided in the mess hall.",
    "Inmates must not bring outsiders into the mess hall under any circumstances. Violation will lead to immediate hostel expulsion.",
    "A Mess Committee is formed annually, and members are collectively responsible for the proper functioning and supervision of the mess.",
    "Meals must be consumed in the dining hall. Inmates are not permitted to carry food items, plates, or utensils to their rooms.",
    "Residents must be mindful of food waste and take only what they intend to consume.",
    "The minimum mess cut period is 2 days. Cuts must be recorded in the register at the hostel office at least 2 days in advance.",
    "Boarder attendance lists and monthly mess bills are published at the end of each month. Discrepancies should be reported promptly.",
  ];

  const disciplineRules = [
    "A security guard is on duty overnight. All entries and exits during night hours are strictly under their supervision.",
    "Residents must keep their rooms and surroundings clean. Disposal of waste in corridors or public areas is prohibited.",
    "Decorum and silence must be maintained. Loud music, movies, or shouting that disturbs other residents is strictly prohibited.",
    "Residents must return to the hostel by 9:30 PM. Late comers must sign the register kept with security/matron.",
    "Convening meetings, parties, or gatherings in the hostel premises without prior written approval from the Warden is forbidden.",
    "Residents must behave politely and respectfully with all hostel staff, cooks, and security personnel.",
    "Teasing, ragging, or harassing fellow students is a severe offence leading to immediate expulsion and police action.",
    "Possession or consumption of tobacco, alcohol, and narcotic drugs is strictly prohibited. Offenders will be summarily expelled.",
    "Possession of weapons or dangerous items of any kind is strictly forbidden.",
    "Playing football or active sports inside the hostel building is not allowed.",
    "The terrace access door will be locked at 9:30 PM daily.",
    "Playing sports on the terrace is prohibited at any time of day due to safety hazards.",
    "Failure to comply with these guidelines will render the resident liable to suspension, fine, or immediate expulsion.",
  ];

  const categories = [
    { id: "all", label: "All Rules", icon: HiClipboardDocumentList },
    { id: "allotment", label: "Room Allotment", icon: HiBuildingOffice2 },
    { id: "catering", label: "Mess & Catering", icon: MdRestaurant },
    { id: "discipline", label: "General Discipline", icon: HiShieldCheck },
  ] as const;

  return (
    <>
      <AppHeader
        title="Rules & Guidelines"
        subtitle="Hostel rules and responsibilities for all residents."
        showBack={true}
      />
      <PageContainer>
        {/* Category Pills Selector */}
        <section className="mb-6 flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-gray-200">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-2 shrink-0 rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-sm transition active:scale-95 ${
                  active
                    ? "bg-[var(--mh-primary)] text-white"
                    : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </section>

        {/* Rules Container */}
        <div className="flex flex-col gap-6">
          {/* Room Allotment Section */}
          {(activeTab === "all" || activeTab === "allotment") && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              aria-label="Room Allotment Rules"
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <HiBuildingOffice2 className="h-5 w-5 text-[var(--mh-primary)]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                  Room Allotment & Care
                </h2>
              </div>
              <div className="grid gap-2">
                {roomRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 rounded-2xl bg-white p-4 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--mh-primary-soft)] text-[11px] font-bold text-[var(--mh-primary)]">
                      {idx + 1}
                    </span>
                    <p className="text-[13px] text-gray-700 leading-relaxed font-medium">
                      {rule}
                    </p>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Mess & Catering Section */}
          {(activeTab === "all" || activeTab === "catering") && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              aria-label="Mess and Catering Rules"
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <MdRestaurant className="h-5 w-5 text-amber-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                  Mess & Catering Guidelines
                </h2>
              </div>
              <div className="grid gap-2">
                {cateringRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 rounded-2xl bg-white p-4 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-50 text-[11px] font-bold text-amber-600">
                      {idx + 1}
                    </span>
                    <p className="text-[13px] text-gray-700 leading-relaxed font-medium">
                      {rule}
                    </p>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* General Discipline Section */}
          {(activeTab === "all" || activeTab === "discipline") && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              aria-label="General Discipline Rules"
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <HiShieldCheck className="h-5 w-5 text-emerald-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                  General Discipline & Conduct
                </h2>
              </div>
              <div className="grid gap-2">
                {disciplineRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 rounded-2xl bg-white p-4 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-600">
                      {idx + 1}
                    </span>
                    <p className="text-[13px] text-gray-700 leading-relaxed font-medium">
                      {rule}
                    </p>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </PageContainer>
    </>
  );
}