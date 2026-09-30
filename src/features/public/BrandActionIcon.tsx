import s from "./public.module.css";
export type ActionIcon = "order" | "table" | "coworking";
export function BrandActionIcon({ icon }: { icon: ActionIcon }) {
  return (
    <span className={`${s.actionIcon} ${s[icon]}`} aria-hidden="true">
      <img src={`/ui/actions/${icon}.svg`} width="280" height="280" alt="" />
    </span>
  );
}
