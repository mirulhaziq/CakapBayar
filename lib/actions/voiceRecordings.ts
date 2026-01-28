'use server'

import prisma from '@/lib/prisma'

export async function saveVoiceRecording(data: {
  audioUrl?: string
  transcription: string
  parsedOrder: any
  confidenceScore: number
  processingTimeMs: number
}) {
  try {
    const recording = await prisma.voiceRecording.create({
      data: {
        userId: 1,
        audioUrl: data.audioUrl,
        transcription: data.transcription,
        parsedOrder: data.parsedOrder,
        confidenceScore: data.confidenceScore,
        processingTimeMs: data.processingTimeMs
      }
    })

    return { success: true, recording }
  } catch (error) {
    console.error('Error saving voice recording:', error)
    return { error: 'Gagal menyimpan rakaman suara' }
  }
}

export async function getVoiceRecordings(limit = 50) {
  try {
    const recordings = await prisma.voiceRecording.findMany({
      where: { userId: 1 },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return recordings
  } catch (error) {
    console.error('Error getting voice recordings:', error)
    return []
  }
}

export async function getVoiceRecordingStats() {
  try {
    const recordings = await prisma.voiceRecording.findMany({
      where: { userId: 1 }
    })

    const totalRecordings = recordings.length
    const avgConfidence = recordings.length > 0
      ? recordings.reduce((sum, r) => sum + Number(r.confidenceScore), 0) / recordings.length
      : 0
    const avgProcessingTime = recordings.length > 0
      ? recordings.reduce((sum, r) => sum + r.processingTimeMs, 0) / recordings.length
      : 0

    return {
      totalRecordings,
      avgConfidence,
      avgProcessingTime
    }
  } catch (error) {
    console.error('Error getting voice recording stats:', error)
    return {
      totalRecordings: 0,
      avgConfidence: 0,
      avgProcessingTime: 0
    }
  }
}
