import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown, Check, UploadCloud, Globe, Clock, Layout } from "lucide-react";
import Loader from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { COUNTRIES, TIMEZONES, getTimezoneCode, formatTimezoneLabel } from "@/constants/geo";
import { tenantService } from "@/services/tenant.service";
import { userService } from "@/services/user.service";
import { uploadService } from "@/services/upload.service";
import { TenantItem } from "@/types/api.types";
import { useToast } from "@/components/ui/use-toast";

const Settings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [tenant, setTenant] = useState<TenantItem | null>(null);

  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [country, setCountry] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("");
  const timezoneCode = useMemo(() => (timezone ? getTimezoneCode(timezone) : ""), [timezone]);
  const [logo, setLogo] = useState<string>("");
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const meRes = await userService.me();
      if (!meRes.success || !meRes.data?.user?.tenant_id) {
        setIsLoading(false);
        toast({ title: "Unable to load tenant", description: meRes.error || "No tenant associated." });
        return;
      }
      const id = meRes.data.user.tenant_id;
      setTenantId(id);
      const tRes = await tenantService.get(id);
      if (!tRes.success || !tRes.data) {
        setIsLoading(false);
        toast({ title: "Unable to load tenant", description: tRes.error || "Unknown error" });
        return;
      }
      const t = tRes.data;
      setTenant(t);
      setName(t.name || "");
      setDomain(t.domain || "");
      setCountry(t.country || "");
      setTimezone(t.timezone || "");
      setLogo(t.logo || "");
      setIsLoading(false);
    };
    init();
  }, [toast]);

  const handleUploadLogo = async (file?: File) => {
    if (!file) return;
    setLogoUploading(true);
    const res = await uploadService.uploadFile(file);
    setLogoUploading(false);
    if (res.success && res.data) {
      setLogo(res.data.url);
      toast({ title: "Logo uploaded" });
    } else {
      toast({ title: "Upload failed", description: res.error || "Please try again." });
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;
    setIsSaving(true);
    const res = await tenantService.update(tenantId, {
      name,
      domain,
      country,
      timezone,
      logo,
    });
    setIsSaving(false);
    if (res.success && res.data) {
      setTenant(res.data);
      toast({ title: "Settings saved" });
    } else {
      toast({ title: "Save failed", description: res.error || "Please review your inputs." });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Tenant Settings</h1>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader className="h-4 w-4" /> Loading...</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Organization name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input id="domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Country</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                      {country || "Select country"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                    <Command>
                      <CommandInput placeholder="Search country..." />
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandList className="max-h-64 overflow-y-auto">
                        <CommandGroup>
                          {COUNTRIES.map((c) => (
                            <CommandItem key={c} onSelect={() => setCountry(c)}>
                              <Check className={cn("mr-2 h-4 w-4", country === c ? "opacity-100" : "opacity-0")} />
                              {c}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                      {timezone ? formatTimezoneLabel(timezone) : "Select timezone"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                    <Command>
                      <CommandInput placeholder="Search timezone..." />
                      <CommandEmpty>No timezone found.</CommandEmpty>
                      <CommandList className="max-h-64 overflow-y-auto">
                        <CommandGroup>
                          {TIMEZONES.map((tz) => (
                            <CommandItem key={tz} onSelect={() => setTimezone(tz)}>
                              <Check className={cn("mr-2 h-4 w-4", timezone === tz ? "opacity-100" : "opacity-0")} />
                              {formatTimezoneLabel(tz)}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {timezone && timezoneCode ? (
                  <p className="text-xs text-muted-foreground">Code: {timezoneCode}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded bg-muted overflow-hidden flex items-center justify-center">
                  {logo ? (
                    <img src={logo} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground">No logo</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadLogo(e.target.files?.[0])}
                  />
                  {logoUploading && <Loader size="sm" />}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setName(tenant?.name || "");
                setDomain(tenant?.domain || "");
                setCountry(tenant?.country || "");
                setTimezone(tenant?.timezone || "");
                setLogo(tenant?.logo || "");
              }}>Reset</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader className="mr-2 h-4 w-4" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Save Settings
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Settings;