'use client'

import React from 'react'
import { Card, Stack, Flex, Badge, Text, Label, Grid, TextInput, Select, Switch, Button } from '@sanity/ui'
import { CogIcon } from '@sanity/icons'
import type { TextPosition, TextAlign, StudioState } from '../../lib/types'
import { Slider } from './Slider'
import { TEXT_POSITIONS, TEXT_ALIGNS } from './constants'

interface DesignSettingsPanelProps {
  primaryColor: string
  onPrimaryColorChange: (color: string) => void
  advanced: StudioState['advanced']
  onAdvancedChange: (advanced: StudioState['advanced']) => void
  showAdvanced: boolean
  onShowAdvancedToggle: () => void
}

export function DesignSettingsPanel({
  primaryColor,
  onPrimaryColorChange,
  advanced,
  onAdvancedChange,
  showAdvanced,
  onShowAdvancedToggle,
}: DesignSettingsPanelProps) {
  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={3}>
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={2}>
            <Badge tone="primary">4</Badge>
            <Text weight="semibold" size={1}>Design</Text>
          </Flex>
          <Button
            icon={CogIcon}
            mode="ghost"
            tone={showAdvanced ? 'primary' : 'default'}
            text={showAdvanced ? 'Weniger' : 'Mehr'}
            onClick={onShowAdvancedToggle}
            fontSize={0}
          />
        </Flex>

        <Grid columns={2} gap={3}>
          <Stack space={2}>
            <Label size={0}>PrimÃ¤rfarbe</Label>
            <Flex gap={2} align="center">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => onPrimaryColorChange(e.target.value)}
                style={{ width: '36px', height: '36px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              />
              <TextInput
                value={primaryColor}
                onChange={(e) => onPrimaryColorChange(e.currentTarget?.value || '#dc2626')}
                style={{ flex: 1 }}
                fontSize={1}
              />
            </Flex>
          </Stack>

          <Slider
            label="Text-GrÃ¶ÃŸe"
            value={advanced.textScale}
            min={60}
            max={140}
            step={5}
            unit="%"
            onChange={(v) => onAdvancedChange({ ...advanced, textScale: v })}
          />
        </Grid>

        <Grid columns={2} gap={3}>
          <Stack space={2}>
            <Label size={0}>Text-Position</Label>
            <Select
              value={advanced.textPosition}
              onChange={(e) => {
                const value = e.currentTarget?.value
                if (!value) return
                onAdvancedChange({ ...advanced, textPosition: value as TextPosition })
              }}
              fontSize={1}
            >
              {TEXT_POSITIONS.map((pos) => (
                <option key={pos.value} value={pos.value}>{pos.label}</option>
              ))}
            </Select>
          </Stack>

          <Stack space={2}>
            <Label size={0}>Text-Ausrichtung</Label>
            <Select
              value={advanced.textAlign}
              onChange={(e) => {
                const value = e.currentTarget?.value
                if (!value) return
                onAdvancedChange({ ...advanced, textAlign: value as TextAlign })
              }}
              fontSize={1}
            >
              {TEXT_ALIGNS.map((align) => (
                <option key={align.value} value={align.value}>{align.label}</option>
              ))}
            </Select>
          </Stack>
        </Grid>

        {showAdvanced && (
          <>
            <Slider
              label="Blur-IntensitÃ¤t"
              value={advanced.blurIntensity}
              min={0}
              max={50}
              step={2}
              unit="px"
              onChange={(v) => onAdvancedChange({ ...advanced, blurIntensity: v })}
            />

            <Grid columns={2} gap={3}>
              <Flex align="center" justify="space-between">
                <Label size={0}>QR-Code</Label>
                <Switch
                  checked={advanced.showQRCode}
                  onChange={() => onAdvancedChange({ ...advanced, showQRCode: !advanced.showQRCode })}
                />
              </Flex>

              <Flex align="center" justify="space-between">
                <Label size={0}>Wasserzeichen</Label>
                <Switch
                  checked={advanced.showWatermark}
                  onChange={() => onAdvancedChange({ ...advanced, showWatermark: !advanced.showWatermark })}
                />
              </Flex>
            </Grid>

            {advanced.showWatermark && (
              <Stack space={2}>
                <Label size={0}>Wasserzeichen-Text</Label>
                <TextInput
                  value={advanced.watermarkText}
                  onChange={(e) => onAdvancedChange({ ...advanced, watermarkText: e.currentTarget?.value || 'YOUR SITE' })}
                  fontSize={1}
                />
              </Stack>
            )}

            <Flex align="center" justify="space-between">
              <Label size={0}>Rahmen</Label>
              <Switch
                checked={advanced.showBorder}
                onChange={() => onAdvancedChange({ ...advanced, showBorder: !advanced.showBorder })}
              />
            </Flex>

            {advanced.showBorder && (
              <Grid columns={2} gap={3}>
                <Slider
                  label="Rahmen-Breite"
                  value={advanced.borderWidth}
                  min={2}
                  max={20}
                  step={1}
                  unit="px"
                  onChange={(v) => onAdvancedChange({ ...advanced, borderWidth: v })}
                />
                <Stack space={2}>
                  <Label size={0}>Rahmen-Farbe</Label>
                  <input
                    type="color"
                    value={advanced.borderColor}
                    onChange={(e) => onAdvancedChange({ ...advanced, borderColor: e.target.value })}
                    style={{ width: '100%', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  />
                </Stack>
              </Grid>
            )}
          </>
        )}
      </Stack>
    </Card>
  )
}

