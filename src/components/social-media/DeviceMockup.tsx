'use client'

import React from 'react'
import { Box, Stack, Text, Flex, Card } from '@sanity/ui'

interface DeviceMockupProps {
  platform: string
  username: string
  content: string
  mediaUrl?: string
  mediaUrls?: string[]
  timestamp?: string
}

export function DeviceMockup({
  platform,
  username,
  content,
  mediaUrl,
  mediaUrls = [],
  timestamp,
}: DeviceMockupProps) {
  const media = mediaUrls.length > 0 ? mediaUrls : mediaUrl ? [mediaUrl] : []
  const platformLower = platform.toLowerCase()

  // Instagram/Threads Mockup (iPhone-Style)
  if (platformLower === 'instagram' || platformLower === 'threads') {
    return (
      <Box
        style={{
          width: '375px',
          maxWidth: '100%',
          margin: '0 auto',
          background: '#000',
          borderRadius: '40px',
          padding: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          border: '8px solid #1a1a1a',
        }}
      >
        {/* iPhone Notch */}
        <Box
          style={{
            height: '30px',
            background: '#000',
            borderTopLeftRadius: '32px',
            borderTopRightRadius: '32px',
            position: 'relative',
          }}
        >
          <Box
            style={{
              position: 'absolute',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '120px',
              height: '20px',
              background: '#1a1a1a',
              borderRadius: '0 0 16px 16px',
            }}
          />
        </Box>

        {/* Screen Content */}
        <Box
          style={{
            background: platformLower === 'instagram' ? '#fff' : '#101010',
            borderRadius: '28px',
            overflow: 'hidden',
            minHeight: '600px',
          }}
        >
          {/* App Header */}
          <Card
            padding={3}
            radius={0}
            style={{
              background: platformLower === 'instagram' ? '#fff' : '#000',
              borderBottom: `1px solid ${platformLower === 'instagram' ? '#dbdbdb' : '#262626'}`,
            }}
          >
            <Flex align="center" gap={2}>
              <Box
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: platformLower === 'instagram'
                    ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                    : '#000',
                  border: platformLower === 'threads' ? '1px solid #333' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text size={0} weight="bold" style={{ color: '#fff' }}>
                  {username.charAt(0).toUpperCase()}
                </Text>
              </Box>
              <Stack space={0}>
                <Text
                  size={1}
                  weight="bold"
                  style={{ color: platformLower === 'instagram' ? '#000' : '#fff' }}
                >
                  {username}
                </Text>
                {timestamp && (
                  <Text size={0} muted style={{ color: platformLower === 'instagram' ? '#737373' : '#777' }}>
                    {timestamp}
                  </Text>
                )}
              </Stack>
            </Flex>
          </Card>

          {/* Media */}
          {media.length > 0 && (
            <Box style={{ position: 'relative' }}>
              <img
                src={media[0]}
                alt="Post media"
                style={{
                  width: '100%',
                  display: 'block',
                  aspectRatio: '4/5',
                  objectFit: 'cover',
                }}
              />
              {media.length > 1 && (
                <Box
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '16px',
                    padding: '6px 12px',
                  }}
                >
                  <Text size={0} weight="bold" style={{ color: '#fff' }}>
                    1/{media.length}
                  </Text>
                </Box>
              )}
            </Box>
          )}

          {/* Action Bar */}
          <Card
            padding={3}
            radius={0}
            style={{ background: platformLower === 'instagram' ? '#fff' : '#000' }}
          >
            <Stack space={3}>
              <Flex justify="space-between">
                <Flex gap={3}>
                  <Text style={{ color: platformLower === 'instagram' ? '#000' : '#fff' }}>â¤ï¸</Text>
                  <Text style={{ color: platformLower === 'instagram' ? '#000' : '#fff' }}>ðŸ’¬</Text>
                  <Text style={{ color: platformLower === 'instagram' ? '#000' : '#fff' }}>ðŸ“¤</Text>
                </Flex>
                {platformLower === 'instagram' && <Text>ðŸ”–</Text>}
              </Flex>

              {/* Caption */}
              <Box>
                <Text
                  size={1}
                  style={{
                    color: platformLower === 'instagram' ? '#000' : '#fff',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <strong>{username}</strong> {content}
                </Text>
              </Box>
            </Stack>
          </Card>
        </Box>
      </Box>
    )
  }

  // Twitter/X Mockup (Card-Style)
  if (platformLower === 'twitter' || platformLower === 'x') {
    return (
      <Box
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          background: '#fff',
          borderRadius: '16px',
          border: '1px solid #e1e8ed',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <Card padding={4} radius={0}>
          <Stack space={3}>
            {/* Header */}
            <Flex align="flex-start" gap={3}>
              <Box
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#1da1f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Text size={2} weight="bold" style={{ color: '#fff' }}>
                  {username.charAt(0).toUpperCase()}
                </Text>
              </Box>
              <Stack space={1} flex={1}>
                <Flex align="center" gap={2}>
                  <Text size={2} weight="bold">
                    {username}
                  </Text>
                  <Text size={1} muted>
                    @{username.toLowerCase().replace(/\s/g, '')}
                  </Text>
                </Flex>
                {timestamp && (
                  <Text size={1} muted>
                    {timestamp}
                  </Text>
                )}
              </Stack>
            </Flex>

            {/* Content */}
            <Text size={2} style={{ lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {content}
            </Text>

            {/* Media */}
            {media.length > 0 && (
              <Box
                style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid #e1e8ed',
                }}
              >
                {media.length === 1 && (
                  <img
                    src={media[0]}
                    alt="Tweet media"
                    style={{
                      width: '100%',
                      display: 'block',
                      maxHeight: '400px',
                      objectFit: 'cover',
                    }}
                  />
                )}
                {media.length > 1 && (
                  <Box
                    style={{
                      display: 'grid',
                      gridTemplateColumns: media.length === 2 ? '1fr 1fr' : '1fr 1fr',
                      gap: '2px',
                    }}
                  >
                    {media.slice(0, 4).map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Media ${idx + 1}`}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          objectFit: 'cover',
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* Action Bar */}
            <Flex gap={4} style={{ borderTop: '1px solid #e1e8ed', paddingTop: '12px' }}>
              <Flex align="center" gap={1}>
                <Text>ðŸ’¬</Text>
                <Text size={1} muted>
                  Reply
                </Text>
              </Flex>
              <Flex align="center" gap={1}>
                <Text>ðŸ”„</Text>
                <Text size={1} muted>
                  Retweet
                </Text>
              </Flex>
              <Flex align="center" gap={1}>
                <Text>â¤ï¸</Text>
                <Text size={1} muted>
                  Like
                </Text>
              </Flex>
              <Flex align="center" gap={1}>
                <Text>ðŸ“¤</Text>
                <Text size={1} muted>
                  Share
                </Text>
              </Flex>
            </Flex>
          </Stack>
        </Card>
      </Box>
    )
  }

  // Facebook Mockup (Browser-Style)
  if (platformLower === 'facebook') {
    return (
      <Box
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #dcdee2',
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        }}
      >
        <Card padding={4} radius={0}>
          <Stack space={3}>
            {/* Header */}
            <Flex align="center" gap={2}>
              <Box
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#1877f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text size={1} weight="bold" style={{ color: '#fff' }}>
                  {username.charAt(0).toUpperCase()}
                </Text>
              </Box>
              <Stack space={1}>
                <Text size={1} weight="bold">
                  {username}
                </Text>
                {timestamp && (
                  <Text size={0} muted>
                    {timestamp} Â· ðŸŒ
                  </Text>
                )}
              </Stack>
            </Flex>

            {/* Content */}
            <Text size={1} style={{ lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
              {content}
            </Text>

            {/* Media */}
            {media.length > 0 && (
              <Box style={{ margin: '0 -16px' }}>
                <img
                  src={media[0]}
                  alt="Facebook post media"
                  style={{
                    width: '100%',
                    display: 'block',
                    maxHeight: '500px',
                    objectFit: 'cover',
                  }}
                />
              </Box>
            )}

            {/* Reactions */}
            <Flex
              align="center"
              justify="space-between"
              style={{
                borderTop: '1px solid #e4e6eb',
                borderBottom: '1px solid #e4e6eb',
                padding: '8px 0',
              }}
            >
              <Flex gap={2}>
                <Flex align="center" gap={1}>
                  <Text>ðŸ‘</Text>
                  <Text>â¤ï¸</Text>
                  <Text>ðŸ˜‚</Text>
                </Flex>
              </Flex>
            </Flex>

            {/* Action Buttons */}
            <Flex gap={3} justify="space-around">
              <Button text="ðŸ‘ GefÃ¤llt mir" />
              <Button text="ðŸ’¬ Kommentieren" />
              <Button text="ðŸ“¤ Teilen" />
            </Flex>
          </Stack>
        </Card>
      </Box>
    )
  }

  // Default fallback
  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={3}>
        <Text weight="bold">{username}</Text>
        <Text>{content}</Text>
        {media.length > 0 && (
          <img src={media[0]} alt="Post" style={{ width: '100%', borderRadius: '8px' }} />
        )}
      </Stack>
    </Card>
  )
}

function Button({ text }: { text: string }) {
  return (
    <Box
      as="button"
      style={{
        background: 'transparent',
        border: 'none',
        padding: '8px 12px',
        cursor: 'pointer',
        color: '#65676b',
        fontWeight: 600,
        fontSize: '15px',
      }}
    >
      {text}
    </Box>
  )
}

