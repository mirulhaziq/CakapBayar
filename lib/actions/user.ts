'use server'

import prisma from '@/lib/prisma'

export async function getUser(userId = 1) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    return user ? JSON.parse(JSON.stringify(user)) : null
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}
