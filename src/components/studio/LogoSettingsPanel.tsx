'use client'

import React, { useRef } from 'react'
import { Card, Stack, Flex, Badge, Text, Label, Button, Grid, Select } from '@sanity/ui'
import { UploadIcon, ResetIcon } from '@sanity/icons'
import type { LogoPosition } from '../../lib/types'
import { Slider } from './Slider'
import { LOGO_POSITIONS } from './constants'

interface LogoSettingsPanelProps {
  logo: {
    dataUrl: string | null
    position: LogoPosition
    size: number
    opacity: number
  }
  onLogoChange: (logo: {
    dataUrl: string | null
    position: LogoPosition
    size: number
    opacity: number
  }) => void
}

export function LogoSettingsPanel({ logo, onLogoChange }: LogoSettingsPanelProps) {
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      onLogoChange({
        ...logo,
        dataUrl: e.target?.result as string,
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={3}>
        <Flex align="center" gap={2}>
          <Badge tone="primary">5</Badge>
          <Text weight="semibold" size={1}>Logo</Text>
        </Flex>

        <Flex gap={2}>
          <Button
            icon={UploadIcon}
            mode="ghost"
            tone={logo.dataUrl ? 'positive' : 'default'}
            text={logo.dataUrl ? 'Ã„ndern' : 'Hochladen'}
            onClick={() => logoInputRef.current?.click()}
            fontSize={1}
          />
          {logo.dataUrl && (
            <Button
              icon={ResetIcon}
              mode="ghost"
              tone="critical"
              text="Entfernen"
              onClick={() => onLogoChange({ ...logo, dataUrl: null })}
              fontSize={1}
            />
          )}
        </Flex>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          style={{ display: 'none' }}
        />

        {logo.dataUrl && (
          <>
            <Card padding={2} tone="positive" radius={2}>
              <Flex align="center" gap={2}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.dataUrl}
                  alt="Logo"
                  style={{ maxHeight: '35px', maxWidth: '70px' }}
                />
                <Text size={0} muted>Geladen</Text>
              </Flex>
            </Card>

            <Grid columns={2} gap={3}>
              <Stack space={2}>
                <Label size={0}>Position</Label>
                <Select
                  value={logo.position}
                  onChange={(e) => {
                    const value = e.currentTarget?.value
                    if (!value) return
                    onLogoChange({
                      ...logo,
                      position: value as LogoPosition
                    })
                  }}
                  fontSize={1}
                >
                  {LOGO_POSITIONS.map((pos) => (
                    <option key={pos.value} value={pos.value}>{pos.label}</option>
                  ))}
                </Select>
              </Stack>

              <Slider
                label="GrÃ¶ÃŸe"
                value={logo.size}
                min={50}
                max={300}
                step={10}
                unit="px"
                onChange={(v) => onLogoChange({ ...logo, size: v })}
              />
            </Grid>

            <Slider
              label="Deckkraft"
              value={logo.opacity}
              min={10}
              max={100}
              step={5}
              unit="%"
              onChange={(v) => onLogoChange({ ...logo, opacity: v })}
            />
          </>
        )}
      </Stack>
    </Card>
  )
}

