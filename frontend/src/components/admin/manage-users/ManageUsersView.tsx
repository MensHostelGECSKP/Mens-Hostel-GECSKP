"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader, PageContainer } from "@/components/ui";
import { useUsers } from "@/hooks/useApi";
import {
  useFilteredResidents,
  type ManageUsersFilters,
} from "@/hooks/useFilteredResidents";
import type { User } from "@/types";
import ManageUsersSearchBar from "./ManageUsersSearchBar";
import ManageUsersFilterChips from "./ManageUsersFilterChips";
import ManageUsersEmpty from "./ManageUsersEmpty";
import { ManageUsersPageSkeleton } from "./ManageUsersSkeleton";
import ResidentCard, { type ResidentMenuAction } from "./ResidentCard";
import ManageUsersFab from "./ManageUsersFab";
import UserDetailsModal from "./UserDetailsModal";
import EditUserModal from "./EditUserModal";
import DeleteUserDialog from "./DeleteUserDialog";
import DeactivateUserDialog from "./DeactivateUserDialog";
import FilterSheet, { FilterOption } from "./FilterSheet";

const INITIAL_FILTERS: ManageUsersFilters = {
  room: "all",
  year: "all",
  status: "all",
};

export default function ManageUsersView() {
  const router = useRouter();
  const {
    data: users = [],
    isLoading,
    isFetching,
    isPending,
    error,
    refetch,
  } = useUsers(true);

  const showListSkeleton = isPending || (isLoading && users.length === 0);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ManageUsersFilters>(INITIAL_FILTERS);
  const [filterSheet, setFilterSheet] = useState<"room" | "year" | "status" | null>(null);
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
  const [pageSize, setPageSize] = useState(20);

  const {
    students,
    filtered,
    roomOptions,
    yearOptions,
    isSearchPending,
    totalCount,
  } = useFilteredResidents(users, search, filters);

  React.useEffect(() => {
    setPageSize(20);
  }, [search, filters]);

  const visibleFiltered = React.useMemo(() => {
    return filtered.slice(0, pageSize);
  }, [filtered, pageSize]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setFilters(INITIAL_FILTERS);
  }, []);

  const closeMenus = useCallback(() => setOpenMenuUserId(null), []);

  const syncUserInModals = useCallback((updated: User) => {
    setViewUser((u) => (u?.userId === updated.userId ? updated : u));
    setEditUser((u) => (u?.userId === updated.userId ? updated : u));
  }, []);

  const handleMenuAction = useCallback(
    (action: ResidentMenuAction, user: User) => {
      closeMenus();
      switch (action) {
        case "view":
          setViewUser(user);
          break;
        case "edit":
          setEditUser(user);
          break;
        case "deactivate":
          setDeactivateUser(user);
          break;
        case "delete":
          setDeleteUser(user);
          break;
      }
    },
    [closeMenus]
  );

  const subtitle = showListSkeleton
    ? "Loading residents…"
    : `${totalCount} ${totalCount === 1 ? "Resident" : "Residents"}`;

  if (showListSkeleton && !error) {
    return <ManageUsersPageSkeleton />;
  }

  return (
    <>
      <AppHeader
        title="Manage Users"
        subtitle={subtitle}
        showBack={true}
      />
      <PageContainer>

      <div className="sticky top-14 z-40 border-b border-gray-100/80 bg-[var(--mh-surface)]/95 px-4 pb-3 pt-1 backdrop-blur-md md:px-6">
        <ManageUsersSearchBar
          value={search}
          onChange={setSearch}
          isSearching={isSearchPending || (isFetching && !isLoading)}
        />
        <div className="mt-3">
          <ManageUsersFilterChips
            totalCount={totalCount}
            filteredCount={filtered.length}
            filters={filters}
            onSelectAll={() => setFilters(INITIAL_FILTERS)}
            onOpenFilter={(key) => setFilterSheet(key)}
          />
        </div>
      </div>

      <div className="px-4 pb-28 pt-4 md:px-6 md:pb-8">
        {error && (
          <div
            className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            <p className="font-semibold">Could not load residents</p>
            <p className="mt-0.5 text-red-600/90">{error.message}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 min-h-[44px] text-sm font-semibold text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {isFetching && users.length > 0 ? (
          <p className="mb-2 text-center text-xs font-medium text-gray-400" aria-live="polite">
            Updating list…
          </p>
        ) : null}

        {!error && students.length === 0 ? (
          <ManageUsersEmpty variant="no-residents" />
        ) : !error && filtered.length === 0 ? (
          <ManageUsersEmpty variant="no-results" onClearFilters={clearFilters} />
        ) : (
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2.5 transition-opacity duration-200">
              {visibleFiltered.map((user) => (
                <li key={user.userId}>
                  <ResidentCard
                    user={user}
                    menuOpen={openMenuUserId === user.userId}
                    onMenuOpenChange={(open) =>
                      setOpenMenuUserId(open ? user.userId : null)
                    }
                    onAction={handleMenuAction}
                  />
                </li>
              ))}
            </ul>
            {filtered.length > pageSize && (
              <button
                type="button"
                onClick={() => setPageSize((prev) => prev + 20)}
                className="w-full py-3 text-center text-sm font-semibold text-[var(--mh-primary)] hover:bg-[var(--mh-primary-soft)] rounded-2xl border border-dashed border-[var(--mh-primary)]/30 transition active:scale-[0.98] active-press"
              >
                + Show More ({filtered.length - pageSize} left)
              </button>
            )}
          </div>
        )}
      </div>

      <ManageUsersFab />

      <UserDetailsModal
        user={viewUser}
        onClose={() => setViewUser(null)}
        onEdit={(user) => {
          setViewUser(null);
          setEditUser(user);
        }}
      />

      <EditUserModal
        user={editUser}
        onClose={() => setEditUser(null)}
        onSaved={(updated) => {
          syncUserInModals(updated);
        }}
      />

      <DeleteUserDialog
        user={deleteUser}
        onClose={() => setDeleteUser(null)}
        onDeleted={() => {
          closeMenus();
          if (viewUser?.userId === deleteUser?.userId) setViewUser(null);
        }}
      />

      <DeactivateUserDialog
        user={deactivateUser}
        onClose={() => setDeactivateUser(null)}
        onDeactivated={(updated) => {
          syncUserInModals(updated);
        }}
      />

      <FilterSheet
        open={filterSheet === "room"}
        title="Filter by room"
        onClose={() => setFilterSheet(null)}
      >
        <FilterOption
          label="All rooms"
          selected={filters.room === "all"}
          onSelect={() => {
            setFilters((f) => ({ ...f, room: "all" }));
            setFilterSheet(null);
          }}
        />
        {roomOptions.map((room) => (
          <FilterOption
            key={room}
            label={`Room ${room}`}
            selected={filters.room === room}
            onSelect={() => {
              setFilters((f) => ({ ...f, room }));
              setFilterSheet(null);
            }}
          />
        ))}
      </FilterSheet>

      <FilterSheet
        open={filterSheet === "year"}
        title="Filter by year"
        onClose={() => setFilterSheet(null)}
      >
        <FilterOption
          label="All years"
          selected={filters.year === "all"}
          onSelect={() => {
            setFilters((f) => ({ ...f, year: "all" }));
            setFilterSheet(null);
          }}
        />
        {yearOptions.map((year) => (
          <FilterOption
            key={year}
            label={`Year ${year}`}
            selected={filters.year === year}
            onSelect={() => {
              setFilters((f) => ({ ...f, year }));
              setFilterSheet(null);
            }}
          />
        ))}
      </FilterSheet>

      <FilterSheet
        open={filterSheet === "status"}
        title="Filter by status"
        onClose={() => setFilterSheet(null)}
      >
        <FilterOption
          label="All statuses"
          selected={filters.status === "all"}
          onSelect={() => {
            setFilters((f) => ({ ...f, status: "all" }));
            setFilterSheet(null);
          }}
        />
        <FilterOption
          label="Active"
          selected={filters.status === "active"}
          onSelect={() => {
            setFilters((f) => ({ ...f, status: "active" }));
            setFilterSheet(null);
          }}
        />
        <FilterOption
          label="Inactive"
          selected={filters.status === "inactive"}
          onSelect={() => {
            setFilters((f) => ({ ...f, status: "inactive" }));
            setFilterSheet(null);
          }}
        />
        <FilterOption
          label="Blocked"
          selected={filters.status === "blocked"}
          onSelect={() => {
            setFilters((f) => ({ ...f, status: "blocked" }));
            setFilterSheet(null);
          }}
        />
      </FilterSheet>
    </PageContainer>
  </>
  );
}
