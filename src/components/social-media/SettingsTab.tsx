'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Stack,
  Flex,
  Text,
  Button,
  TextInput,
  Label,
  Badge,
  Container,
  Heading,
  Grid,
  Switch,
  Spinner,
  useToast,
  Select,
} from '@sanity/ui'
import { CogIcon, SyncIcon, CheckmarkCircleIcon, CloseCircleIcon } from '@sanity/icons'
import { useClient } from 'sanity'

// ============================================
// TYPES
// ============================================

interface ConnectedAccount {
  accountId: string
  platform: string
  username: string
  isActive: boolean
  connectedAt?: string
}

interface SettingsData {
  apiKey: string
  profileId: string
  connectedAccounts: ConnectedAccount[]
  defaultTimezone: string
  autoPublish: boolean
  lastSync?: string
}

// ============================================
// SETTINGS TAB COMPONENT
// ============================================

export function SettingsTab() {
  const client = useClient({ apiVersion: '2024-01-01' })
  const toast = useToast()

  const [settings, setSettings] = useState<SettingsData>({
    apiKey: '',
    profileId: '',
    connectedAccounts: [],
    defaultTimezone: 'Europe/Berlin',
    autoPublish: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [documentId, setDocumentId] = useState<string | null>(null)

  // Load settings from Sanity
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await client.fetch<(SettingsData & { _id: string }) | null>(
          `*[_type == "lateApiSettings"][0] {
            _id,
            apiKey,
            profileId,
            connectedAccounts,
            defaultTimezone,
            autoPublish,
            lastSync
          }`
        )

        if (data) {
          setDocumentId(data._id)
          setSettings({
            apiKey: data.apiKey || '',
            profileId: data.profileId || '',
            connectedAccounts: data.connectedAccounts || [],
            defaultTimezone: data.defaultTimezone || 'Europe/Berlin',
            autoPublish: data.autoPublish || false,
            lastSync: data.lastSync,
          })
        }
      } catch (error) {
        console.error('Error loading settings:', error)
        toast.push({
          status: 'error',
          title: 'Fehler',
          description: 'Einstellungen konnten nicht geladen werden',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [client, toast])

  // Save settings
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      if (documentId) {
        await client.patch(documentId).set({
          apiKey: settings.apiKey.trim(),
          profileId: settings.profileId.trim(),
          defaultTimezone: settings.defaultTimezone,
          autoPublish: settings.autoPublish,
        }).commit()
      } else {
        // Create new settings document
        const doc = await client.create({
          _type: 'lateApiSettings',
          apiKey: settings.apiKey.trim(),
          profileId: settings.profileId.trim(),
          defaultTimezone: settings.defaultTimezone,
          autoPublish: settings.autoPublish,
          connectedAccounts: [],
        })
        setDocumentId(doc._id)
      }

      toast.push({
        status: 'success',
        title: 'Gespeichert',
        description: 'Einstellungen wurden erfolgreich gespeichert',
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.push({
        status: 'error',
        title: 'Fehler',
        description: 'Einstellungen konnten nicht gespeichert werden',
      })
    } finally {
      setIsSaving(false)
    }
  }, [client, documentId, settings, toast])

  // Sync connected accounts
  const handleSync = useCallback(async () => {
    if (!settings.apiKey) {
      toast.push({
        status: 'warning',
        title: 'API Key fehlt',
        description: 'Bitte gib zuerst deinen Late API Key ein',
      })
      return
    }

    setIsSyncing(true)
    try {
      const response = await fetch('/api/late/sync-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Sync failed')
      }

      const data = await response.json()

      // Reload settings to get updated accounts
      const updated = await client.fetch<(SettingsData & { _id: string }) | null>(
        `*[_type == "lateApiSettings"][0] {
          _id,
          apiKey,
          profileId,
          connectedAccounts,
          defaultTimezone,
          autoPublish,
          lastSync
        }`
      )

      if (updated) {
        setSettings({
          apiKey: updated.apiKey || '',
          profileId: updated.profileId || '',
          connectedAccounts: updated.connectedAccounts || [],
          defaultTimezone: updated.defaultTimezone || 'Europe/Berlin',
          autoPublish: updated.autoPublish || false,
          lastSync: updated.lastSync,
        })
      }

      toast.push({
        status: 'success',
        title: 'Synchronisiert',
        description: `${data.accounts?.length || 0} Accounts synchronisiert`,
      })
    } catch (error) {
      console.error('Sync error:', error)
      toast.push({
        status: 'error',
        title: 'Sync fehlgeschlagen',
        description: 'Accounts konnten nicht synchronisiert werden. PrÃ¼fe deinen API Key.',
      })
    } finally {
      setIsSyncing(false)
    }
  }, [client, settings.apiKey, toast])

  const platformIcons: Record<string, string> = {
    instagram: 'ðŸ“¸',
    facebook: 'ðŸ‘¥',
    threads: 'ðŸ§µ',
    twitter: 'ð•',
  }

  if (isLoading) {
    return (
      <Container width={2} padding={5}>
        <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
          <Spinner muted />
        </Flex>
      </Container>
    )
  }

  return (
    <Container width={2} padding={4}>
      <Stack space={5}>
        {/* Header */}
        <Flex align="center" gap={3}>
          <CogIcon style={{ fontSize: 28 }} />
          <Heading as="h1" size={2}>
            Settings
          </Heading>
          <Badge tone="caution" fontSize={0}>Late API</Badge>
        </Flex>

        {/* API Configuration */}
        <Card padding={4} radius={2} shadow={1}>
          <Stack space={4}>
            <Flex align="center" gap={2}>
              <Badge tone="primary">1</Badge>
              <Text weight="semibold" size={1}>API Konfiguration</Text>
            </Flex>

            <Stack space={3}>
              <Stack space={2}>
                <Label size={0}>Late API Key</Label>
                <Flex gap={2}>
                  <TextInput
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.apiKey}
                    onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.currentTarget.value }))}
                    placeholder="sk_..."
                    fontSize={1}
                    style={{ flex: 1 }}
                  />
                  <Button
                    text={showApiKey ? 'ðŸ™ˆ' : 'ðŸ‘ï¸'}
                    mode="ghost"
                    onClick={() => setShowApiKey(!showApiKey)}
                    fontSize={0}
                  />
                </Flex>
                <Text size={0} muted>
                  API Key von getlate.dev â€” beginnt mit sk_
                </Text>
              </Stack>

              <Stack space={2}>
                <Label size={0}>Profile ID</Label>
                <TextInput
                  value={settings.profileId}
                  onChange={(e) => setSettings(prev => ({ ...prev, profileId: e.currentTarget.value }))}
                  placeholder="prof_... oder MongoDB ObjectId"
                  fontSize={1}
                />
              </Stack>
            </Stack>
          </Stack>
        </Card>

        {/* Timezone & Defaults */}
        <Card padding={4} radius={2} shadow={1}>
          <Stack space={4}>
            <Flex align="center" gap={2}>
              <Badge tone="primary">2</Badge>
              <Text weight="semibold" size={1}>Standard-Einstellungen</Text>
            </Flex>

            <Grid columns={2} gap={3}>
              <Stack space={2}>
                <Label size={0}>Standard Zeitzone</Label>
                <Select
                  value={settings.defaultTimezone}
                  onChange={(e) => setSettings(prev => ({ ...prev, defaultTimezone: e.currentTarget.value }))}
                  fontSize={1}
                >
                  <option value="Europe/Berlin">ðŸ‡©ðŸ‡ª Europe/Berlin (CET/CEST)</option>
                  <option value="Europe/London">ðŸ‡¬ðŸ‡§ Europe/London (GMT/BST)</option>
                  <option value="America/New_York">ðŸ‡ºðŸ‡¸ America/New_York (EST/EDT)</option>
                  <option value="America/Los_Angeles">ðŸ‡ºðŸ‡¸ America/Los_Angeles (PST/PDT)</option>
                  <option value="UTC">ðŸŒ UTC</option>
                </Select>
              </Stack>

              <Flex align="center" justify="space-between" style={{ paddingTop: '20px' }}>
                <Stack space={1}>
                  <Label size={0}>Auto-Publish</Label>
                  <Text size={0} muted>Posts sofort verÃ¶ffentlichen</Text>
                </Stack>
                <Switch
                  checked={settings.autoPublish}
                  onChange={() => setSettings(prev => ({ ...prev, autoPublish: !prev.autoPublish }))}
                />
              </Flex>
            </Grid>
          </Stack>
        </Card>

        {/* Connected Accounts */}
        <Card padding={4} radius={2} shadow={1}>
          <Stack space={4}>
            <Flex align="center" justify="space-between">
              <Flex align="center" gap={2}>
                <Badge tone="primary">3</Badge>
                <Text weight="semibold" size={1}>Verbundene Accounts</Text>
                <Badge tone="default" fontSize={0}>
                  {settings.connectedAccounts.length}
                </Badge>
              </Flex>
              <Button
                icon={SyncIcon}
                text="Accounts synchronisieren"
                mode="ghost"
                tone="primary"
                onClick={handleSync}
                loading={isSyncing}
                disabled={!settings.apiKey || isSyncing}
                fontSize={0}
              />
            </Flex>

            {settings.lastSync && (
              <Text size={0} muted>
                Letzte Synchronisation: {new Date(settings.lastSync).toLocaleString('de-DE')}
              </Text>
            )}

            {settings.connectedAccounts.length === 0 ? (
              <Card padding={4} radius={2} tone="transparent" style={{ border: '1px dashed var(--card-border-color)' }}>
                <Stack space={2}>
                  <Text size={1} align="center" muted>Keine Accounts verbunden</Text>
                  <Text size={0} align="center" muted>
                    Klicke &quot;Accounts synchronisieren&quot; um deine Social Media Accounts zu laden
                  </Text>
                </Stack>
              </Card>
            ) : (
              <Grid columns={[1, 1, 2]} gap={3}>
                {settings.connectedAccounts.map((account, idx) => (
                  <Card key={idx} padding={3} radius={2} shadow={1} tone={account.isActive ? 'positive' : 'transparent'}>
                    <Flex align="center" justify="space-between">
                      <Flex align="center" gap={2}>
                        <Text size={2}>{platformIcons[account.platform] || 'ðŸ“±'}</Text>
                        <Stack space={1}>
                          <Text size={1} weight="bold">
                            @{account.username}
                          </Text>
                          <Text size={0} muted>
                            {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                          </Text>
                        </Stack>
                      </Flex>
                      {account.isActive ? (
                        <Flex align="center" gap={1}>
                          <CheckmarkCircleIcon style={{ color: 'green' }} />
                          <Text size={0} style={{ color: 'green' }}>Aktiv</Text>
                        </Flex>
                      ) : (
                        <Flex align="center" gap={1}>
                          <CloseCircleIcon style={{ color: 'red' }} />
                          <Text size={0} style={{ color: 'red' }}>Inaktiv</Text>
                        </Flex>
                      )}
                    </Flex>
                  </Card>
                ))}
              </Grid>
            )}
          </Stack>
        </Card>

        {/* System Info */}
        <Card padding={4} radius={2} shadow={1} tone="transparent">
          <Stack space={3}>
            <Flex align="center" gap={2}>
              <Badge tone="default">â„¹ï¸</Badge>
              <Text weight="semibold" size={1}>System Info</Text>
            </Flex>
            <Grid columns={2} gap={2}>
              <Text size={0} muted>Studio Version</Text>
              <Text size={0}>v2.2</Text>
              <Text size={0} muted>Late API</Text>
              <Text size={0}>{settings.apiKey ? 'âœ… Konfiguriert' : 'âŒ Nicht konfiguriert'}</Text>
              <Text size={0} muted>Accounts</Text>
              <Text size={0}>{settings.connectedAccounts.length} verbunden</Text>
              <Text size={0} muted>Zeitzone</Text>
              <Text size={0}>{settings.defaultTimezone}</Text>
            </Grid>
          </Stack>
        </Card>

        {/* Save Button */}
        <Flex justify="flex-end" gap={2}>
          <Button
            text="Einstellungen speichern"
            mode="default"
            tone="positive"
            onClick={handleSave}
            loading={isSaving}
            disabled={isSaving}
            fontSize={1}
            padding={3}
          />
        </Flex>
      </Stack>
    </Container>
  )
}

