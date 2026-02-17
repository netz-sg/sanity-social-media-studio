'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Stack,
  Flex,
  Box,
  Text,
  Button,
  TextInput,
  TextArea,
  Select,
  Badge,
  Spinner,
  Dialog,
  Switch,
  Grid,
  Label,
  Container,
  Heading,
  useToast,
} from '@sanity/ui'
import { TrashIcon, EditIcon, CopyIcon, AddIcon, SearchIcon, DocumentTextIcon, DocumentsIcon } from '@sanity/icons'
import { useClient } from 'sanity'

// ============================================
// TYPES
// ============================================

interface SocialMediaDraft {
  _id: string
  _createdAt: string
  _updatedAt?: string
  title: string
  content: string
  hashtags: string
  photographer: string
  platforms: string[]
  platformTexts: {
    instagram?: string
    facebook?: string
    threads?: string
    twitter?: string
  }
  instagramPostType: string
  mediaUrls: string[]
  scheduledFor: string | null
  notes: string
  tags: string[]
  isTemplate: boolean
  createdBy: string
}

interface SocialMediaTemplate {
  _id: string
  _createdAt: string
  _updatedAt?: string
  title: string
  category: string
  content: string
  hashtags: string
  platforms: string[]
  instagramPostType?: string
  language: string
  description?: string
  exampleData?: {
    title?: string
    date?: string
    location?: string
    venue?: string
    time?: string
    price?: string
    url?: string
  }
  isActive: boolean
  usageCount: number
}

interface DraftsTemplatesTabProps {
  onLoadDraft?: (draft: SocialMediaDraft) => void
  onApplyTemplate?: (template: SocialMediaTemplate) => void
}

const CATEGORY_OPTIONS = [
  { title: 'ðŸŽ¸ Konzert-AnkÃ¼ndigung', value: 'concert' },
  { title: 'ðŸ“° News-Update', value: 'news' },
  { title: 'ðŸŽ Gewinnspiel', value: 'giveaway' },
  { title: 'ðŸ—ºï¸ Tour-Termin', value: 'tour' },
  { title: 'ðŸ“¸ Aftershow-Story', value: 'aftershow' },
  { title: 'ðŸ’¿ Album/Release', value: 'release' },
  { title: 'ðŸŽ¬ Video-Release', value: 'video' },
  { title: 'âœ¨ Allgemein', value: 'general' },
]

const CATEGORY_ICONS: Record<string, string> = {
  concert: 'ðŸŽ¸',
  news: 'ðŸ“°',
  giveaway: 'ðŸŽ',
  tour: 'ðŸ—ºï¸',
  aftershow: 'ðŸ“¸',
  release: 'ðŸ’¿',
  video: 'ðŸŽ¬',
  general: 'âœ¨',
}

const PLATFORM_LABELS: Record<string, { label: string; icon: string }> = {
  instagram: { label: 'Instagram', icon: 'ðŸ“¸' },
  facebook: { label: 'Facebook', icon: 'ðŸ‘¥' },
  threads: { label: 'Threads', icon: 'ðŸ§µ' },
  twitter: { label: 'X', icon: 'ðŸ¦' },
}

// ============================================
// MAIN COMPONENT
// ============================================

export function DraftsTemplatesTab({ onLoadDraft, onApplyTemplate }: DraftsTemplatesTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'drafts' | 'templates'>('drafts')

  return (
    <Container width={2} padding={4}>
      <Stack space={5}>
        {/* Header */}
        <Flex align="center" gap={3}>
          <DocumentTextIcon style={{ fontSize: 28 }} />
          <Heading as="h1" size={2}>
            Drafts & Templates
          </Heading>
          <Badge tone="primary" fontSize={0}>Verwaltung</Badge>
        </Flex>

        {/* Sub-Tab Switcher */}
        <Card padding={0} radius={2} shadow={1}>
          <Grid columns={2} gap={0}>
            <Button
              icon={DocumentsIcon}
              text="ðŸ“ Drafts"
              mode={activeSubTab === 'drafts' ? 'default' : 'ghost'}
              tone={activeSubTab === 'drafts' ? 'primary' : 'default'}
              onClick={() => setActiveSubTab('drafts')}
              fontSize={1}
              style={{ borderRadius: 0 }}
            />
            <Button
              icon={DocumentTextIcon}
              text="ðŸ“‹ Templates"
              mode={activeSubTab === 'templates' ? 'default' : 'ghost'}
              tone={activeSubTab === 'templates' ? 'primary' : 'default'}
              onClick={() => setActiveSubTab('templates')}
              fontSize={1}
              style={{ borderRadius: 0 }}
            />
          </Grid>
        </Card>

        {activeSubTab === 'drafts' && (
          <DraftsPanel onLoadDraft={onLoadDraft} />
        )}

        {activeSubTab === 'templates' && (
          <TemplatesPanel onApplyTemplate={onApplyTemplate} />
        )}
      </Stack>
    </Container>
  )
}

// ============================================
// DRAFTS PANEL
// ============================================

interface DraftsPanelProps {
  onLoadDraft?: (draft: SocialMediaDraft) => void
}

function DraftsPanel({ onLoadDraft }: DraftsPanelProps) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const toast = useToast()
  const [drafts, setDrafts] = useState<SocialMediaDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPlatform, setFilterPlatform] = useState<string>('')
  const [editingDraft, setEditingDraft] = useState<SocialMediaDraft | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Load drafts
  const loadDrafts = useCallback(async () => {
    setLoading(true)
    try {
      const query = `*[_type == "socialMediaDraft"] | order(_createdAt desc) {
        _id, _createdAt, _updatedAt, title, content, hashtags, photographer,
        platforms, platformTexts, instagramPostType, mediaUrls,
        scheduledFor, notes, tags, isTemplate, createdBy
      }`
      const data = await client.fetch(query)
      setDrafts(data || [])
    } catch (error) {
      console.error('Load drafts error:', error)
      toast.push({ status: 'error', title: 'Fehler', description: 'Drafts konnten nicht geladen werden' })
    } finally {
      setLoading(false)
    }
  }, [client, toast])

  useEffect(() => { loadDrafts() }, [loadDrafts])

  // Delete draft
  const handleDelete = useCallback(async (id: string) => {
    try {
      await client.delete(id)
      setDrafts(prev => prev.filter(d => d._id !== id))
      setDeleteConfirm(null)
      toast.push({ status: 'success', title: 'Draft gelÃ¶scht' })
    } catch (error) {
      console.error('Delete draft error:', error)
      toast.push({ status: 'error', title: 'Fehler', description: 'Draft konnte nicht gelÃ¶scht werden' })
    }
  }, [client, toast])

  // Duplicate draft
  const handleDuplicate = useCallback(async (draft: SocialMediaDraft) => {
    try {
      const { _id, _createdAt, _updatedAt, ...rest } = draft
      await client.create({
        ...rest,
        _type: 'socialMediaDraft',
        title: `${draft.title} (Kopie)`,
        createdBy: 'Social Media Studio',
      })
      toast.push({ status: 'success', title: 'Draft dupliziert', description: `${draft.title} (Kopie)` })
      await loadDrafts()
    } catch (error) {
      console.error('Duplicate draft error:', error)
      toast.push({ status: 'error', title: 'Fehler', description: 'Draft konnte nicht dupliziert werden' })
    }
  }, [client, toast, loadDrafts])

  // Save edited draft
  const handleSaveEdit = useCallback(async (draft: SocialMediaDraft) => {
    try {
      await client.patch(draft._id).set({
        title: draft.title,
        content: draft.content,
        hashtags: draft.hashtags,
        photographer: draft.photographer,
        platforms: draft.platforms,
        platformTexts: draft.platformTexts,
        notes: draft.notes,
        tags: draft.tags,
        scheduledFor: draft.scheduledFor,
      }).commit()
      setEditingDraft(null)
      toast.push({ status: 'success', title: 'Draft gespeichert', description: draft.title })
      await loadDrafts()
    } catch (error) {
      console.error('Save draft error:', error)
      toast.push({ status: 'error', title: 'Fehler', description: 'Draft konnte nicht gespeichert werden' })
    }
  }, [client, toast, loadDrafts])

  // Filter drafts
  const filteredDrafts = drafts.filter(d => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!d.title?.toLowerCase().includes(q) && !d.content?.toLowerCase().includes(q)) return false
    }
    if (filterPlatform && !d.platforms?.includes(filterPlatform)) return false
    return true
  })

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <Stack space={4}>
      {/* Search & Filter Bar */}
      <Card padding={4} radius={2} shadow={1}>
        <Stack space={3}>
          <Flex align="center" gap={2}>
            <Badge tone="primary">ðŸ”</Badge>
            <Text weight="semibold" size={1}>Suchen & Filtern</Text>
            <Box flex={1} />
            <Button
              icon={AddIcon}
              text="Neuer Draft"
              tone="primary"
              mode="ghost"
              onClick={() => setShowCreateDialog(true)}
              fontSize={1}
              padding={2}
            />
          </Flex>
          <Grid columns={[1, 2]} gap={2}>
            <TextInput
              icon={SearchIcon}
              placeholder="Drafts durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              fontSize={1}
            />
            <Select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.currentTarget.value)}
              fontSize={1}
            >
              <option value="">Alle Plattformen</option>
              {Object.entries(PLATFORM_LABELS).map(([key, { icon, label }]) => (
                <option key={key} value={key}>{icon} {label}</option>
              ))}
            </Select>
          </Grid>
          <Text size={0} muted>{filteredDrafts.length} von {drafts.length} Draft{drafts.length !== 1 ? 's' : ''}</Text>
        </Stack>
      </Card>

      {/* Draft List */}
      {filteredDrafts.length === 0 ? (
        <Card padding={5} radius={2} shadow={1} tone="transparent">
          <Stack space={3} style={{ textAlign: 'center' }}>
            <Text size={4}>ðŸ“</Text>
            <Heading size={1}>Keine Drafts gefunden</Heading>
            <Text muted size={1}>
              {drafts.length === 0
                ? 'Erstelle Drafts Ã¼ber den Posting-Tab oder klicke auf "Neuer Draft"'
                : 'Kein Draft passt zu deiner Suche'}
            </Text>
          </Stack>
        </Card>
      ) : (
        <Stack space={2}>
          {filteredDrafts.map((draft) => (
            <Card
              key={draft._id}
              padding={3}
              radius={2}
              shadow={1}
              tone={draft.isTemplate ? 'caution' : 'default'}
            >
              <Stack space={2}>
                <Flex align="center" justify="space-between">
                  <Flex align="center" gap={2} wrap="wrap">
                    {draft.isTemplate && <Text size={1}>ðŸ“‹</Text>}
                    <Heading size={0}>{draft.title}</Heading>
                    {draft.platforms?.map(p => (
                      <Badge key={p} tone="primary" fontSize={0}>
                        {PLATFORM_LABELS[p]?.icon} {PLATFORM_LABELS[p]?.label || p}
                      </Badge>
                    ))}
                    {draft.mediaUrls?.length > 0 && (
                      <Badge tone="positive" fontSize={0}>
                        ðŸ“Ž {draft.mediaUrls.length} Medien
                      </Badge>
                    )}
                  </Flex>
                  <Flex gap={1}>
                    {onLoadDraft && (
                      <Button
                        icon={DocumentsIcon}
                        text="Laden"
                        mode="ghost"
                        tone="primary"
                        onClick={() => onLoadDraft(draft)}
                        fontSize={0}
                        padding={2}
                      />
                    )}
                    <Button
                      icon={EditIcon}
                      mode="ghost"
                      onClick={() => setEditingDraft({ ...draft })}
                      fontSize={0}
                      padding={2}
                      title="Bearbeiten"
                    />
                    <Button
                      icon={CopyIcon}
                      mode="ghost"
                      onClick={() => handleDuplicate(draft)}
                      fontSize={0}
                      padding={2}
                      title="Duplizieren"
                    />
                    <Button
                      icon={TrashIcon}
                      mode="ghost"
                      tone="critical"
                      onClick={() => setDeleteConfirm(draft._id)}
                      fontSize={0}
                      padding={2}
                      title="LÃ¶schen"
                    />
                  </Flex>
                </Flex>

                <Text size={0} muted>
                  {draft.content || 'Kein Text'}
                </Text>

                <Flex gap={2} align="center">
                  <Text muted size={0}>
                    {new Date(draft._createdAt).toLocaleDateString('de-DE', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </Text>
                  {draft.scheduledFor && (
                    <Badge tone="caution" fontSize={0}>
                      â° {new Date(draft.scheduledFor).toLocaleDateString('de-DE')}
                    </Badge>
                  )}
                  {draft.notes && (
                    <Badge tone="default" fontSize={0}>ðŸ“ Notiz</Badge>
                  )}
                </Flex>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Dialog
          id="delete-draft-confirm"
          header="Draft lÃ¶schen?"
          onClose={() => setDeleteConfirm(null)}
          width={1}
        >
          <Box padding={4}>
            <Stack space={4}>
              <Text size={1}>MÃ¶chtest du diesen Draft wirklich unwiderruflich lÃ¶schen?</Text>
              <Grid columns={2} gap={2}>
                <Button text="Abbrechen" mode="ghost" onClick={() => setDeleteConfirm(null)} />
                <Button text="LÃ¶schen" tone="critical" onClick={() => handleDelete(deleteConfirm)} />
              </Grid>
            </Stack>
          </Box>
        </Dialog>
      )}

      {/* Edit Draft Dialog */}
      {editingDraft && (
        <DraftEditDialog
          draft={editingDraft}
          onSave={handleSaveEdit}
          onClose={() => setEditingDraft(null)}
        />
      )}

      {/* Create Draft Dialog */}
      {showCreateDialog && (
        <DraftCreateDialog
          onCreated={() => { setShowCreateDialog(false); loadDrafts() }}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </Stack>
  )
}

// ============================================
// DRAFT EDIT DIALOG
// ============================================

function DraftEditDialog({ draft, onSave, onClose }: {
  draft: SocialMediaDraft
  onSave: (draft: SocialMediaDraft) => void
  onClose: () => void
}) {
  const [form, setForm] = useState(draft)
  const [saving, setSaving] = useState(false)

  const togglePlatform = (p: string) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms?.includes(p)
        ? prev.platforms.filter(x => x !== p)
        : [...(prev.platforms || []), p],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <Dialog
      id="edit-draft"
      header={`Draft bearbeiten: ${draft.title}`}
      onClose={onClose}
      width={2}
    >
      <Box padding={4}>
        <Stack space={4}>
          <Stack space={2}>
            <Label size={0}>Titel *</Label>
            <TextInput
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.currentTarget.value }))}
              fontSize={1}
            />
          </Stack>

          <Stack space={2}>
            <Label size={0}>Inhalt</Label>
            <TextArea
              rows={8}
              value={form.content}
              onChange={(e) => setForm(prev => ({ ...prev, content: e.currentTarget.value }))}
              fontSize={1}
            />
          </Stack>

          <Grid columns={2} gap={3}>
            <Stack space={2}>
              <Label size={0}>Hashtags</Label>
              <TextInput
                value={form.hashtags || ''}
                onChange={(e) => setForm(prev => ({ ...prev, hashtags: e.currentTarget.value }))}
                fontSize={1}
              />
            </Stack>
            <Stack space={2}>
              <Label size={0}>Fotograf</Label>
              <TextInput
                value={form.photographer || ''}
                onChange={(e) => setForm(prev => ({ ...prev, photographer: e.currentTarget.value }))}
                fontSize={1}
              />
            </Stack>
          </Grid>

          <Stack space={2}>
            <Label size={0}>Plattformen</Label>
            <Grid columns={4} gap={2}>
              {Object.entries(PLATFORM_LABELS).map(([key, { icon, label }]) => (
                <Card
                  key={key}
                  padding={2}
                  radius={2}
                  tone={form.platforms?.includes(key) ? 'primary' : 'default'}
                  shadow={form.platforms?.includes(key) ? 2 : 1}
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                  onClick={() => togglePlatform(key)}
                >
                  <Text size={0} weight={form.platforms?.includes(key) ? 'bold' : 'regular'}>
                    {icon} {label}
                  </Text>
                </Card>
              ))}
            </Grid>
          </Stack>

          <Stack space={2}>
            <Label size={0}>Notizen</Label>
            <TextArea
              rows={3}
              value={form.notes || ''}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.currentTarget.value }))}
              fontSize={1}
            />
          </Stack>

          <Grid columns={2} gap={2}>
            <Button text="Abbrechen" mode="ghost" onClick={onClose} />
            <Button
              text={saving ? 'Speichern...' : 'Speichern'}
              tone="primary"
              onClick={handleSave}
              disabled={saving || !form.title?.trim()}
            />
          </Grid>
        </Stack>
      </Box>
    </Dialog>
  )
}

// ============================================
// DRAFT CREATE DIALOG
// ============================================

function DraftCreateDialog({ onCreated, onClose }: {
  onCreated: () => void
  onClose: () => void
}) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [notes, setNotes] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  const handleCreate = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await client.create({
        _type: 'socialMediaDraft',
        title: title.trim(),
        content,
        hashtags,
        notes,
        platforms,
        platformTexts: {},
        mediaUrls: [],
        createdBy: 'Social Media Studio',
      })
      toast.push({ status: 'success', title: 'Draft erstellt', description: title })
      onCreated()
    } catch (error) {
      console.error('Create draft error:', error)
      toast.push({ status: 'error', title: 'Fehler', description: 'Draft konnte nicht erstellt werden' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      id="create-draft"
      header="Neuen Draft erstellen"
      onClose={onClose}
      width={2}
    >
      <Box padding={4}>
        <Stack space={4}>
          <Stack space={2}>
            <Label size={0}>Titel *</Label>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              placeholder="z.B. Konzert Berlin AnkÃ¼ndigung"
              fontSize={1}
            />
          </Stack>

          <Stack space={2}>
            <Label size={0}>Inhalt</Label>
            <TextArea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.currentTarget.value)}
              placeholder="Post-Text..."
              fontSize={1}
            />
          </Stack>

          <Stack space={2}>
            <Label size={0}>Hashtags</Label>
            <TextInput
              value={hashtags}
              onChange={(e) => setHashtags(e.currentTarget.value)}
              placeholder="#YourBrand #Live"
              fontSize={1}
            />
          </Stack>

          <Stack space={2}>
            <Label size={0}>Plattformen</Label>
            <Grid columns={4} gap={2}>
              {Object.entries(PLATFORM_LABELS).map(([key, { icon, label }]) => (
                <Card
                  key={key}
                  padding={2}
                  radius={2}
                  tone={platforms.includes(key) ? 'primary' : 'default'}
                  shadow={platforms.includes(key) ? 2 : 1}
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                  onClick={() => togglePlatform(key)}
                >
                  <Text size={0} weight={platforms.includes(key) ? 'bold' : 'regular'}>
                    {icon} {label}
                  </Text>
                </Card>
              ))}
            </Grid>
          </Stack>

          <Stack space={2}>
            <Label size={0}>Notizen (optional)</Label>
            <TextArea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.currentTarget.value)}
              placeholder="Interne Notizen..."
              fontSize={1}
            />
          </Stack>

          <Grid columns={2} gap={2}>
            <Button text="Abbrechen" mode="ghost" onClick={onClose} />
            <Button
              text={saving ? 'Erstellen...' : 'Draft erstellen'}
              tone="primary"
              onClick={handleCreate}
              disabled={saving || !title.trim()}
            />
          </Grid>
        </Stack>
      </Box>
    </Dialog>
  )
}

// ============================================
// TEMPLATES PANEL
// ============================================

interface TemplatesPanelProps {
  onApplyTemplate?: (template: SocialMediaTemplate) => void
}

function TemplatesPanel({ onApplyTemplate }: TemplatesPanelProps) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const toast = useToast()
  const [templates, setTemplates] = useState<SocialMediaTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterLanguage, setFilterLanguage] = useState<string>('')
  const [editingTemplate, setEditingTemplate] = useState<SocialMediaTemplate | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Load templates
  const loadTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const query = `*[_type == "socialMediaTemplate"] | order(usageCount desc, _createdAt desc) {
        _id, _createdAt, _updatedAt, title, category, content, hashtags,
        platforms, instagramPostType, language, description,
        exampleData, isActive, usageCount
      }`
      const data = await client.fetch(query)
      setTemplates(data || [])
    } catch (error) {
      console.error('Load templates error:', error)
      toast.push({ status: 'error', title: 'Fehler', description: 'Templates konnten nicht geladen werden' })
    } finally {
      setLoading(false)
    }
  }, [client, toast])

  useEffect(() => { loadTemplates() }, [loadTemplates])

  // Delete template
  const handleDelete = useCallback(async (id: string) => {
    try {
      await client.delete(id)
      setTemplates(prev => prev.filter(t => t._id !== id))
      setDeleteConfirm(null)
      toast.push({ status: 'success', title: 'Template gelÃ¶scht' })
    } catch (error) {
      console.error('Delete template error:', error)
      toast.push({ status: 'error', title: 'Fehler', description: 'Template konnte nicht gelÃ¶scht werden' })
    }
  }, [client, toast])

  // Duplicate template
  const handleDuplicate = useCallback(async (template: SocialMediaTemplate) => {
    try {
      const { _id, _createdAt, _updatedAt, usageCount, ...rest } = template
      await client.create({
        ...rest,
        _type: 'socialMediaTemplate',
        title: `${template.title} (Kopie)`,
        usageCount: 0,
      })
      toast.push({ status: 'success', title: 'Template dupliziert', description: `${template.title} (Kopie)` })
      await loadTemplates()
    } catch (error) {
      console.error('Duplicate template error:', error)
      toast.push({ status: 'error', title: 'Fehler', description: 'Template konnte nicht dupliziert werden' })
    }
  }, [client, toast, loadTemplates])

  // Toggle active status
  const handleToggleActive = useCallback(async (template: SocialMediaTemplate) => {
    try {
      await client.patch(template._id).set({ isActive: !template.isActive }).commit()
      setTemplates(prev => prev.map(t =>
        t._id === template._id ? { ...t, isActive: !t.isActive } : t
      ))
      toast.push({
        status: 'success',
        title: template.isActive ? 'Template deaktiviert' : 'Template aktiviert',
        description: template.title,
      })
    } catch (error) {
      console.error('Toggle active error:', error)
    }
  }, [client, toast])

  // Save edited template
  const handleSaveEdit = useCallback(async (template: SocialMediaTemplate) => {
    try {
      await client.patch(template._id).set({
        title: template.title,
        category: template.category,
        content: template.content,
        hashtags: template.hashtags,
        platforms: template.platforms,
        instagramPostType: template.instagramPostType,
        language: template.language,
        description: template.description,
        exampleData: template.exampleData,
        isActive: template.isActive,
      }).commit()
      setEditingTemplate(null)
      toast.push({ status: 'success', title: 'Template gespeichert', description: template.title })
      await loadTemplates()
    } catch (error) {
      console.error('Save template error:', error)
      toast.push({ status: 'error', title: 'Fehler', description: 'Template konnte nicht gespeichert werden' })
    }
  }, [client, toast, loadTemplates])

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!t.title?.toLowerCase().includes(q) && !t.content?.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false
    }
    if (filterCategory && t.category !== filterCategory) return false
    if (filterLanguage && t.language !== filterLanguage) return false
    return true
  })

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <Stack space={4}>
      {/* Search & Filter Bar */}
      <Card padding={4} radius={2} shadow={1}>
        <Stack space={3}>
          <Flex align="center" gap={2}>
            <Badge tone="primary">ðŸ”</Badge>
            <Text weight="semibold" size={1}>Suchen & Filtern</Text>
            <Box flex={1} />
            <Button
              icon={AddIcon}
              text="Neues Template"
              tone="primary"
              mode="ghost"
              onClick={() => setShowCreateDialog(true)}
              fontSize={1}
              padding={2}
            />
          </Flex>
          <Grid columns={[1, 3]} gap={2}>
            <TextInput
              icon={SearchIcon}
              placeholder="Templates durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              fontSize={1}
            />
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.currentTarget.value)}
              fontSize={1}
            >
              <option value="">Alle Kategorien</option>
              {CATEGORY_OPTIONS.map(c => (
                <option key={c.value} value={c.value}>{c.title}</option>
              ))}
            </Select>
            <Select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.currentTarget.value)}
              fontSize={1}
            >
              <option value="">Alle Sprachen</option>
              <option value="de">ðŸ‡©ðŸ‡ª Deutsch</option>
              <option value="en">ðŸ‡¬ðŸ‡§ English</option>
            </Select>
          </Grid>
          <Text size={0} muted>{filteredTemplates.length} von {templates.length} Template{templates.length !== 1 ? 's' : ''}</Text>
        </Stack>
      </Card>

      {/* Template List */}
      {filteredTemplates.length === 0 ? (
        <Card padding={5} radius={2} shadow={1} tone="transparent">
          <Stack space={3} style={{ textAlign: 'center' }}>
            <Text size={4}>ðŸ“‹</Text>
            <Heading size={1}>Keine Templates gefunden</Heading>
            <Text muted size={1}>
              {templates.length === 0
                ? 'Erstelle dein erstes Template mit "Neues Template"'
                : 'Kein Template passt zu deiner Suche'}
            </Text>
          </Stack>
        </Card>
      ) : (
        <Stack space={2}>
          {filteredTemplates.map((template) => (
            <Card
              key={template._id}
              padding={3}
              radius={2}
              shadow={1}
              tone={template.isActive ? 'default' : 'transparent'}
              style={{ opacity: template.isActive ? 1 : 0.5 }}
            >
              <Stack space={2}>
                <Flex align="center" justify="space-between">
                  <Flex align="center" gap={2} wrap="wrap">
                    <Heading size={0}>
                      {CATEGORY_ICONS[template.category] || 'ðŸ“'} {template.title}
                    </Heading>
                    <Badge tone="default" fontSize={0}>
                      {template.language === 'de' ? 'ðŸ‡©ðŸ‡ª' : 'ðŸ‡¬ðŸ‡§'}
                    </Badge>
                    {!template.isActive && (
                      <Badge tone="caution" fontSize={0}>â¸ Inaktiv</Badge>
                    )}
                    <Badge tone="default" fontSize={0}>
                      {template.usageCount}Ã— verwendet
                    </Badge>
                    {template.platforms?.map(p => (
                      <Badge key={p} tone="primary" fontSize={0}>
                        {PLATFORM_LABELS[p]?.icon} {PLATFORM_LABELS[p]?.label || p}
                      </Badge>
                    ))}
                  </Flex>
                  <Flex gap={1}>
                    {onApplyTemplate && template.isActive && (
                      <Button
                        icon={DocumentsIcon}
                        text="Verwenden"
                        mode="ghost"
                        tone="primary"
                        onClick={() => onApplyTemplate(template)}
                        fontSize={0}
                        padding={2}
                      />
                    )}
                    <Button
                      text={template.isActive ? 'â¸' : 'â–¶'}
                      mode="ghost"
                      onClick={() => handleToggleActive(template)}
                      fontSize={0}
                      padding={2}
                      title={template.isActive ? 'Deaktivieren' : 'Aktivieren'}
                    />
                    <Button
                      icon={EditIcon}
                      mode="ghost"
                      onClick={() => setEditingTemplate({ ...template })}
                      fontSize={0}
                      padding={2}
                      title="Bearbeiten"
                    />
                    <Button
                      icon={CopyIcon}
                      mode="ghost"
                      onClick={() => handleDuplicate(template)}
                      fontSize={0}
                      padding={2}
                      title="Duplizieren"
                    />
                    <Button
                      icon={TrashIcon}
                      mode="ghost"
                      tone="critical"
                      onClick={() => setDeleteConfirm(template._id)}
                      fontSize={0}
                      padding={2}
                      title="LÃ¶schen"
                    />
                  </Flex>
                </Flex>

                {template.description && (
                  <Text muted size={0} style={{ fontStyle: 'italic' }}>
                    {template.description}
                  </Text>
                )}

                <Text size={0} muted>
                  {template.content}
                </Text>

                {template.hashtags && (
                  <Text size={0} style={{ color: '#4a9eff' }}>
                    {template.hashtags}
                  </Text>
                )}
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Dialog
          id="delete-template-confirm"
          header="Template lÃ¶schen?"
          onClose={() => setDeleteConfirm(null)}
          width={1}
        >
          <Box padding={4}>
            <Stack space={4}>
              <Text size={1}>MÃ¶chtest du dieses Template wirklich unwiderruflich lÃ¶schen?</Text>
              <Grid columns={2} gap={2}>
                <Button text="Abbrechen" mode="ghost" onClick={() => setDeleteConfirm(null)} />
                <Button text="LÃ¶schen" tone="critical" onClick={() => handleDelete(deleteConfirm)} />
              </Grid>
            </Stack>
          </Box>
        </Dialog>
      )}

      {/* Edit Template Dialog */}
      {editingTemplate && (
        <TemplateEditDialog
          template={editingTemplate}
          onSave={handleSaveEdit}
          onClose={() => setEditingTemplate(null)}
        />
      )}

      {/* Create Template Dialog */}
      {showCreateDialog && (
        <TemplateCreateDialog
          onCreated={() => { setShowCreateDialog(false); loadTemplates() }}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </Stack>
  )
}

// ============================================
// TEMPLATE EDIT DIALOG
// ============================================

function TemplateEditDialog({ template, onSave, onClose }: {
  template: SocialMediaTemplate
  onSave: (template: SocialMediaTemplate) => void
  onClose: () => void
}) {
  const [form, setForm] = useState(template)
  const [saving, setSaving] = useState(false)

  const togglePlatform = (p: string) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms?.includes(p)
        ? prev.platforms.filter(x => x !== p)
        : [...(prev.platforms || []), p],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <Dialog
      id="edit-template"
      header={`Template bearbeiten: ${template.title}`}
      onClose={onClose}
      width={2}
    >
      <Box padding={4}>
        <Stack space={4}>
          {/* Title + Category + Language row */}
          <Grid columns={[1, 1, 3]} gap={3}>
            <Stack space={2}>
              <Label size={0}>Titel *</Label>
              <TextInput
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.currentTarget.value }))}
                fontSize={1}
              />
            </Stack>
            <Stack space={2}>
              <Label size={0}>Kategorie</Label>
              <Select
                value={form.category}
                onChange={(e) => setForm(prev => ({ ...prev, category: e.currentTarget.value }))}
                fontSize={1}
              >
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.title}</option>
                ))}
              </Select>
            </Stack>
            <Stack space={2}>
              <Label size={0}>Sprache</Label>
              <Select
                value={form.language}
                onChange={(e) => setForm(prev => ({ ...prev, language: e.currentTarget.value }))}
                fontSize={1}
              >
                <option value="de">ðŸ‡©ðŸ‡ª Deutsch</option>
                <option value="en">ðŸ‡¬ðŸ‡§ English</option>
              </Select>
            </Stack>
          </Grid>

          {/* Template Text */}
          <Stack space={2}>
            <Label size={0}>Template-Text *</Label>
            <TextArea
              rows={8}
              value={form.content}
              onChange={(e) => setForm(prev => ({ ...prev, content: e.currentTarget.value }))}
              fontSize={1}
            />
            <Card padding={2} radius={2} tone="transparent" border>
              <Text size={0} muted>
                Platzhalter: {'{title}'} {'{date}'} {'{location}'} {'{venue}'} {'{time}'} {'{price}'} {'{url}'}
              </Text>
            </Card>
          </Stack>

          {/* Hashtags */}
          <Stack space={2}>
            <Label size={0}>Standard-Hashtags</Label>
            <TextInput
              value={form.hashtags || ''}
              onChange={(e) => setForm(prev => ({ ...prev, hashtags: e.currentTarget.value }))}
              fontSize={1}
            />
          </Stack>

          {/* Description */}
          <Stack space={2}>
            <Label size={0}>Beschreibung</Label>
            <TextArea
              rows={2}
              value={form.description || ''}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.currentTarget.value }))}
              fontSize={1}
            />
          </Stack>

          {/* Platforms */}
          <Stack space={2}>
            <Label size={0}>Plattformen</Label>
            <Grid columns={4} gap={2}>
              {Object.entries(PLATFORM_LABELS).map(([key, { icon, label }]) => (
                <Card
                  key={key}
                  padding={2}
                  radius={2}
                  tone={form.platforms?.includes(key) ? 'primary' : 'default'}
                  shadow={form.platforms?.includes(key) ? 2 : 1}
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                  onClick={() => togglePlatform(key)}
                >
                  <Text size={0} weight={form.platforms?.includes(key) ? 'bold' : 'regular'}>
                    {icon} {label}
                  </Text>
                </Card>
              ))}
            </Grid>
          </Stack>

          {/* Active switch */}
          <Card padding={3} radius={2} shadow={1}>
            <Flex align="center" gap={3}>
              <Switch
                checked={form.isActive}
                onChange={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
              />
              <Text size={1} weight="semibold">Template aktiv</Text>
              <Text size={0} muted>
                {form.isActive ? 'Wird in der Template-Auswahl angezeigt' : 'Wird nicht angezeigt'}
              </Text>
            </Flex>
          </Card>

          {/* Actions */}
          <Grid columns={2} gap={2}>
            <Button text="Abbrechen" mode="ghost" onClick={onClose} />
            <Button
              text={saving ? 'Speichern...' : 'Speichern'}
              tone="primary"
              onClick={handleSave}
              disabled={saving || !form.title?.trim() || !form.content?.trim()}
            />
          </Grid>
        </Stack>
      </Box>
    </Dialog>
  )
}

// ============================================
// TEMPLATE CREATE DIALOG
// ============================================

function TemplateCreateDialog({ onCreated, onClose }: {
  onCreated: () => void
  onClose: () => void
}) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('general')
  const [content, setContent] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState('de')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    try {
      await client.create({
        _type: 'socialMediaTemplate',
        title: title.trim(),
        category,
        content: content.trim(),
        hashtags: hashtags.trim(),
        description: description.trim(),
        language,
        platforms,
        isActive: true,
        usageCount: 0,
      })
      toast.push({ status: 'success', title: 'Template erstellt', description: title })
      onCreated()
    } catch (error) {
      console.error('Create template error:', error)
      toast.push({ status: 'error', title: 'Fehler', description: 'Template konnte nicht erstellt werden' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      id="create-template"
      header="Neues Template erstellen"
      onClose={onClose}
      width={2}
    >
      <Box padding={4}>
        <Stack space={4}>
          {/* Title + Category + Language row */}
          <Grid columns={[1, 1, 3]} gap={3}>
            <Stack space={2}>
              <Label size={0}>Titel *</Label>
              <TextInput
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
                placeholder="z.B. Konzert-AnkÃ¼ndigung Deutsch"
                fontSize={1}
              />
            </Stack>
            <Stack space={2}>
              <Label size={0}>Kategorie</Label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.currentTarget.value)}
                fontSize={1}
              >
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.title}</option>
                ))}
              </Select>
            </Stack>
            <Stack space={2}>
              <Label size={0}>Sprache</Label>
              <Select
                value={language}
                onChange={(e) => setLanguage(e.currentTarget.value)}
                fontSize={1}
              >
                <option value="de">ðŸ‡©ðŸ‡ª Deutsch</option>
                <option value="en">ðŸ‡¬ðŸ‡§ English</option>
              </Select>
            </Stack>
          </Grid>

          {/* Template Text */}
          <Stack space={2}>
            <Label size={0}>Template-Text *</Label>
            <TextArea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.currentTarget.value)}
              placeholder={'ðŸŽ¸ {title} in {location}!\n\nðŸ“… {date} um {time}\nðŸ“ {venue}\n\nTickets: {url}'}
              fontSize={1}
            />
            <Card padding={2} radius={2} tone="transparent" border>
              <Text size={0} muted>
                Platzhalter: {'{title}'} {'{date}'} {'{location}'} {'{venue}'} {'{time}'} {'{price}'} {'{url}'}
              </Text>
            </Card>
          </Stack>

          {/* Hashtags */}
          <Stack space={2}>
            <Label size={0}>Standard-Hashtags</Label>
            <TextInput
              value={hashtags}
              onChange={(e) => setHashtags(e.currentTarget.value)}
              placeholder="#YourBrand #Live #Concert"
              fontSize={1}
            />
          </Stack>

          {/* Description */}
          <Stack space={2}>
            <Label size={0}>Beschreibung</Label>
            <TextArea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              placeholder="WofÃ¼r wird dieses Template verwendet?"
              fontSize={1}
            />
          </Stack>

          {/* Platforms */}
          <Stack space={2}>
            <Label size={0}>Plattformen</Label>
            <Grid columns={4} gap={2}>
              {Object.entries(PLATFORM_LABELS).map(([key, { icon, label }]) => (
                <Card
                  key={key}
                  padding={2}
                  radius={2}
                  tone={platforms.includes(key) ? 'primary' : 'default'}
                  shadow={platforms.includes(key) ? 2 : 1}
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                  onClick={() => togglePlatform(key)}
                >
                  <Text size={0} weight={platforms.includes(key) ? 'bold' : 'regular'}>
                    {icon} {label}
                  </Text>
                </Card>
              ))}
            </Grid>
          </Stack>

          {/* Actions */}
          <Grid columns={2} gap={2}>
            <Button text="Abbrechen" mode="ghost" onClick={onClose} />
            <Button
              text={saving ? 'Erstellen...' : 'Template erstellen'}
              tone="primary"
              onClick={handleCreate}
              disabled={saving || !title.trim() || !content.trim()}
            />
          </Grid>
        </Stack>
      </Box>
    </Dialog>
  )
}


