'use client'

import Link from 'next/link'
import { Pencil, Trash2, Loader2, ExternalLink } from 'lucide-react'
import { deleteCategory, toggleCategoryStatus } from '@/actions/categories'
import { useState, useTransition } from 'react'
import type { Category } from '@/types/database'

export default function CategoryRow({ category }: { category: Category }) {
  const [isPending, startTransition] = useTransition()
  const [deleted, setDeleted] = useState(false)

  if (deleted) return null

  return (
    <tr className="hover:bg-panel2/50 transition-colors group">
      {/* Name & Thumbnail */}
      <td className="px-3.5 sm:px-5 py-3">
        <div className="flex items-center gap-3">
          {category.image_url ? (
            <img
              src={category.image_url}
              alt={category.name}
              className="w-10 h-10 rounded-xl object-cover bg-stone-900 border border-cream-line shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-cream-deep border border-cream-line flex items-center justify-center text-ink/35 text-[10px] font-bold shrink-0">
              IMG
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-ink truncate group-hover:text-[#F72585] transition-colors">
              {category.name}
            </p>
            {category.description ? (
              <p className="text-[11px] text-ink/50 line-clamp-1 max-w-[180px] sm:max-w-xs">
                {category.description}
              </p>
            ) : (
              <p className="text-[10px] text-ink/30 italic">No description</p>
            )}
          </div>
        </div>
      </td>

      {/* Slug */}
      <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
        <code className="text-[11px] bg-cream-deep/80 text-ink/70 px-2 py-0.5 rounded-md font-mono border border-cream-line/50">
          {category.slug || category.id}
        </code>
      </td>

      {/* Status Toggle */}
      <td className="px-2 sm:px-4 py-3">
        <button
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await toggleCategoryStatus(category.id, !category.is_active)
            })
          }}
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold cursor-pointer transition-all duration-150 disabled:opacity-50 select-none ${
            category.is_active
              ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border border-emerald-500/20'
              : 'bg-stone-500/15 text-stone-500 hover:bg-stone-500/25 border border-stone-500/20'
          }`}
        >
          {isPending ? (
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
          ) : (
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                category.is_active ? 'bg-emerald-500' : 'bg-stone-400'
              }`}
            />
          )}
          <span>{category.is_active ? 'Active' : 'Inactive'}</span>
        </button>
      </td>

      {/* Created Date */}
      <td className="px-3 sm:px-4 py-3 text-xs text-ink/55 hidden md:table-cell whitespace-nowrap">
        {new Date(category.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </td>

      {/* Actions */}
      <td className="px-3 sm:px-5 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/shop?category=${category.slug || category.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View in Store"
            className="p-1.5 sm:p-2 rounded-lg text-ink/40 hover:text-[#0891B2] hover:bg-[#36B8C5]/10 transition-colors hidden sm:inline-flex"
          >
            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
          <Link
            href={`/admin/categories/${category.id}/edit`}
            title="Edit Category"
            className="p-1.5 sm:p-2 rounded-lg text-ink/45 hover:text-[#F72585] hover:bg-[#F72585]/10 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
          <button
            type="button"
            disabled={isPending}
            title="Delete Category"
            onClick={() => {
              if (confirm(`Are you sure you want to delete category "${category.name}"?`)) {
                startTransition(async () => {
                  const result = await deleteCategory(category.id)
                  if (result.success) setDeleted(true)
                })
              }
            }}
            className="p-1.5 sm:p-2 rounded-lg text-ink/40 hover:text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
