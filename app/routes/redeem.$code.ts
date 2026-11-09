import { redirect } from "react-router";
import type { Route } from "./+types/redeem.$code";

// Seat links shared before Seats were renamed from coupons used /redeem/:code.
export function loader({ params }: Route.LoaderArgs) {
  return redirect(`/seats/${encodeURIComponent(params.code)}/claim`, 301);
}
