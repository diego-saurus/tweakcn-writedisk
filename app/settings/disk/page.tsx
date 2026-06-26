import { DiskSettings } from "./disk-settings";
import { SettingsHeader } from "../components/settings-header";

export const dynamic = "force-static";

export default function DiskPage() {
  return (
    <div>
      <SettingsHeader
        title="Disk Sync"
        description="Write generated theme CSS directly to a file on your disk."
      />
      <DiskSettings />
    </div>
  );
}