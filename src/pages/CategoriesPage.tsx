import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryService } from '../services/categoryService'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Badge } from '../components/ui/Badge'
import { useToast } from '../context/ToastContext'
import type { CreateCategoryRequest, MarketplaceCategoryResponse } from '../types/category'

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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Platform Marketplace Categories</h1>
          <p className="text-xs text-slate-500 mt-1">
            Centrally curated taxonomies shown on the marketplace storefront. Distinct from individual store categories.
          </p>
        </div>

        <button
          onClick={() => {
            setForm({ name: '', code: '', image: '', featured: false })
            setIsCreateOpen(true)
          }}
          className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs flex items-center gap-2 transition"
        >
          <i className="ri-add-line text-base" />
          Add Platform Category
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
        <i className="ri-information-fill text-indigo-600 text-lg shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Marketplace vs Merchant Categories Architecture:</strong>
          <span className="block mt-0.5 text-indigo-900/80">
            Platform Categories defined here are standardized and displayed across the consumer portal (
            <code className="text-[11px] font-semibold bg-indigo-100/60 px-1 py-0.5 rounded text-indigo-800">portal.learner-teach.online</code>
            ). Merchant stores keep their own independent POS categories for inventory operations without polluting the public marketplace browsing tree.
          </span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <i className="ri-search-line text-slate-400 text-base" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories by name or code..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
            <i className="ri-close-circle-fill text-sm" />
          </button>
        )}
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-16 border border-slate-200/80 text-center text-slate-400">
          <i className="ri-loader-4-line text-3xl animate-spin text-indigo-500 inline-block mb-3" />
          <div className="text-xs font-semibold">Loading marketplace categories...</div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 border border-slate-200/80 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl mb-3">
            <i className="ri-folder-open-line" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Categories Found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
            {search ? 'Try clearing your search term.' : 'Click "Add Platform Category" to create your first category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <i className="ri-folder-fill text-indigo-500 text-xl" />
                    )}
                  </div>
                  {category.featured ? (
                    <Badge variant="indigo">Featured</Badge>
                  ) : (
                    <Badge variant="slate">Standard</Badge>
                  )}
                </div>

                <div className="mt-3">
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition">
                    {category.name}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {category.code ? `Code: ${category.code}` : `ID: #${category.id}`}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(category)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  title="Edit Category"
                >
                  <i className="ri-edit-line text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(category)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Delete Category"
                >
                  <i className="ri-delete-bin-line text-sm" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
              <label className="text-xs font-bold text-slate-700 block mb-1">Category Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Consumer Electronics"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Category Code (Optional)</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. ELECTRONICS"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Icon / Image URL</label>
              <input
                type="url"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="featured"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <label htmlFor="featured" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Feature on Marketplace Home header
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-xs flex items-center gap-2"
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
              <label className="text-xs font-bold text-slate-700 block mb-1">Category Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Category Code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Image URL</label>
              <input
                type="url"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="edit-featured"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <label htmlFor="edit-featured" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Feature on Marketplace Home
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-xs flex items-center gap-2"
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
