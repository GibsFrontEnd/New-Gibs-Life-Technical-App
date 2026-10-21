// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ExternalLink, ShieldCheck } from "lucide-react";
import { getNavConfig } from "./navConfig";
import { readRole } from "./userRole";
import { APP_NAME, APP_SUBTITLE } from "./brand";

const linkBase =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-white";
const linkIdle = "text-blue-100/80 hover:bg-white/10 hover:text-white";
const linkActive = "bg-[#155dfd] text-white shadow-md shadow-blue-900/30";

const baseOf = (link: string) => "/" + (link.split("/")[1] ?? "");
const isUnder = (pathname: string, base: string) => pathname === base || pathname.startsWith(base + "/");

// "Individual · Policy Admin" becomes the section "Individual" with the link "Policy Admin".
// Links and sections keep the order they have in the menu config.
const toMenu = (list: any[]) => {
  const entries: any[] = [];
  const sections = new Map<string, any>();
  for (const it of list) {
    const [head, ...rest] = String(it.label).split(" · ");
    if (!rest.length) {
      entries.push({ link: it });
      continue;
    }
    if (!sections.has(head)) {
      const section = { title: head, items: [] };
      sections.set(head, section);
      entries.push({ section });
    }
    sections.get(head).items.push({ ...it, label: rest.join(" · ") });
  }
  return entries;
};

const SubLink = ({ to, children }: any) => (
  <NavLink
    to={to}
    end
    className={({ isActive }) =>
      `block truncate rounded-md px-3 py-1.5 text-[13px] transition-colors ${isActive ? "font-semibold text-white" : "text-blue-100/70 hover:text-white"}`
    }
  >
    {children}
  </NavLink>
);

const Section = ({ section }: any) => {
  const { pathname } = useLocation();
  const inside = section.items.some((i: any) => pathname === i.path || pathname.startsWith(i.path + "/"));
  const [open, setOpen] = useState(inside);
  useEffect(() => {
    if (inside) setOpen(true);
  }, [inside]);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-blue-200/60 hover:text-blue-100"
      >
        <span className="truncate">{section.title}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="mb-1 space-y-0.5">
          {section.items.map((i: any) => (
            <li key={i.path}>
              <SubLink to={i.path}>{i.label}</SubLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

const Group = ({ item, open, onToggle }: any) => {
  const { pathname } = useLocation();
  const Icon = item.icon;
  const inside = isUnder(pathname, baseOf(item.link));
  const menu = useMemo(() => toMenu(item.dropdownItems ?? []), [item]);

  return (
    <div>
      <button type="button" onClick={onToggle} aria-expanded={open} className={`${linkBase} w-full ${inside ? "bg-white/10 text-white" : linkIdle}`}>
        {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
        <span className="flex-1 truncate text-left">{item.title}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="ml-[1.35rem] mt-1 space-y-0.5 border-l border-white/10 pl-3">
          <ul className="space-y-0.5">
            {menu.map(({ link: l, section }) =>
              section ? (
                <Section key={section.title} section={section} />
              ) : (
                <li key={l.path}>
                  {l.external ? (
                    <a href={l.path} target="_blank" rel="noopener noreferrer" className="block truncate rounded-md px-3 py-1.5 text-[13px] text-blue-100/70 hover:text-white">
                      {l.label}
                    </a>
                  ) : (
                    <SubLink to={l.path}>{l.label}</SubLink>
                  )}
                </li>
              ),
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

/** The menu itself, for the left sidebar on desktop. */
export const SidebarMenu = () => {
  const { pathname } = useLocation();
  const role = readRole();
  const items = useMemo(() => getNavConfig().filter((i) => !i.hidden && i.roles.includes(role)), [role]);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const hit = items.find((i) => i.hasDropdown && !i.external && isUnder(pathname, baseOf(i.link)));
    if (hit) setOpen((o) => ({ ...o, [hit.title]: true }));
  }, [pathname, items]);

  return (
    <nav className="flex-1 overflow-y-auto px-3 pb-6" aria-label="Main">
      <p className="mb-1 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wider text-blue-200/50">Workspace</p>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.external) {
            return (
              <a key={item.title} href={item.link} target="_blank" rel="noopener noreferrer" className={`${linkBase} ${linkIdle}`}>
                {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
                <span className="flex-1 truncate">{item.title}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
              </a>
            );
          }
          if (item.hasDropdown) {
            return <Group key={item.title} item={item} open={!!open[item.title]} onToggle={() => setOpen((o) => ({ ...o, [item.title]: !o[item.title] }))} />;
          }
          return (
            <NavLink key={item.title} to={item.link} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
              {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
              <span className="truncate">{item.title}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

/** The left menu on large screens. Smaller screens keep the header and its slide-out menu. */
const AppSidebar = () => {
  const navigate = useNavigate();
  return (
    <aside className="fixed inset-y-0 left-0 z-[100] hidden w-64 flex-col bg-gradient-to-b from-[#0b1f4d] to-[#0a1a3f] text-white lg:flex" aria-label="Main menu">
      <button type="button" onClick={() => navigate("/dashboard")} className="flex h-16 shrink-0 items-center gap-3 px-5 text-left">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#155dfd]">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold leading-tight">{APP_NAME}</span>
          <span className="block truncate text-[11px] text-blue-200/70">{APP_SUBTITLE}</span>
        </span>
      </button>
      <SidebarMenu />
    </aside>
  );
};

export default AppSidebar;
