import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type { AgentConfig } from "@shared/schema";

interface ModelPickerProps {
  config: AgentConfig;
  onConfigChange: (updates: Partial<AgentConfig>) => void;
}

const providers = [
  { value: 'aipipe', label: 'AI Pipe (Recommended)', models: ['openai/gpt-4.1-nano', 'openai/gpt-4.0-nano', 'openai/gpt-4o', 'openai/gpt-3.5-turbo'] },
  { value: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-5', 'gpt-4', 'gpt-3.5-turbo'] },
  { value: 'anthropic', label: 'Anthropic', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
  { value: 'google', label: 'Google', models: ['gemini-pro', 'gemini-pro-vision'] },
  { value: 'cohere', label: 'Cohere', models: ['command', 'command-light'] },
];

export function ModelPicker({ config, onConfigChange }: ModelPickerProps) {
  const currentProvider = providers.find(p => p.value === config.provider);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="provider-select">Provider</Label>
        <Select 
          value={config.provider} 
          onValueChange={(provider: any) => {
            const providerData = providers.find(p => p.value === provider);
            onConfigChange({ 
              provider,
              model: providerData?.models[0] || ''
            });
          }}
        >
          <SelectTrigger id="provider-select" data-testid="select-provider">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map((provider) => (
              <SelectItem key={provider.value} value={provider.value}>
                {provider.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="model-select">Model</Label>
        <Select 
          value={config.model} 
          onValueChange={(model) => onConfigChange({ model })}
        >
          <SelectTrigger id="model-select" data-testid="select-model">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {currentProvider?.models.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="api-key">
          API Key 
          {config.provider === 'aipipe' && (
            <span className="text-xs text-muted-foreground ml-2">(Optional - AI Pipe configured via environment)</span>
          )}
        </Label>
        <Input
          id="api-key"
          type="password"
          placeholder={
            config.provider === 'aipipe' 
              ? "AI Pipe API key (optional)" 
              : "Enter your API key"
          }
          value={config.apiKey}
          onChange={(e) => onConfigChange({ apiKey: e.target.value })}
          data-testid="input-api-key"
        />
        {config.provider === 'openai' && (
          <p className="text-xs text-muted-foreground mt-1">
            Get your OpenAI API key from: https://platform.openai.com/api-keys
          </p>
        )}
      </div>

      <div>
        <Label>Temperature: {config.temperature}</Label>
        <Slider
          value={[config.temperature]}
          onValueChange={([temperature]) => onConfigChange({ temperature })}
          max={2}
          min={0}
          step={0.1}
          className="mt-2"
          data-testid="slider-temperature"
        />
      </div>

      <div>
        <Label htmlFor="max-tokens">Max Tokens</Label>
        <Input
          id="max-tokens"
          type="number"
          min="1"
          max="4000"
          value={config.maxTokens}
          onChange={(e) => onConfigChange({ maxTokens: parseInt(e.target.value) || 1000 })}
          data-testid="input-max-tokens"
        />
      </div>
    </div>
  );
}
