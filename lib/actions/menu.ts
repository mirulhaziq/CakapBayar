'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getMenuItems() {
  try {
    const items = await prisma.menuItem.findMany({
      where: { userId: 1 },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    return items
  } catch (error) {
    console.error('Error getting menu items:', error)
    return []
  }
}

export async function getAvailableMenuItems() {
  try {
    const items = await prisma.menuItem.findMany({
      where: {
        userId: 1,
        isAvailable: true
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    return items
  } catch (error) {
    console.error('Error getting available menu items:', error)
    return []
  }
}

export async function createMenuItem(data: {
  name: string
  nameMalay: string
  price: number
  category: string
  aliases?: string[]
  imageUrl?: string
}) {
  try {
    const item = await prisma.menuItem.create({
      data: {
        userId: 1,
        name: data.name,
        nameMalay: data.nameMalay,
        price: data.price,
        category: data.category,
        aliases: data.aliases || [],
        imageUrl: data.imageUrl,
        isAvailable: true
      }
    })

    revalidatePath('/menu')
    return { success: true, item }
  } catch (error) {
    console.error('Error creating menu item:', error)
    return { error: 'Gagal menambah item menu' }
  }
}

export async function updateMenuItem(
  id: number,
  data: {
    name?: string
    nameMalay?: string
    price?: number
    category?: string
    aliases?: string[]
    isAvailable?: boolean
    imageUrl?: string
  }
) {
  try {
    const item = await prisma.menuItem.update({
      where: { id },
      data
    })

    revalidatePath('/menu')
    return { success: true, item }
  } catch (error) {
    console.error('Error updating menu item:', error)
    return { error: 'Gagal mengemaskini item menu' }
  }
}

export async function deleteMenuItem(id: number) {
  try {
    await prisma.menuItem.delete({
      where: { id }
    })

    revalidatePath('/menu')
    return { success: true }
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return { error: 'Gagal memadam item menu' }
  }
}

export async function toggleMenuItemAvailability(id: number) {
  try {
    const item = await prisma.menuItem.findUnique({
      where: { id }
    })

    if (!item) {
      return { error: 'Item tidak dijumpai' }
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !item.isAvailable }
    })

    revalidatePath('/menu')
    return { success: true, item: updated }
  } catch (error) {
    console.error('Error toggling availability:', error)
    return { error: 'Gagal mengubah status ketersediaan' }
  }
}

export async function getMenuCategories() {
  try {
    const items = await prisma.menuItem.findMany({
      where: { userId: 1 },
      select: { category: true },
      distinct: ['category']
    })

    return items.map(item => item.category).sort()
  } catch (error) {
    console.error('Error getting categories:', error)
    return []
  }
}
