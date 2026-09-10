import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryService } from '../services/categoryService'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Badge } from '../components/ui/Badge'
import { useToast } from '../context/ToastContext'
import type { CreateCategoryRequest, MarketplaceCategoryResponse } from '../types/category'

const CategoryThumbnail: React.FC<{
  image?: string
  name: string
  code?: string
}> = ({ image, name, code }) => {
  const [hasError, setHasError] = useState(false)

  const getFallbackIcon = () => {
    const key = `${code || ''} ${name || ''}`.toUpperCase()
    if (key.includes('CAFE') || key.includes('BEVERAGE') || key.includes('COFFEE') || key.includes('DRINK')) return 'ri-cup-line'
    if (key.includes('RESTAURANT') || key.includes('FOOD') || key.includes('DINING')) return 'ri-restaurant-line'
    if (key.includes('BAKERY') || key.includes('DESSERT') || key.includes('PASTRY')) return 'ri-cake-3-line'
    if (key.includes('GROCERY') || key.includes('MINIMART') || key.includes('SUPERMARKET')) return 'ri-shopping-basket-2-line'
    if (key.includes('FASHION') || key.includes('CLOTH') || key.includes('ACCESSOR')) return 'ri-t-shirt-line'
    if (key.includes('PHARMACY') || key.includes('HEALTH') || key.includes('BEAUTY')) return 'ri-capsule-line'
    if (key.includes('ELECTRONIC') || key.includes('TECH')) return 'ri-macbook-line'
    if (key.includes('RETAIL') || key.includes('STORE')) return 'ri-store-2-line'
    return 'ri-folder-line'
  }

  return (
    <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center shrink-0 p-1">
      {image && !hasError ? (
        <img
          src={image}
          alt={name}
          className="w-full h-full object-contain"
          onError={() => setHasError(true)}
        />
      ) : (
        <i className={`${getFallbackIcon()} text-zinc-700 text-base`} />
      )}
    </div>
  )
}

export const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<MarketplaceCategoryResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MarketplaceCategoryResponse | null>(null)

  const [form, setForm] = useState<CreateCategoryRequest>({
    name: '',
    code: '',
    image: '',
    featured: false,
  })

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getMarketplaceCategories(),
  })

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories
    const term = search.toLowerCase()
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.code && c.code.toLowerCase().includes(term))
    )
  }, [categories, search])

  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoryService.createCategory(data),
    onSuccess: (cat) => {
      success(`Category "${cat.name}" created!`)
      setIsCreateOpen(false)
      setForm({ name: '', code: '', image: '', featured: false })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (err: any) => error(err.message || 'Failed to create category.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateCategoryRequest }) =>
      categoryService.updateCategory(id, data),
    onSuccess: (cat) => {
      success(`Category "${cat.name}" updated!`)
      setEditTarget(null)
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (err: any) => error(err.message || 'Failed to update category.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryService.deleteCategory(id),
    onSuccess: () => {
      success('Category removed.')
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (err: any) => error(err.message || 'Failed to delete category.'),
  })

  const handleOpenEdit = (cat: MarketplaceCategoryResponse) => {
    setEditTarget(cat)
    setForm({
      name: cat.name,
      code: cat.code || '',
      image: cat.image || '',
      featured: cat.featured ?? false,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Marketplace Categories</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Centrally curated taxonomies shown across the consumer marketplace portal.
          </p>
        </div>

        <button
          onClick={() => {
            setForm({ name: '', code: '', image: '', featured: false })
            setIsCreateOpen(true)
          }}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 shadow-2xs transition cursor-pointer"
        >
          <i className="ri-add-line text-sm" />
          Add Category
        </button>
      </div>

      {/* Toolbar / Search Filter */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1">
          <i className="ri-search-line text-zinc-400 text-sm pl-1" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories by name or code..."
            className="w-full text-xs text-zinc-900 placeholder:text-zinc-400 bg-transparent focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-zinc-400 hover:text-zinc-600 text-xs px-1">
              <i className="ri-close-circle-fill" />
            </button>
          )}
        </div>
        <span className="text-[11px] font-mono text-zinc-400 border-l border-zinc-200 pl-3">
          {filteredCategories.length} {filteredCategories.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-zinc-400">
            <i className="ri-loader-4-line text-2xl animate-spin text-zinc-500 inline-block mb-2" />
            <div className="text-xs font-medium">Loading marketplace categories...</div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-16 text-center text-zinc-500">
            <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto text-xl mb-2">
              <i className="ri-folder-open-line" />
            </div>
            <h3 className="text-xs font-semibold text-zinc-900">No Categories Found</h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-0.5">
              {search ? 'Try clearing your search term.' : 'Click "Add Category" to create your first marketplace taxonomy.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/75 text-zinc-500 font-medium text-[11px] uppercase tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-2.5">Category</th>
                  <th className="px-5 py-2.5">Code</th>
                  <th className="px-5 py-2.5">Visibility</th>
                  <th className="px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <CategoryThumbnail
                          image={category.image}
                          name={category.name}
                          code={category.code}
                        />
                        <div>
                          <span className="font-medium text-zinc-900">{category.name}</span>
                          <span className="text-[11px] font-mono text-zinc-400 block mt-0.2">ID #{category.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <code className="text-[11px] font-mono font-medium text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200/80">
                        {category.code || '—'}
                      </code>
                    </td>
                    <td className="px-5 py-3">
                      {category.featured ? (
                        <Badge variant="emerald" dot>
                          Featured on Home
                        </Badge>
                      ) : (
                        <Badge variant="zinc">Standard</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(category)}
                          className="px-2.5 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(category)}
                          className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateOpen(false)}
          title="Create Platform Category"
          subtitle="Add a standardized taxonomy for public marketplace navigation"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!form.name.trim()) {
                error('Category name is required')
                return
              }
              createMutation.mutate(form)
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-medium text-zinc-700 block mb-1.5">Category Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Consumer Electronics"
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 block mb-1.5">Category Code (Optional)</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. ELECTRONICS"
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 block mb-1.5">Icon / Image URL</label>
              <input
                type="url"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition bg-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="featured"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <label htmlFor="featured" className="text-xs text-zinc-700 cursor-pointer select-none">
                Feature on marketplace navigation and home banner
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 shadow-2xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                {createMutation.isPending && <i className="ri-loader-4-line animate-spin" />}
                Create Category
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <Modal
          isOpen={true}
          onClose={() => setEditTarget(null)}
          title={`Edit Category: ${editTarget.name}`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              updateMutation.mutate({ id: editTarget.id, data: form })
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-medium text-zinc-700 block mb-1.5">Category Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 block mb-1.5">Category Code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 block mb-1.5">Image URL</label>
              <input
                type="url"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition bg-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="edit-featured"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <label htmlFor="edit-featured" className="text-xs text-zinc-700 cursor-pointer select-none">
                Feature on marketplace navigation and home banner
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 shadow-2xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                {updateMutation.isPending && <i className="ri-loader-4-line animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          title="Delete Platform Category"
          message={`Are you sure you want to delete category "${deleteTarget.name}"? This will remove it from the marketplace navigation.`}
          confirmText="Delete Category"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
