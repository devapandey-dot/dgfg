import { NavLink, Outlet, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { cn } from "@/lib/utils";

// Billing page layout with sub-navigation on the left and nested routes on the right
const Billing = () => {
  const location = useLocation();

  const menu = [
    { label: "Plan & Usage", to: "/billing/plan" },
    { label: "Payment & History", to: "/billing/payments" },
    { label: "Upgrade / Downgrade", to: "/billing/upgrade" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Billing and Subscription</h1>
          {/* Active section indicator aligned with image style */}
          <div className="text-sm text-muted-foreground">
            {menu.find((m) => location.pathname.startsWith(m.to))?.label || "Plan & Usage"}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sub navigation column */}
          <aside className="lg:col-span-3">
            <nav className="rounded-xl border border-border bg-card p-2">
              {menu.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "block px-3 py-3 rounded-lg text-sm font-medium",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>

          {/* Content column */}
          <section className="lg:col-span-9">
            <Outlet />
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Billing;