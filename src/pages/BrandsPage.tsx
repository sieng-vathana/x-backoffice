import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { brandService } from '../services/brandService'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../context/ToastContext'
import type { BrandResponse, CreateBrandRequest } from '../types/brand'

export const BrandsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BrandResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BrandResponse | null>(null)

  const [form, setForm] = useState<CreateBrandRequest>({
    name: '',
    code: '',
    logoUrl: '',
    description: '',
  })

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandService.getBrands(),
  })

  const filteredBrands = useMemo(() => {
    if (!search.trim()) return brands
    const term = search.toLowerCase()
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(term) ||
        (b.code && b.code.toLowerCase().includes(term))
    )
  }, [brands, search])

  const createMutation = useMutation({
    mutationFn: (data: CreateBrandRequest) => brandService.createBrand(data),
    onSuccess: (b) => {
      success(`Brand "${b.name}" registered!`)
      setIsCreateOpen(false)
      setForm({ name: '', code: '', logoUrl: '', description: '' })
      queryClient.invalidateQueries({ queryKey: ['brands'] })
    },
    onError: (err: any) => error(err.message || 'Failed to create brand.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateBrandRequest }) =>
      brandService.updateBrand(id, data),
    onSuccess: (b) => {
      success(`Brand "${b.name}" updated!`)
      setEditTarget(null)
      queryClient.invalidateQueries({ queryKey: ['brands'] })
    },
    onError: (err: any) => error(err.message || 'Failed to update brand.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => brandService.deleteBrand(id),
    onSuccess: () => {
      success('Brand removed.')
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['brands'] })
    },
    onError: (err: any) => error(err.message || 'Failed to delete brand.'),
  })

  const handleOpenEdit = (brand: BrandResponse) => {
    setEditTarget(brand)
    setForm({
      name: brand.name,
      code: brand.code || '',
      logoUrl: brand.logoUrl || '',
      description: brand.description || '',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Global Brands Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registry of verified manufacturers and brand identities available across products.
          </p>
        </div>

        <button
          onClick={() => {
            setForm({ name: '', code: '', logoUrl: '', description: '' })
            setIsCreateOpen(true)
          }}
          className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs flex items-center gap-2 transition"
        >
          <i className="ri-add-line text-base" />
          Add Brand
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <i className="ri-search-line text-slate-400 text-base" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search brands by name or code..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
            <i className="ri-close-circle-fill text-sm" />
          </button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-16 border border-slate-200/80 text-center text-slate-400">
          <i className="ri-loader-4-line text-3xl animate-spin text-indigo-500 inline-block mb-3" />
          <div className="text-xs font-semibold">Loading brands...</div>
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 border border-slate-200/80 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl mb-3">
            <i className="ri-price-tag-3-line" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Brands Found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
            {search ? 'Try clearing your search term.' : 'Click "Add Brand" to register a new brand.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBrands.map((brand) => (
            <div
              key={brand.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {brand.logoUrl ? (
                    <img
                      src={brand.logoUrl}
                      alt={brand.name}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <i className="ri-price-tag-3-fill text-indigo-500 text-xl" />
                  )}
                </div>

                <div className="mt-3">
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition">
                    {brand.name}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {brand.code ? `Code: ${brand.code}` : `ID: #${brand.id}`}
                  </div>
                  {brand.description && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{brand.description}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(brand)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  title="Edit Brand"
                >
                  <i className="ri-edit-line text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(brand)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Delete Brand"
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
          title="Register Brand"
          subtitle="Add a brand identity available for catalog tagging"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!form.name.trim()) {
                error('Brand name is required')
                return
              }
              createMutation.mutate(form)
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Brand Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Apple, Nike, Samsung..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Brand Code (Optional)</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. APPLE"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Logo URL</label>
              <input
                type="url"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="https://..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Description (Optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short bio or brand summary..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[70px]"
              />
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
                Register Brand
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
          title={`Edit Brand: ${editTarget.name}`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              updateMutation.mutate({ id: editTarget.id, data: form })
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Brand Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Brand Code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Logo URL</label>
              <input
                type="url"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[70px]"
              />
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
          title="Delete Brand"
          message={`Are you sure you want to delete brand "${deleteTarget.name}"?`}
          confirmText="Delete Brand"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
