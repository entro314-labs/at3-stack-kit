'use client'

import { Copy, Loader2, RefreshCw, Wand2 } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { MODEL_CONFIGS } from '@/lib/ai/config'
import { type UseAICompletionOptions, useAICompletion } from '@/lib/ai/hooks'
import { cn } from '@/lib/utils'

interface CompletionFormProps extends Omit<UseAICompletionOptions, 'systemMessage'> {
  className?: string
  title?: string
  placeholder?: string
  showSettings?: boolean
  systemMessage?: string
}

export function CompletionForm({
  className,
  title = 'AI Text Generation',
  placeholder = 'Enter your prompt here...',
  showSettings = true,
  systemMessage = 'You are a helpful AI assistant.',
  ...completionOptions
}: CompletionFormProps) {
  const [prompt, setPrompt] = React.useState('')
  const [provider, setProvider] = React.useState(completionOptions.provider || 'openai')
  const [model, setModel] = React.useState(completionOptions.model || 'gpt-4-turbo')
  const [temperature, setTemperature] = React.useState(completionOptions.temperature || 0.7)
  const [maxTokens, setMaxTokens] = React.useState(completionOptions.maxTokens || 2000)
  const [copied, setCopied] = React.useState(false)

  const { completion, isLoading, error, generate, reset } = useAICompletion({
    ...completionOptions,
    provider,
    model,
    temperature,
    maxTokens,
    systemMessage,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isLoading) {
      return
    }
    await generate(prompt)
  }

  const handleCopy = async () => {
    if (!completion) {
      return
    }

    try {
      await navigator.clipboard.writeText(completion)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const availableModels =
    provider && MODEL_CONFIGS[provider as keyof typeof MODEL_CONFIGS]
      ? Object.keys(MODEL_CONFIGS[provider as keyof typeof MODEL_CONFIGS])
      : []

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={placeholder}
              rows={4}
              disabled={isLoading}
              className="min-h-[100px]"
            />
          </div>

          {showSettings && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={provider}
                  onValueChange={(value) => setProvider(value as typeof provider)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google AI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select
                  value={model}
                  onValueChange={(value) => setModel(value)}
                  disabled={isLoading || availableModels.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((modelName) => (
                      <SelectItem key={modelName} value={modelName}>
                        {modelName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Temperature: {temperature}</Label>
                <Slider
                  value={[temperature]}
                  onValueChange={(value) => setTemperature(value[0] ?? 0.7)}
                  min={0}
                  max={2}
                  step={0.1}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Tokens: {maxTokens}</Label>
                <Slider
                  value={[maxTokens]}
                  onValueChange={(value) => setMaxTokens(value[0] ?? 2000)}
                  min={100}
                  max={4000}
                  step={100}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={!prompt.trim() || isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>

            <Button type="button" variant="outline" onClick={reset} disabled={isLoading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {error && (
          <div className="rounded-md border border-destructive/20 bg-destructive/15 px-4 py-3">
            <p className="text-destructive text-sm">Error: {error.message}</p>
          </div>
        )}

        {completion && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Generated Content</Label>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 px-2">
                <Copy className="mr-1 h-4 w-4" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div className="rounded-md border bg-muted p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm">{completion}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
