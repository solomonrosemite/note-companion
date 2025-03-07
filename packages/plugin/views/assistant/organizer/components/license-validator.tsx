import * as React from "react";
import { ErrorBox } from "./error-box";
import { EmptyState } from "./empty-state";
import FileOrganizer from "../../../../index";
import { App } from "obsidian";

// Extend the App type to include the setting property
interface ObsidianAppWithSettings extends App {
  setting: {
    open: () => void;
    openTabById: (tabId: string) => void;
  };
}

interface LicenseValidatorProps {
  apiKey: string;
  onValidationComplete: () => void;
  plugin: FileOrganizer;
}

export const LicenseValidator: React.FC<LicenseValidatorProps> = ({
  apiKey,
  onValidationComplete,
  plugin,
}) => {
  const [isValidating, setIsValidating] = React.useState(true);
  const [licenseError, setLicenseError] = React.useState<string | null>(
    plugin.settings.licenseErrorMessage || null
  );

  const validateLicense = React.useCallback(async () => {
    try {
      setIsValidating(true);
      setLicenseError(null);
      
      console.log("Validating license key...");
      
      // should be replaced with a hardcoded value
      const response = await fetch(`${plugin.getServerUrl()}/api/check-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const data = await response.json();
      console.log("License validation response:", data);
      
      if (!response.ok) {
        const errorMessage = data.error || "Invalid license key";
        console.error(`License validation failed: ${errorMessage}`);
        setLicenseError(errorMessage);
        // Update plugin settings to reflect invalid license
        plugin.settings.isLicenseValid = false;
        plugin.settings.licenseErrorMessage = errorMessage;
        await plugin.saveSettings();
      } else if (data.message !== "Valid key" && data.message !== "Valid session" && data.message !== "Development mode") {
        const errorMessage = "Invalid license key response";
        console.error(`License validation failed: ${errorMessage}`, data);
        setLicenseError(errorMessage);
        // Update plugin settings to reflect invalid license
        plugin.settings.isLicenseValid = false;
        plugin.settings.licenseErrorMessage = errorMessage;
        await plugin.saveSettings();
      } else {
        console.log("License validation successful:", data.message);
        // Update plugin settings to reflect valid license
        plugin.settings.isLicenseValid = true;
        plugin.settings.licenseErrorMessage = "";
        await plugin.saveSettings();
        onValidationComplete();
      }
    } catch (err) {
      const errorMessage = "Failed to validate license key";
      console.error("License validation error:", err);
      setLicenseError(errorMessage);
      // Update plugin settings to reflect invalid license
      plugin.settings.isLicenseValid = false;
      plugin.settings.licenseErrorMessage = errorMessage;
      await plugin.saveSettings();
    } finally {
      setIsValidating(false);
    }
  }, [apiKey, onValidationComplete, plugin]);

  React.useEffect(() => {
    validateLicense();
  }, [validateLicense]);

  if (licenseError) {
    return (
      <ErrorBox
        message={`License key error: ${licenseError}`}
        description="Please check your license key in the plugin settings."
        actionButton={
          <div className="flex gap-2">
            <button
              onClick={validateLicense}
              className="px-3 py-1.5  rounded hover:opacity-90 transition-opacity duration-200"
            >
              Retry
            </button>
            <button
              onClick={() => {
                // Open Obsidian settings and navigate to plugin settings
                const appWithSettings = plugin.app as ObsidianAppWithSettings;
                appWithSettings.setting.open();
                appWithSettings.setting.openTabById("fileorganizer2000");
              }}
              className="px-3 py-1.5 bg-[--interactive-accent] text-[--text-on-accent] rounded hover:bg-[--interactive-accent-hover] transition-colors duration-200"
            >
              Open Settings
            </button>
          </div>
        }
      />
    );
  }

  return null;
}; 