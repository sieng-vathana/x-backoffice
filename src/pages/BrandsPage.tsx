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
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Global Brands Directory</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Registry of verified manufacturers and brand identities available across products.
          </p>
        </div>

        <button
          onClick={() => {
            setForm({ name: '', code: '', logoUrl: '', description: '' })
            setIsCreateOpen(true)
          }}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 shadow-2xs transition cursor-pointer"
        >
          <i className="ri-add-line text-sm" />
          Add Brand
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
            placeholder="Search brands by name or code..."
            className="w-full text-xs text-zinc-900 placeholder:text-zinc-400 bg-transparent focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-zinc-400 hover:text-zinc-600 text-xs px-1">
              <i className="ri-close-circle-fill" />
            </button>
          )}
        </div>
        <span className="text-[11px] font-mono text-zinc-400 border-l border-zinc-200 pl-3">
          {filteredBrands.length} {filteredBrands.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Brands Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-zinc-400">
            <i className="ri-loader-4-line text-2xl animate-spin text-zinc-500 inline-block mb-2" />
            <div className="text-xs font-medium">Loading brands directory...</div>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="p-16 text-center text-zinc-500">
            <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto text-xl mb-2">
              <i className="ri-price-tag-3-line" />
            </div>
            <h3 className="text-xs font-semibold text-zinc-900">No Brands Found</h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-0.5">
              {search ? 'Try clearing your search term.' : 'Click "Add Brand" to register a new brand identity.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/75 text-zinc-500 font-medium text-[11px] uppercase tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-2.5">Brand</th>
                  <th className="px-5 py-2.5">Code</th>
                  <th className="px-5 py-2.5">Description</th>
                  <th className="px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredBrands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center shrink-0 p-1">
                          {brand.logoUrl ? (
                            <img
                              src={brand.logoUrl}
                              alt={brand.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                ;(e.target as HTMLElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            <i className="ri-price-tag-3-fill text-zinc-400 text-base" />
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-zinc-900">{brand.name}</span>
                          <span className="text-[11px] font-mono text-zinc-400 block mt-0.2">ID #{brand.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <code className="text-[11px] font-mono font-medium text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200/80">
                        {brand.code || '—'}
                      </code>
                    </td>
                    <td className="px-5 py-3 max-w-sm">
                      <p className="text-zinc-600 truncate text-xs">
                        {brand.description || <span className="text-zinc-400 italic">No description provided</span>}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(brand)}
                          className="px-2.5 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(brand)}
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
              <label className="text-xs font-medium text-zinc-700 block mb-1.5">Brand Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Apple, Nike, Samsung..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 block mb-1.5">Brand Code (Optional)</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. APPLE"
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 block mb-1.5">Logo URL</label>
              <input
                type="url"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="https://..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 block mb-1.5">Description (Optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short bio or brand summary..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition bg-white min-h-[72px]"
              />
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
              <label className="text-xs font-medium text-zinc-700 block mb-1.5">Brand Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 block mb-1.5">Brand Code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 block mb-1.5">Logo URL</label>
              <input
                type="url"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 block mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition bg-white min-h-[72px]"
              />
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
