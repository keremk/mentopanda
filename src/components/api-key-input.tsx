"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getStoredApiKey, storeApiKey, removeApiKey } from "@/lib/apikey";

interface ApiKeyInputProps {
  showRemoveButton?: boolean;
  className?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ApiKeyInput({
  showRemoveButton = true,
  className,
  onChange,
}: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    async function loadApiKey() {
      const storedApiKey = await getStoredApiKey();
      if (storedApiKey) setApiKey(storedApiKey);
    }
    loadApiKey();
  }, []);

  async function handleApiKeyChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const newApiKey = event.target.value;
    setApiKey(newApiKey);
    await storeApiKey(newApiKey);
    onChange?.(event);
  }

  async function handleRemoveApiKey() {
    setApiKey("");
    await removeApiKey();
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="apiKey">OpenAI API Key</Label>
      <div className="flex gap-4">
        <Input
          id="apiKey"
          name="apiKey"
          type="password"
          value={apiKey}
          onChange={handleApiKeyChange}
          placeholder="sk-..."
          className="flex-1"
        />
        {showRemoveButton && (
          <Button type="button" variant="outline" onClick={handleRemoveApiKey}>
            Clear Key
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Your API key is stored locally and never sent to our servers
      </p>
    </div>
  );
}
